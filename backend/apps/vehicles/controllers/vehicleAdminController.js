// backend/apps/vehicles/controllers/vehicleAdminController.js
//
// Vehicles admin panel: review everything users publish in the vehicles
// service (cars, motos & bikes, spare parts), same as the property
// "Publication Reviews".
//
//   GET    /api/vehicles/admin/publications?period=today|week|month|year|all&type=all|car|moto|part
//   DELETE /api/vehicles/admin/publications/:kind/:id
//
// Admins, and members with the "vehiclePublications" section (read: list, write: delete).

import mongoose from "mongoose";

import Vehicle from "../models/Vehicle.js";
import SparePart from "../models/SparePart.js";
import SavedVehicle from "../models/SavedVehicle.js";
import SavedSparePart from "../models/SavedSparePart.js";
import User from "../../main/models/User.js";
import { vehicleImages } from "./vehicleController.js";
import { partImages } from "./sparePartController.js";

export const VEHICLE_PUBLICATION_KINDS = ["car", "moto", "part"];
const PERIODS = ["today", "week", "month", "year", "all"];
const MAX_PER_KIND = 300;

const OWNER_FIELDS = "firstName lastName email profileImage";

// Only the fields the review cards need.
const VEHICLE_FIELDS =
    "category motoType title price listingType status condition make model year mileage fuel transmission engineCc publisherType business.name city neighborhood images userId createdAt";
const PART_FIELDS =
    "title price vehicleType partCategory condition brand quantity sellerType business.name compatibility status city neighborhood images userId createdAt";

// Old vehicles have no category: cars.
const KIND_FILTERS = {
    car: { category: { $in: ["car", null] } },
    moto: { category: "moto" },
    part: {},
};

const modelFor = (kind) => (kind === "part" ? SparePart : Vehicle);

export function getPeriodStart(period, now = new Date()) {
    const start = new Date(now);
    switch (period) {
        case "today":
            start.setHours(0, 0, 0, 0);
            return start;
        case "week":
            start.setDate(start.getDate() - 7);
            return start;
        case "month":
            start.setMonth(start.getMonth() - 1);
            return start;
        case "year":
            start.setFullYear(start.getFullYear() - 1);
            return start;
        default:
            return null; // "all"
    }
}

/** Owner name and email for each publication (one query for all owners). */
async function withOwners(items) {
    const ids = [...new Set(items.map((item) => String(item.userId || "")).filter((id) => mongoose.Types.ObjectId.isValid(id)))];
    const owners = ids.length ? await User.find({ _id: { $in: ids } }).select(OWNER_FIELDS).lean() : [];
    const byId = new Map(owners.map((owner) => [String(owner._id), owner]));
    return items.map((item) => ({ ...item, userId: byId.get(String(item.userId)) || item.userId || null }));
}

// GET /api/vehicles/admin/publications
export async function getVehiclePublications(req, res) {
    try {
        const period = String(req.query.period || "today");
        const type = String(req.query.type || "all");

        if (!PERIODS.includes(period)) {
            return res.status(400).json({ success: false, message: "Invalid period." });
        }
        if (type !== "all" && !VEHICLE_PUBLICATION_KINDS.includes(type)) {
            return res.status(400).json({ success: false, message: "Invalid publication type." });
        }

        const now = new Date();
        const start = getPeriodStart(period, now);
        const dateFilter = start ? { createdAt: { $gte: start, $lte: now } } : {};

        // Counts for every kind (filter chips), list for the chosen kind(s).
        const counts = {};
        const lists = await Promise.all(
            VEHICLE_PUBLICATION_KINDS.map(async (kind) => {
                const Model = modelFor(kind);
                const filter = { ...dateFilter, ...KIND_FILTERS[kind] };

                counts[kind] = await Model.countDocuments(filter);
                if (type !== "all" && type !== kind) return [];

                const items = await Model.find(filter)
                    .select(kind === "part" ? PART_FIELDS : VEHICLE_FIELDS)
                    .sort({ createdAt: -1 })
                    .limit(MAX_PER_KIND)
                    .lean();

                return items.map((item) => ({ ...item, kind }));
            })
        );

        const publications = await withOwners(lists.flat().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
        counts.all = VEHICLE_PUBLICATION_KINDS.reduce((sum, kind) => sum + counts[kind], 0);

        return res.status(200).json({ success: true, period, type, counts, count: publications.length, publications });
    } catch (error) {
        console.error("[Vehicles] Admin publications error:", error);
        return res.status(500).json({ success: false, message: "Failed to retrieve publications." });
    }
}

// DELETE /api/vehicles/admin/publications/:kind/:id
export async function deleteVehiclePublication(req, res) {
    try {
        const { kind, id } = req.params;

        if (!VEHICLE_PUBLICATION_KINDS.includes(kind)) {
            return res.status(400).json({ success: false, message: "Invalid publication type." });
        }
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ success: false, message: "Invalid publication ID." });
        }

        const deleted = await modelFor(kind).findOneAndDelete({ _id: id, ...KIND_FILTERS[kind] });
        if (!deleted) {
            return res.status(404).json({ success: false, message: "Publication not found." });
        }

        // Images and saves are removed after the database record; a failure
        // here must not undo the deletion.
        try {
            if (kind === "part") {
                await partImages.deleteImages(deleted.images || []);
                await SavedSparePart.deleteMany({ partId: deleted._id });
            } else {
                await vehicleImages.deleteImages(deleted.images || []);
                await SavedVehicle.deleteMany({ vehicleId: deleted._id });
            }
        } catch (cleanupError) {
            console.error("[Vehicles] Admin delete cleanup error:", cleanupError);
        }

        console.log(`[Vehicles] Admin ${req.user?.userId} deleted ${kind} ${id}`);
        return res.status(200).json({ success: true, message: "Publication deleted successfully.", kind, id });
    } catch (error) {
        console.error("[Vehicles] Admin delete error:", error);
        return res.status(500).json({ success: false, message: "Failed to delete publication." });
    }
}
