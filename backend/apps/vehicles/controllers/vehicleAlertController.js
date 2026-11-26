// backend/apps/vehicles/controllers/vehicleAlertController.js
//
//   POST   /api/vehicles/alerts              create   { city, listingTypes, categories, bodyTypes, motoTypes, makes, maxPrice }
//   GET    /api/vehicles/alerts              my active alerts (?includeArchived=true: archived too)
//   DELETE /api/vehicles/alerts/:id          archive (the alert stops notifying)
//   PATCH  /api/vehicles/alerts/:id/restore  restore an archived alert
// Same behaviour as the property alerts.

import mongoose from "mongoose";

import VehicleAlert, { MAX_ACTIVE_ALERTS, MAX_ALERT_MAKES } from "../models/VehicleAlert.js";
import { BODY_TYPES, CATEGORIES, LISTING_TYPES, MOTO_TYPES } from "../utils/vehicleOptions.js";

const list = (value) => (Array.isArray(value) ? value : value === undefined || value === null || value === "" ? [] : [value]);
const sameSet = (a = [], b = []) => {
    const left = [...new Set(a.map((item) => String(item).toLowerCase()))].sort();
    const right = [...new Set(b.map((item) => String(item).toLowerCase()))].sort();
    return left.length === right.length && left.every((item, index) => item === right[index]);
};

/** Request body -> { data } or { error }. */
export function buildAlertData(body = {}) {
    const listingTypes = list(body.listingTypes);
    const categories = list(body.categories);
    const bodyTypes = list(body.bodyTypes);
    const motoTypes = list(body.motoTypes);
    const makes = list(body.makes).map((make) => String(make).trim()).filter(Boolean);
    const city = typeof body.city === "string" ? body.city.trim() : "";

    if (!listingTypes.length || listingTypes.some((value) => !LISTING_TYPES.includes(value))) {
        return { error: "Choose for sale, for rent or both." };
    }
    if (!categories.length || categories.some((value) => !CATEGORIES.includes(value))) {
        return { error: "Choose vehicles, motos & bikes or both." };
    }
    if (bodyTypes.some((value) => !BODY_TYPES.includes(value))) return { error: "Unknown vehicle type." };
    if (motoTypes.some((value) => !MOTO_TYPES.includes(value))) return { error: "Unknown moto type." };
    if (makes.length > MAX_ALERT_MAKES) return { error: `Choose at most ${MAX_ALERT_MAKES} makes.` };
    if (city.length > 100) return { error: "City is too long." };

    let maxPrice = null;
    if (body.maxPrice !== undefined && body.maxPrice !== null && body.maxPrice !== "") {
        maxPrice = Number(body.maxPrice);
        if (!Number.isFinite(maxPrice) || maxPrice <= 0) return { error: "The maximum price must be a positive number." };
    }

    return {
        data: {
            city,
            listingTypes,
            categories,
            bodyTypes: categories.includes("car") ? bodyTypes : [],
            motoTypes: categories.includes("moto") ? motoTypes : [],
            makes,
            maxPrice,
        },
    };
}

const isSameAlert = (alert, data) =>
    String(alert.city || "").toLowerCase() === data.city.toLowerCase() &&
    sameSet(alert.listingTypes, data.listingTypes) &&
    sameSet(alert.categories, data.categories) &&
    sameSet(alert.bodyTypes, data.bodyTypes) &&
    sameSet(alert.motoTypes, data.motoTypes) &&
    sameSet(alert.makes, data.makes) &&
    (alert.maxPrice ?? null) === (data.maxPrice ?? null);

export const createVehicleAlert = async (req, res) => {
    try {
        const userId = req.user?.userId;
        if (!userId) return res.status(401).json({ message: "Authentication required." });

        const { data, error } = buildAlertData(req.body);
        if (error) return res.status(400).json({ message: error });

        const active = await VehicleAlert.find({ user: userId, isArchived: { $ne: true } }).lean();
        if (active.length >= MAX_ACTIVE_ALERTS) {
            return res.status(400).json({ message: `You can have at most ${MAX_ACTIVE_ALERTS} active alerts. Archive one first.` });
        }
        if (active.some((alert) => isSameAlert(alert, data))) {
            return res.status(409).json({ message: "You already have this alert." });
        }

        const vehicleAlert = await VehicleAlert.create({ user: userId, ...data });
        return res.status(201).json({ message: "Vehicle alert created successfully.", vehicleAlert });
    } catch (error) {
        if (error.name === "ValidationError") return res.status(400).json({ message: error.message });
        console.error("[Vehicles] Create alert error:", error);
        return res.status(500).json({ message: "Failed to create vehicle alert." });
    }
};

export const getMyVehicleAlerts = async (req, res) => {
    try {
        const userId = req.user?.userId;
        if (!userId) return res.status(401).json({ message: "Authentication required." });

        const filter = { user: userId };
        if (req.query.includeArchived !== "true") filter.isArchived = { $ne: true };

        const vehicleAlerts = await VehicleAlert.find(filter).sort({ createdAt: -1 }).lean();
        return res.status(200).json({ count: vehicleAlerts.length, vehicleAlerts });
    } catch (error) {
        console.error("[Vehicles] Get alerts error:", error);
        return res.status(500).json({ message: "Failed to retrieve vehicle alerts." });
    }
};

async function setArchived(req, res, archived) {
    try {
        const userId = req.user?.userId;
        const { id } = req.params;
        if (!userId) return res.status(401).json({ message: "Authentication required." });
        if (!mongoose.isValidObjectId(id)) return res.status(400).json({ message: "Invalid vehicle alert ID." });

        if (!archived) {
            const active = await VehicleAlert.countDocuments({ user: userId, isArchived: { $ne: true } });
            if (active >= MAX_ACTIVE_ALERTS) {
                return res.status(400).json({ message: `You can have at most ${MAX_ACTIVE_ALERTS} active alerts. Archive one first.` });
            }
        }

        const vehicleAlert = await VehicleAlert.findOneAndUpdate(
            { _id: id, user: userId, isArchived: archived ? { $ne: true } : true },
            { $set: { isArchived: archived, archivedAt: archived ? new Date() : null } },
            { returnDocument: "after" },
        );
        if (!vehicleAlert) {
            return res.status(404).json({ message: archived ? "Active vehicle alert not found." : "Archived vehicle alert not found." });
        }
        return res.status(200).json({
            message: archived ? "Vehicle alert archived successfully." : "Vehicle alert restored successfully.",
            vehicleAlert,
        });
    } catch (error) {
        console.error("[Vehicles] Archive / restore alert error:", error);
        return res.status(500).json({ message: archived ? "Failed to archive vehicle alert." : "Failed to restore vehicle alert." });
    }
}

export const archiveVehicleAlert = (req, res) => setArchived(req, res, true);
export const restoreVehicleAlert = (req, res) => setArchived(req, res, false);
