// backend/apps/property/services/userHooks.js
//
// What the property service tells the main service about a user:
// admin counters, admin user page statistics, and cleanup on account deletion.

import mongoose from "mongoose";

import Property from "../models/Property.js";
import SavedProperty from "../models/SavedProperty.js";
import PropertyAlert from "../models/PropertyAlert.js";
import RoommateListing from "../models/RoommateListing.js";
import Establishment from "../models/Establishment.js";
import SavedListing from "../models/SavedListing.js";
import Feedback from "../models/Feedback.js";
import PropertyRequest from "../models/PropertyRequest.js";
import PropertyRequestResponse from "../models/PropertyRequestResponse.js";

import { deletePropertyImages } from "../middleware/propertyUpload.js";
import { portfolio } from "../controllers/portfolio/portfolioController.js";

const toObjectId = (id) => new mongoose.Types.ObjectId(String(id));

const countByUser = async (Model, field, userIds, extraMatch = {}) => {
    const rows = await Model.aggregate([
        { $match: { [field]: { $in: userIds }, ...extraMatch } },
        { $group: { _id: `$${field}`, count: { $sum: 1 } } },
    ]);
    return new Map(rows.map((row) => [String(row._id), row.count]));
};

export const userListDefaults = {
    publishedProperties: 0,
    activeProperties: 0,
    savedProperties: 0,
    reports: 0,
};

/** Admin users list: counters for many users in a few grouped queries. */
export async function getUserListStats(userIds) {
    const ids = userIds.map(toObjectId);

    const [published, active, saved, reports] = await Promise.all([
        countByUser(Property, "userId", ids),
        countByUser(Property, "userId", ids, { status: "Available" }),
        countByUser(SavedProperty, "userId", ids, { isSaved: true }),
        countByUser(Feedback, "userId", ids),
    ]);

    const stats = new Map();
    for (const id of ids.map(String)) {
        stats.set(id, {
            publishedProperties: published.get(id) || 0,
            activeProperties: active.get(id) || 0,
            savedProperties: saved.get(id) || 0,
            reports: reports.get(id) || 0,
        });
    }
    return stats;
}

/** Admin user page: same numbers as before the split. */
export async function getUserDetailStats(id) {
    const userId = toObjectId(id);

    const [
        totalPublications,
        availablePublications,
        activeAlerts,
        archivedAlerts,
        savedProperties,
        totalFeedback,
        openFeedback,
        inProgressFeedback,
        resolvedFeedback,
        closedFeedback,
    ] = await Promise.all([
        Property.countDocuments({ userId }),
        Property.countDocuments({ userId, status: "Available" }),
        PropertyAlert.countDocuments({ user: userId, isArchived: false }),
        PropertyAlert.countDocuments({ user: userId, isArchived: true }),
        SavedProperty.countDocuments({ userId, isSaved: true }),
        Feedback.countDocuments({ userId }),
        Feedback.countDocuments({ userId, status: "open" }),
        Feedback.countDocuments({ userId, status: "in_progress" }),
        Feedback.countDocuments({ userId, status: "resolved" }),
        Feedback.countDocuments({ userId, status: "closed" }),
    ]);

    return {
        totalPublications,
        availablePublications,
        activeAlerts,
        archivedAlerts,
        savedProperties,
        totalFeedback,
        feedbackByStatus: {
            open: openFeedback,
            inProgress: inProgressFeedback,
            resolved: resolvedFeedback,
            closed: closedFeedback,
        },
    };
}

/** Account deletion: the user's properties, their images, saves and alerts. */
export async function onUserDeleted(userId) {
    // Portfolio: articles, videos and their photos.
    await portfolio.deleteUserItems(userId);
    const properties = await Property.find({ userId }).select("_id images");
    const propertyIds = properties.map((property) => property._id);

    // Saved references to this user's properties, for all users.
    if (propertyIds.length > 0) {
        await SavedProperty.deleteMany({ propertyId: { $in: propertyIds } });
    }

    // Properties saved by the deleting user.
    await SavedProperty.deleteMany({ userId });

    for (const property of properties) {
        await deletePropertyImages(property.images || []);
    }

    await Property.deleteMany({ userId });
    await PropertyAlert.deleteMany({ user: userId });

    // Saved roommate announcements / hotels: the user's own saves and the
    // saves of the user's announcements and establishments.
    const [roommateIds, establishmentIds] = await Promise.all([
        RoommateListing.distinct("_id", { userId }),
        Establishment.distinct("_id", { userId }),
    ]);
    await SavedListing.deleteMany({
        $or: [
            { userId },
            { listingType: "roommate", listingId: { $in: roommateIds } },
            { listingType: "establishment", listingId: { $in: establishmentIds } },
        ],
    });
    // Requests posted by the user, and replies to them or by them.
    const requestIds = await PropertyRequest.distinct("_id", { userId });
    await PropertyRequestResponse.deleteMany({ $or: [{ requesterId: userId }, { responderId: userId }, { requestId: { $in: requestIds } }] });
    await PropertyRequest.deleteMany({ userId });
}

/* --------------------------------------------------
   Requests ("I am looking for...")
-------------------------------------------------- */

const TRANSACTION_OF = (property) =>
    property.listingType === "For Sale" ? "buy" : property.furnishingStatus === "Furnished" || property.rentalPeriod === "Daily" ? "furnished" : "rent";

/** Cities, transactions and types of the user's properties (Settings prefill). */
export async function getPublishingActivity(userId) {
    if (!mongoose.Types.ObjectId.isValid(String(userId))) return {};
    const properties = await Property.find({ userId: toObjectId(userId) })
        .select("city listingType propertyType furnishingStatus rentalPeriod")
        .limit(500)
        .lean();
    if (!properties.length) return {};

    return {
        property: {
            count: properties.length,
            cities: [...new Set(properties.map((property) => property.city).filter(Boolean))],
            transactions: [...new Set(properties.map(TRANSACTION_OF))],
            types: [...new Set(properties.map((property) => property.propertyType).filter(Boolean))],
        },
    };
}

/** A property of the replying owner, for "I have a match". */
export async function getListingSummary({ kind, id, ownerId }) {
    if (kind !== "property" || !mongoose.Types.ObjectId.isValid(String(id))) return null;
    const property = await Property.findOne({ _id: id, userId: ownerId }).select("title price city images listingType rentalPeriod").lean();
    if (!property) return null;

    return {
        kind: "property",
        id: String(property._id),
        title: property.title || "",
        image: property.images?.[0]?.path || "",
        price: Number.isFinite(Number(property.price)) ? Number(property.price) : null,
        priceUnit: property.listingType === "For Rent" ? (property.rentalPeriod === "Daily" ? "day" : "month") : "",
        city: property.city || "",
        link: `/properties/${property._id}`,
    };
}
