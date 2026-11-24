// backend/apps/vehicles/controllers/savedVehicleController.js
//
// Saved vehicles, motos and bikes (same idea as the saved properties, apart):
//   GET    /api/vehicles/saved          my saved vehicles (newest saved first)
//   GET    /api/vehicles/saved/ids      ids of my saved vehicles
//   POST   /api/vehicles/:id/save       save
//   DELETE /api/vehicles/:id/save       remove from saved (history kept)
//
// Deleted vehicles disappear from the list; vehicles of suspended accounts
// are hidden; sold, rented or inactive ones stay with their status.

import mongoose from "mongoose";

import Vehicle from "../models/Vehicle.js";
import SavedVehicle from "../models/SavedVehicle.js";
import { getSuspendedUserIds, isHiddenForRequester } from "../../main/services/accountStatus.js";

const HISTORY_LIMIT = 50;
const SAVED_FIELDS =
    "userId category motoType engineCc rangeKm publisherType business.name listingType status condition make model version year mileage fuel transmission bodyType seats price rent.pricePerMonth rent.withDriver rent.insurance sale.negotiable title city neighborhood images createdAt";

const isId = (value) => mongoose.isValidObjectId(String(value || ""));

const historyEntry = (action, at) => ({ $each: [{ action, at }], $slice: -HISTORY_LIMIT });

export const saveVehicle = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { id } = req.params;
        if (!isId(id)) return res.status(400).json({ success: false, message: "Invalid vehicle ID." });

        const vehicle = await Vehicle.findById(id).select("_id userId").lean();
        if (!vehicle || (await isHiddenForRequester(vehicle.userId, req))) {
            return res.status(404).json({ success: false, message: "Vehicle not found." });
        }

        const now = new Date();
        await SavedVehicle.findOneAndUpdate(
            { userId, vehicleId: id },
            {
                $set: { isSaved: true, savedAt: now, unsavedAt: null },
                $setOnInsert: { userId, vehicleId: id },
                $push: { activityHistory: historyEntry("saved", now) },
            },
            { upsert: true, new: true, setDefaultsOnInsert: true },
        );

        return res.status(200).json({ success: true, saved: true, message: "Vehicle saved." });
    } catch (error) {
        console.error("[Vehicles] Save error:", error);
        return res.status(500).json({ success: false, message: "Unable to save this vehicle." });
    }
};

export const unsaveVehicle = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { id } = req.params;
        if (!isId(id)) return res.status(400).json({ success: false, message: "Invalid vehicle ID." });

        const now = new Date();
        const updated = await SavedVehicle.findOneAndUpdate(
            { userId, vehicleId: id, isSaved: { $ne: false } },
            { $set: { isSaved: false, unsavedAt: now }, $push: { activityHistory: historyEntry("unsaved", now) } },
            { new: true },
        );
        if (!updated) return res.status(404).json({ success: false, message: "This vehicle is not in your saved vehicles." });

        return res.status(200).json({ success: true, saved: false, message: "Vehicle removed from your saved vehicles." });
    } catch (error) {
        console.error("[Vehicles] Unsave error:", error);
        return res.status(500).json({ success: false, message: "Unable to remove this vehicle." });
    }
};

/** Saved rows with their vehicle -> list items (deleted / suspended removed). */
export function toSavedItems(rows, suspendedIds = []) {
    const suspended = new Set(suspendedIds.map(String));
    return rows
        .filter((row) => row.vehicleId && !suspended.has(String(row.vehicleId.userId)))
        .map((row) => {
            const { userId: _owner, ...vehicle } = row.vehicleId;
            return { savedAt: row.savedAt, vehicle: { ...vehicle, images: (vehicle.images || []).slice(0, 1) } };
        });
}

export const getSavedVehicles = async (req, res) => {
    try {
        const [rows, suspendedIds] = await Promise.all([
            SavedVehicle.find({ userId: req.user.userId, isSaved: { $ne: false } })
                .sort({ savedAt: -1 })
                .populate("vehicleId", SAVED_FIELDS)
                .lean(),
            getSuspendedUserIds(),
        ]);
        const savedVehicles = toSavedItems(rows, suspendedIds);
        return res.status(200).json({ success: true, count: savedVehicles.length, savedVehicles });
    } catch (error) {
        console.error("[Vehicles] Saved list error:", error);
        return res.status(500).json({ success: false, message: "Unable to load your saved vehicles." });
    }
};

export const getSavedVehicleIds = async (req, res) => {
    try {
        const rows = await SavedVehicle.find({ userId: req.user.userId, isSaved: { $ne: false } }).select("vehicleId").lean();
        return res.status(200).json({ success: true, ids: rows.map((row) => String(row.vehicleId)) });
    } catch (error) {
        console.error("[Vehicles] Saved ids error:", error);
        return res.status(500).json({ success: false, message: "Unable to load your saved vehicles." });
    }
};

/** Is this vehicle saved by this user? (vehicle page) */
export async function isVehicleSaved(userId, vehicleId) {
    if (!userId || !isId(userId) || !isId(vehicleId)) return false;
    return Boolean(await SavedVehicle.exists({ userId, vehicleId, isSaved: { $ne: false } }));
}
