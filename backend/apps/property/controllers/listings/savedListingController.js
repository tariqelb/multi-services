// backend/apps/property/controllers/listings/savedListingController.js
//
// Saved roommate announcements and hotels / riads (properties keep their
// own /save and /saved routes). :type is "roommate" or "establishment".
//   GET    /api/property/saved-listings?type=roommate   my saved ones (newest saved first)
//   GET    /api/property/saved-listings/:type/:id       { saved } for the details page
//   POST   /api/property/saved-listings/:type/:id       save
//   DELETE /api/property/saved-listings/:type/:id       remove (history kept)
//
// Deleted listings disappear from the list; listings of suspended accounts
// are hidden; full / inactive roommate announcements stay with their status.

import mongoose from "mongoose";

import SavedListing, { SAVED_LISTING_TYPES } from "../../models/SavedListing.js";
import RoommateListing from "../../models/RoommateListing.js";
import Establishment from "../../models/Establishment.js";
import { getSuspendedUserIds, isHiddenForRequester } from "../../../main/services/accountStatus.js";

const HISTORY_LIMIT = 50;
const isId = (value) => mongoose.isValidObjectId(String(value || ""));

const MODELS = {
    roommate: { model: RoommateListing, select: "-fullAddress", populate: { path: "userId", select: "firstName lastName profileImage" } },
    establishment: { model: Establishment, select: "", populate: null },
};

const historyEntry = (action, at) => ({ $each: [{ action, at }], $slice: -HISTORY_LIMIT });

/** { type, id } or an error message. */
export function parseTarget(params = {}) {
    if (!SAVED_LISTING_TYPES.includes(params.type)) return { error: "Unknown listing type." };
    if (!isId(params.id)) return { error: "Invalid listing ID." };
    return { type: params.type, id: params.id };
}

export const saveListing = async (req, res) => {
    try {
        const target = parseTarget(req.params);
        if (target.error) return res.status(400).json({ success: false, message: target.error });

        const listing = await MODELS[target.type].model.findById(target.id).select("_id userId").lean();
        if (!listing || (await isHiddenForRequester(listing.userId, req))) {
            return res.status(404).json({ success: false, message: "Listing not found." });
        }

        const now = new Date();
        const userId = req.user.userId;
        await SavedListing.findOneAndUpdate(
            { userId, listingType: target.type, listingId: target.id },
            {
                $set: { isSaved: true, savedAt: now, unsavedAt: null },
                $setOnInsert: { userId, listingType: target.type, listingId: target.id },
                $push: { activityHistory: historyEntry("saved", now) },
            },
            { upsert: true, returnDocument: "after", setDefaultsOnInsert: true },
        );
        return res.status(200).json({ success: true, saved: true, message: "Saved." });
    } catch (error) {
        console.error("[SavedListing] Save error:", error);
        return res.status(500).json({ success: false, message: "Unable to save this listing." });
    }
};

export const unsaveListing = async (req, res) => {
    try {
        const target = parseTarget(req.params);
        if (target.error) return res.status(400).json({ success: false, message: target.error });

        const now = new Date();
        const updated = await SavedListing.findOneAndUpdate(
            { userId: req.user.userId, listingType: target.type, listingId: target.id, isSaved: { $ne: false } },
            { $set: { isSaved: false, unsavedAt: now }, $push: { activityHistory: historyEntry("unsaved", now) } },
            { returnDocument: "after" },
        );
        if (!updated) return res.status(404).json({ success: false, message: "This listing is not in your saved list." });
        return res.status(200).json({ success: true, saved: false, message: "Removed from your saved list." });
    } catch (error) {
        console.error("[SavedListing] Unsave error:", error);
        return res.status(500).json({ success: false, message: "Unable to remove this listing." });
    }
};

export const getListingSavedStatus = async (req, res) => {
    try {
        const target = parseTarget(req.params);
        if (target.error) return res.status(400).json({ success: false, message: target.error });
        const saved = await SavedListing.exists({ userId: req.user.userId, listingType: target.type, listingId: target.id, isSaved: { $ne: false } });
        return res.status(200).json({ success: true, saved: Boolean(saved) });
    } catch (error) {
        console.error("[SavedListing] Status error:", error);
        return res.status(500).json({ success: false, message: "Unable to load this listing." });
    }
};

/** Saved rows + their listings -> list items (missing / suspended removed). */
export function toSavedItems(rows, listings, suspendedIds = []) {
    const suspended = new Set(suspendedIds.map(String));
    const byId = new Map(listings.map((listing) => [String(listing._id), listing]));
    return rows
        .map((row) => ({ row, listing: byId.get(String(row.listingId)) }))
        .filter(({ listing }) => listing && !suspended.has(String(listing.userId?._id || listing.userId)))
        .map(({ row, listing }) => ({ savedAt: row.savedAt, listing }));
}

export const getSavedListings = async (req, res) => {
    try {
        const type = req.query.type;
        if (!SAVED_LISTING_TYPES.includes(type)) return res.status(400).json({ success: false, message: "Unknown listing type." });

        const rows = await SavedListing.find({ userId: req.user.userId, listingType: type, isSaved: { $ne: false } }).sort({ savedAt: -1 }).lean();
        const { model, select, populate } = MODELS[type];
        let query = model.find({ _id: { $in: rows.map((row) => row.listingId) } });
        if (select) query = query.select(select);
        if (populate) query = query.populate(populate);

        const [listings, suspendedIds] = await Promise.all([query.lean(), getSuspendedUserIds()]);
        const items = toSavedItems(rows, listings, suspendedIds);
        return res.status(200).json({ success: true, type, count: items.length, items });
    } catch (error) {
        console.error("[SavedListing] List error:", error);
        return res.status(500).json({ success: false, message: "Unable to load your saved list." });
    }
};
