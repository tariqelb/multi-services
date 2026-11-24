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

import { deletePropertyImages } from "../middleware/propertyUpload.js";

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
}
