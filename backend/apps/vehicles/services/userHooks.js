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
import VehicleRequest from "../models/VehicleRequest.js";
import VehicleRequestResponse from "../models/VehicleRequestResponse.js";
import { vehicleImages } from "../controllers/vehicleController.js";
import { partImages } from "../controllers/sparePartController.js";
import VehiclePortfolioItem from "../models/VehiclePortfolioItem.js";
import VehicleStatEvent from "../models/VehicleStatEvent.js";
import { portfolio } from "../controllers/portfolio/portfolioController.js";

const toObjectId = (id) => new mongoose.Types.ObjectId(String(id));

export const userListDefaults = {
    publishedVehicles: 0,
    activeVehicles: 0,
    publishedParts: 0,
    savedVehicles: 0,
    vehicleAlerts: 0,
    vehicleRequests: 0,
    vehiclePortfolio: 0,
};

// How the admin users list reads these counters (summary and filters).
export const userActivity = {
    publisher: ["publishedVehicles", "publishedParts"],
    activePublisher: ["activeVehicles"],
    saver: ["savedVehicles"],
    alerts: ["vehicleAlerts"],
    requests: ["vehicleRequests"],
    portfolio: ["vehiclePortfolio"],
};

const countByUser = async (Model, field, ids, extraMatch = {}) => {
    const rows = await Model.aggregate([
        { $match: { [field]: { $in: ids }, ...extraMatch } },
        { $group: { _id: `$${field}`, count: { $sum: 1 } } },
    ]);
    return new Map(rows.map((row) => [String(row._id), row.count]));
};

export async function getUserListStats(userIds) {
    const ids = userIds.map(toObjectId);
    const [vehicles, active, parts, savedVehicles, savedParts, alerts, requests, portfolioItems] = await Promise.all([
        countByUser(Vehicle, "userId", ids),
        countByUser(Vehicle, "userId", ids, { status: "Available" }),
        countByUser(SparePart, "userId", ids),
        countByUser(SavedVehicle, "userId", ids, { isSaved: true }),
        countByUser(SavedSparePart, "userId", ids, { isSaved: true }),
        countByUser(VehicleAlert, "user", ids, { isArchived: false }),
        countByUser(VehicleRequest, "userId", ids),
        countByUser(VehiclePortfolioItem, "userId", ids),
    ]);

    const stats = new Map();
    for (const id of ids.map(String)) {
        stats.set(id, {
            publishedVehicles: vehicles.get(id) || 0,
            activeVehicles: active.get(id) || 0,
            publishedParts: parts.get(id) || 0,
            savedVehicles: (savedVehicles.get(id) || 0) + (savedParts.get(id) || 0),
            vehicleAlerts: alerts.get(id) || 0,
            vehicleRequests: requests.get(id) || 0,
            vehiclePortfolio: portfolioItems.get(id) || 0,
        });
    }
    return stats;
}

