// backend/apps/vehicles/services/userHooks.js
//
// What the vehicles service tells the main service about a user:
// admin counters, admin user page statistics, cleanup on account deletion.

import mongoose from "mongoose";

import Vehicle from "../models/Vehicle.js";
import VehicleDealer from "../models/VehicleDealer.js";
import VehicleAlert from "../models/VehicleAlert.js";
import VehicleReview from "../models/VehicleReview.js";
import SavedVehicle from "../models/SavedVehicle.js";
import SparePart from "../models/SparePart.js";
import SavedSparePart from "../models/SavedSparePart.js";
import { vehicleImages } from "../controllers/vehicleController.js";
import { partImages } from "../controllers/sparePartController.js";

const toObjectId = (id) => new mongoose.Types.ObjectId(String(id));

export const userListDefaults = { publishedVehicles: 0 };

export async function getUserListStats(userIds) {
    const rows = await Vehicle.aggregate([
        { $match: { userId: { $in: userIds.map(toObjectId) } } },
        { $group: { _id: "$userId", count: { $sum: 1 } } },
    ]);
    return new Map(rows.map((row) => [String(row._id), { publishedVehicles: row.count }]));
}

export async function getUserDetailStats(id) {
    const userId = toObjectId(id);
    const [totalVehicles, availableVehicles] = await Promise.all([
        Vehicle.countDocuments({ userId }),
        Vehicle.countDocuments({ userId, status: "Available" }),
    ]);
    return { totalVehicles, availableVehicles };
}

export async function onUserDeleted(userId) {
    const vehicles = await Vehicle.find({ userId }).select("images").lean();
    // What this user saved, and the saves of this user's vehicles.
    await SavedVehicle.deleteMany({ $or: [{ userId }, { vehicleId: { $in: vehicles.map((vehicle) => vehicle._id) } }] });
    for (const vehicle of vehicles) await vehicleImages.deleteImages(vehicle.images || []);
    await Vehicle.deleteMany({ userId });
    await VehicleDealer.deleteMany({ userId });
    await VehicleAlert.deleteMany({ user: userId });
    // Reviews received and reviews written.
    await VehicleReview.deleteMany({ $or: [{ reviewedUser: userId }, { reviewer: userId }] });

    // Spare parts: photos, the parts, what this user saved and the saves of the parts.
    const parts = await SparePart.find({ userId }).select("images").lean();
    await SavedSparePart.deleteMany({ $or: [{ userId }, { partId: { $in: parts.map((part) => part._id) } }] });
    for (const part of parts) await partImages.deleteImages(part.images || []);
    await SparePart.deleteMany({ userId });
}