/** Admin user page: everything of the vehicles service. */
export async function getUserDetailStats(id) {
    const userId = toObjectId(id);
    const [
        totalVehicles,
        availableVehicles,
        cars,
        motos,
        parts,
        availableParts,
        savedVehicles,
        savedParts,
        activeAlerts,
        archivedAlerts,
        requests,
        activeRequests,
        repliesSent,
        articles,
        videos,
        reviews,
        dealer,
    ] = await Promise.all([
        Vehicle.countDocuments({ userId }),
        Vehicle.countDocuments({ userId, status: "Available" }),
        Vehicle.countDocuments({ userId, category: "car" }),
        Vehicle.countDocuments({ userId, category: "moto" }),
        SparePart.countDocuments({ userId }),
        SparePart.countDocuments({ userId, status: "Available" }),
        SavedVehicle.countDocuments({ userId, isSaved: true }),
        SavedSparePart.countDocuments({ userId, isSaved: true }),
        VehicleAlert.countDocuments({ user: userId, isArchived: false }),
        VehicleAlert.countDocuments({ user: userId, isArchived: true }),
        VehicleRequest.countDocuments({ userId }),
        VehicleRequest.countDocuments({ userId, status: "active" }),
        VehicleRequestResponse.countDocuments({ responderId: userId }),
        VehiclePortfolioItem.countDocuments({ userId, type: "article" }),
        VehiclePortfolioItem.countDocuments({ userId, type: "video" }),
        VehicleReview.aggregate([
            { $match: { reviewedUser: userId } },
            { $group: { _id: null, count: { $sum: 1 }, average: { $avg: "$rating" } } },
        ]),
        VehicleDealer.exists({ userId }),
    ]);

    return {
        // Kept for older pages.
        totalVehicles,
        availableVehicles,
        vehicles: {
            vehicles: totalVehicles,
            availableVehicles,
            cars,
            motos,
            parts,
            availableParts,
            saved: savedVehicles + savedParts,
            savedByType: { vehicles: savedVehicles, parts: savedParts },
            activeAlerts,
            archivedAlerts,
            requests,
            activeRequests,
            repliesSent,
            portfolioArticles: articles,
            portfolioVideos: videos,
            reviewsReceived: reviews[0]?.count || 0,
            averageRating: reviews[0] ? Math.round(reviews[0].average * 10) / 10 : 0,
            isDealer: Boolean(dealer),
        },
    };
}

export async function onUserDeleted(userId) {
    // Statistics keep the counts, without the account.
    await VehicleStatEvent.updateMany({ userId }, { $set: { userId: null } });
    // Portfolio: articles, videos and their photos.
    await portfolio.deleteUserItems(userId);
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

    // Requests posted by the user, and replies to them or by them.
    const requestIds = await VehicleRequest.distinct("_id", { userId });
    await VehicleRequestResponse.deleteMany({ $or: [{ requesterId: userId }, { responderId: userId }, { requestId: { $in: requestIds } }] });
    await VehicleRequest.deleteMany({ userId });
}

/* --------------------------------------------------
   Requests ("I am looking for...")
-------------------------------------------------- */

/** Cities and categories of the user's vehicles and spare parts (Settings prefill). */
export async function getPublishingActivity(userId) {
    if (!mongoose.Types.ObjectId.isValid(String(userId))) return {};
    const [vehicles, parts] = await Promise.all([
        Vehicle.find({ userId: toObjectId(userId) }).select("city category listingType").limit(500).lean(),
        SparePart.find({ userId: toObjectId(userId) }).select("city").limit(500).lean(),
    ]);
    if (!vehicles.length && !parts.length) return {};

    const categories = new Set(vehicles.map((vehicle) => (vehicle.category === "moto" ? "moto" : "car")));
    if (parts.length) categories.add("part");
    const transactions = new Set(vehicles.map((vehicle) => (vehicle.listingType === "rent" ? "rent" : "buy")));
    if (parts.length) transactions.add("buy");

    return {
        vehicle: {
            count: vehicles.length + parts.length,
            cities: [...new Set([...vehicles, ...parts].map((item) => item.city).filter(Boolean))],
            categories: [...categories],
            transactions: [...transactions],
        },
    };
}

/** A vehicle or spare part of the replying owner, for "I have a match". */
export async function getListingSummary({ kind, id, ownerId }) {
    if (!["vehicle", "part"].includes(kind) || !mongoose.Types.ObjectId.isValid(String(id))) return null;
    const Model = kind === "part" ? SparePart : Vehicle;
    const item = await Model.findOne({ _id: id, userId: ownerId }).select("title price city images listingType").lean();
    if (!item) return null;

    const image = item.images?.[0];
    return {
        kind,
        id: String(item._id),
        title: item.title || "",
        image: typeof image === "string" ? image : image?.path || "",
        price: Number.isFinite(Number(item.price)) ? Number(item.price) : null,
        priceUnit: kind === "part" ? "each" : item.listingType === "rent" ? "day" : "",
        city: item.city || "",
        link: kind === "part" ? `/vehicles/parts/${item._id}` : `/vehicles/${item._id}`,
    };
}
