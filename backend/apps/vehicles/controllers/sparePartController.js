// backend/apps/vehicles/controllers/sparePartController.js
//
// Car and moto spare parts (same rules as vehicles). Mounted at /api/vehicles/parts:
//   GET    /                      list (vehicleType, partCategory, make, model, city, q...) public
//   GET    /mine                  my parts, every status                              auth
//   GET    /saved                 my saved parts                                      auth
//   GET    /saved/ids             ids of my saved parts                               auth
//   GET    /by-user/:userId       a seller's public parts (profiles)                  public
//   GET    /:id                   details + seller's current contact                  public
//   GET    /:id/similar           similar parts                                       public
//   POST   /                      publish                                             auth
//   PUT    /:id                   edit                                                owner
//   PATCH  /:id/status            Available / Sold / Inactive                         owner
//   DELETE /:id                   delete (photos too)                                 owner or admin
//   POST   /:id/save, DELETE /:id/save                                                auth

import mongoose from "mongoose";

import SparePart from "../models/SparePart.js";
import SavedSparePart from "../models/SavedSparePart.js";
import User from "../../main/models/User.js";

import { createImageUpload } from "../../main/middleware/imageUpload.js";
import { extractGoogleMapsLocation } from "../../main/utils/googleMapsLocation.js";
import { OWNER_CONTACT_FIELDS, contactFromOwner } from "../../main/utils/ownerContact.js";
import { getSuspendedUserIds, hideSuspended, isHiddenForRequester, isRequesterAdmin } from "../../main/services/accountStatus.js";
import { getVehicleRatingSummary } from "./vehicleProfileController.js";

import { buildSparePartData } from "../utils/sparePartValidation.js";
import { parseList } from "../utils/vehicleValidation.js";
import {
    MAX_PART_IMAGES,
    PART_CATEGORIES,
    PART_CONDITIONS,
    PART_PUBLIC_STATUSES,
    PART_SELLER_TYPES,
    PART_STATUSES,
} from "../utils/sparePartOptions.js";

export const partImages = createImageUpload({ folder: "multi-services/spare-parts", maxFiles: MAX_PART_IMAGES });

const MAX_LIMIT = 48;
const COLLATION = { locale: "fr", strength: 1 };
const HISTORY_LIMIT = 50;

const isId = (value) => mongoose.Types.ObjectId.isValid(String(value || ""));
const sameUser = (a, b) => Boolean(a && b) && String(a) === String(b);
const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const listParam = (value, allowed) => String(value || "").split(",").map((item) => item.trim()).filter((item) => allowed.includes(item));
const numberParam = (value) => {
    if (value === undefined || value === null || value === "") return null;
    const number = Number(value);
    return Number.isFinite(number) ? number : null;
};
const badRequest = (res, errors) =>
    res.status(400).json({ success: false, message: Object.values(errors)[0] || "Please check the form.", errors, field: Object.keys(errors)[0] });

// -----------------------------------------------------------------------------
// List
// -----------------------------------------------------------------------------

export const PART_SORTS = {
    newest: { createdAt: -1, _id: -1 },
    priceAsc: { price: 1, createdAt: -1 },
    priceDesc: { price: -1, createdAt: -1 },
};

/** Query string -> MongoDB filter (pure, tested). */
export function buildPartFilter(query = {}) {
    const filter = {};

    const statuses = listParam(query.status, PART_PUBLIC_STATUSES);
    filter.status = query.status === "all" ? { $in: PART_PUBLIC_STATUSES } : statuses.length ? { $in: statuses } : "Available";

    if (query.vehicleType === "moto") filter.vehicleType = "moto";
    else if (query.vehicleType === "car") filter.vehicleType = { $ne: "moto" };

    const categories = listParam(query.partCategory, PART_CATEGORIES);
    if (categories.length) filter.partCategory = { $in: categories };
    const conditions = listParam(query.condition, PART_CONDITIONS);
    if (conditions.length) filter.condition = { $in: conditions };
    const sellers = listParam(query.sellerType, PART_SELLER_TYPES);
    if (sellers.length) filter.sellerType = { $in: sellers };

    const text = (value) => String(value || "").trim().slice(0, 60);
    if (text(query.city)) filter.city = text(query.city);

    // A part fits the make when it is made for it, or universal.
    const and = [];
    if (text(query.make)) {
        const fits = { "compatibility.make": text(query.make) };
        if (text(query.model)) fits["compatibility.model"] = { $in: [text(query.model), ""] };
        and.push({ $or: [fits, { "compatibility.universal": true }] });
    }
    const year = numberParam(query.year);
    if (year !== null) {
        and.push({ $or: [{ "compatibility.yearFrom": null }, { "compatibility.yearFrom": { $lte: year } }] });
        and.push({ $or: [{ "compatibility.yearTo": null }, { "compatibility.yearTo": { $gte: year } }] });
    }

    const price = {};
    if (numberParam(query.minPrice) !== null) price.$gte = numberParam(query.minPrice);
    if (numberParam(query.maxPrice) !== null) price.$lte = numberParam(query.maxPrice);
    if (Object.keys(price).length) filter.price = price;

    if (query.delivery === "true") filter.delivery = true;

    const q = text(query.q);
    if (q) {
        const pattern = new RegExp(escapeRegex(q), "i");
        and.push({
            $or: [
                { title: pattern },
                { brand: pattern },
                { partNumber: pattern },
                { "compatibility.make": pattern },
                { "compatibility.model": pattern },
                { "compatibility.notes": pattern },
                { "business.name": pattern },
            ],
        });
    }
    if (and.length) filter.$and = and;

    return filter;
}

const LIST_FIELDS =
    "vehicleType partCategory sellerType business.name title brand partNumber condition quantity compatibility price negotiable delivery status city neighborhood images createdAt";

const toListItem = (part) => ({ ...part, images: (part.images || []).slice(0, 1) });

export const listSpareParts = async (req, res) => {
    try {
        const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
        const limit = Math.min(MAX_LIMIT, Math.max(1, Number.parseInt(req.query.limit, 10) || 12));
        const sort = PART_SORTS[req.query.sort] || PART_SORTS.newest;
        const filter = await hideSuspended(buildPartFilter(req.query));

        const [parts, total] = await Promise.all([
            SparePart.find(filter).collation(COLLATION).sort(sort).skip((page - 1) * limit).limit(limit).select(LIST_FIELDS).lean(),
            SparePart.countDocuments(filter).collation(COLLATION),
        ]);

        return res.status(200).json({
            success: true,
            parts: parts.map(toListItem),
            pagination: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) },
        });
    } catch (error) {
        console.error("[SpareParts] List error:", error);
        return res.status(500).json({ success: false, message: "Unable to load spare parts." });
    }
};

export const getMySpareParts = async (req, res) => {
    try {
        const parts = await SparePart.find({ userId: req.user.userId }).sort({ createdAt: -1 }).lean();
        return res.status(200).json({ success: true, parts });
    } catch (error) {
        console.error("[SpareParts] Mine error:", error);
        return res.status(500).json({ success: false, message: "Unable to load your spare parts." });
    }
};

/** A seller's public parts (profiles), newest first, with pages. */
export const getUserSpareParts = async (req, res) => {
    try {
        const { userId } = req.params;
        if (!isId(userId)) return res.status(400).json({ success: false, message: "Invalid user ID." });
        const user = await User.findOne({ _id: userId, accountStatus: "active", deletionRequestedAt: null }).select("_id").lean();
        if (!user) return res.status(404).json({ success: false, message: "Publisher not found." });

        const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
        const limit = Math.min(MAX_LIMIT, Math.max(1, Number.parseInt(req.query.limit, 10) || 12));
        const filter = { userId: new mongoose.Types.ObjectId(String(userId)), status: { $in: PART_PUBLIC_STATUSES } };

        const [parts, total] = await Promise.all([
            SparePart.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).select(LIST_FIELDS).lean(),
            SparePart.countDocuments(filter),
        ]);
        return res.status(200).json({
            success: true,
            parts: parts.map(toListItem),
            pagination: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)), hasMore: (page - 1) * limit + parts.length < total },
        });
    } catch (error) {
        console.error("[SpareParts] Seller parts error:", error);
        return res.status(500).json({ success: false, message: "Unable to load the spare parts." });
    }
};

/** { totalParts, availableParts } of a seller (public statuses, or every status for the owner). */
export async function getPartStatistics(userId, statuses = PART_PUBLIC_STATUSES) {
    const [row] = await SparePart.aggregate([
        { $match: { userId: new mongoose.Types.ObjectId(String(userId)), status: { $in: statuses } } },
        { $group: { _id: null, total: { $sum: 1 }, available: { $sum: { $cond: [{ $eq: ["$status", "Available"] }, 1, 0] } } } },
    ]);
    return { totalParts: row?.total || 0, availableParts: row?.available || 0 };
}

// -----------------------------------------------------------------------------
// Details and similar parts
// -----------------------------------------------------------------------------

export async function isPartSaved(userId, partId) {
    if (!userId || !isId(userId) || !isId(partId)) return false;
    return Boolean(await SavedSparePart.exists({ userId, partId, isSaved: { $ne: false } }));
}

export const getSparePartById = async (req, res) => {
    try {
        if (!isId(req.params.id)) return res.status(400).json({ success: false, message: "Invalid spare part ID." });

        const part = await SparePart.findById(req.params.id).lean();
        if (!part || (await isHiddenForRequester(part.userId, req))) {
            return res.status(404).json({ success: false, message: "Spare part not found." });
        }

        const viewerId = req.user?.userId || null;
        const isOwner = sameUser(part.userId, viewerId);
        const [owner, rating, isSaved] = await Promise.all([
            User.findById(part.userId).select(OWNER_CONTACT_FIELDS).lean(),
            getVehicleRatingSummary(part.userId).catch(() => ({ averageRating: 0, totalReviews: 0 })),
            isPartSaved(viewerId, part._id).catch(() => false),
        ]);

        // Inactive: no contact for visitors (the owner and administrators still see it).
        const contactHidden = part.status === "Inactive" && !isOwner && !(await isRequesterAdmin(req));
        const contact = owner && !contactHidden ? contactFromOwner(owner) : null;

        return res.status(200).json({
            success: true,
            part: {
                ...part,
                isOwner,
                isSaved,
                contactHidden,
                publisher: owner
                    ? {
                          id: String(part.userId),
                          firstName: owner.firstName,
                          lastName: owner.lastName,
                          profileImage: owner.profileImage || "",
                          averageRating: rating.averageRating,
                          totalReviews: rating.totalReviews,
                      }
                    : null,
                contact: contact && { ...contact, email: part.showEmail || isOwner ? contact.email : "" },
            },
        });
    } catch (error) {
        console.error("[SpareParts] Details error:", error);
        return res.status(500).json({ success: false, message: "Unable to load this spare part." });
    }
};

/** Same category, same make, same city, close price (pure, tested). */
export function partSimilarityScore(part, candidate) {
    let score = 0;
    const same = (a, b) => Boolean(a) && String(a).toLowerCase() === String(b || "").toLowerCase();
    if (same(part.partCategory, candidate.partCategory)) score += 3;
    if (same(part.compatibility?.make, candidate.compatibility?.make)) score += 3;
    if (same(part.compatibility?.model, candidate.compatibility?.model)) score += 2;
    if (candidate.compatibility?.universal) score += 1;
    if (same(part.city, candidate.city)) score += 2;
    if (same(part.brand, candidate.brand)) score += 1;
    if (part.price && candidate.price) {
        const ratio = candidate.price / part.price;
        if (ratio >= 0.6 && ratio <= 1.5) score += 1;
    }
    return score;
}

export const getSimilarSpareParts = async (req, res) => {
    try {
        if (!isId(req.params.id)) return res.status(400).json({ success: false, message: "Invalid spare part ID." });
        const part = await SparePart.findById(req.params.id).lean();
        if (!part) return res.status(404).json({ success: false, message: "Spare part not found." });

        const filter = await hideSuspended({
            _id: { $ne: part._id },
            status: "Available",
            vehicleType: part.vehicleType === "moto" ? "moto" : { $ne: "moto" },
        });
        const candidates = await SparePart.find(filter).sort({ createdAt: -1 }).limit(60).select(LIST_FIELDS).lean();
        const parts = candidates
            .map((candidate) => ({ candidate, score: partSimilarityScore(part, candidate) }))
            .filter(({ score }) => score >= 3)
            .sort((a, b) => b.score - a.score || new Date(b.candidate.createdAt) - new Date(a.candidate.createdAt))
            .slice(0, 6)
            .map(({ candidate }) => toListItem(candidate));
        return res.status(200).json({ success: true, parts });
    } catch (error) {
        console.error("[SpareParts] Similar error:", error);
        return res.status(500).json({ success: false, message: "Unable to load similar spare parts." });
    }
};

// -----------------------------------------------------------------------------
// Create / edit / status / delete
// -----------------------------------------------------------------------------

/** Position from the optional Google Maps link ({lat:null,lng:null} without one). */
async function resolveLocation(mapLink, { resolve = extractGoogleMapsLocation } = {}) {
    if (!mapLink) return { lat: null, lng: null };
    try {
        const location = await resolve(mapLink);
        return { lat: location.lat, lng: location.lng };
    } catch (error) {
        error.field = "mapLink";
        throw error;
    }
}

export const createSparePart = async (req, res) => {
    let uploaded = [];
    try {
        const { data, errors } = buildSparePartData(req.body);
        const files = req.files || [];
        if (!files.length) errors.images = "Add at least one photo of the part.";
        if (Object.keys(errors).length) return badRequest(res, errors);

        let location;
        try {
            location = await resolveLocation(data.mapLink);
        } catch (error) {
            return badRequest(res, { mapLink: error.message });
        }

        uploaded = await partImages.uploadImages(files);
        const part = await SparePart.create({ ...data, userId: req.user.userId, status: "Available", location, images: uploaded });
        return res.status(201).json({ success: true, message: "Spare part published.", part });
    } catch (error) {
        if (uploaded.length) await partImages.deleteImages(uploaded);
        console.error("[SpareParts] Create error:", error);
        return res.status(500).json({ success: false, message: "Unable to publish this spare part." });
    }
};

async function findOwnedPart(req, res) {
    if (!isId(req.params.id)) {
        res.status(400).json({ success: false, message: "Invalid spare part ID." });
        return null;
    }
    const part = await SparePart.findById(req.params.id);
    if (!part) {
        res.status(404).json({ success: false, message: "Spare part not found." });
        return null;
    }
    if (!sameUser(part.userId, req.user?.userId)) {
        res.status(403).json({ success: false, message: "You can only change your own spare parts." });
        return null;
    }
    return part;
}

export const updateSparePart = async (req, res) => {
    let uploaded = [];
    try {
        const part = await findOwnedPart(req, res);
        if (!part) return;

        const { data, errors } = buildSparePartData(req.body);
        const removed = new Set(parseList(req.body.removeImages));
        const kept = part.images.filter((image) => !removed.has(image.filename));
        const files = req.files || [];
        if (kept.length + files.length === 0) errors.images = "Add at least one photo of the part.";
        if (kept.length + files.length > MAX_PART_IMAGES) errors.images = `A spare part can have at most ${MAX_PART_IMAGES} photos.`;
        if (Object.keys(errors).length) return badRequest(res, errors);

        let location;
        try {
            const sameLink = data.mapLink === part.mapLink && part.location?.lat != null;
            location = sameLink ? part.location : await resolveLocation(data.mapLink);
        } catch (error) {
            return badRequest(res, { mapLink: error.message });
        }

        uploaded = await partImages.uploadImages(files);
        const dropped = part.images.filter((image) => removed.has(image.filename));
        part.set({ ...data, location, images: [...kept, ...uploaded] });
        await part.save();
        if (dropped.length) await partImages.deleteImages(dropped);

        return res.status(200).json({ success: true, message: "Spare part updated.", part });
    } catch (error) {
        if (uploaded.length) await partImages.deleteImages(uploaded);
        console.error("[SpareParts] Update error:", error);
        return res.status(500).json({ success: false, message: "Unable to update this spare part." });
    }
};

export const updateSparePartStatus = async (req, res) => {
    try {
        const part = await findOwnedPart(req, res);
        if (!part) return;
        const status = String(req.body?.status || "");
        if (!PART_STATUSES.includes(status)) {
            return res.status(400).json({ success: false, message: `Status must be one of: ${PART_STATUSES.join(", ")}.` });
        }
        part.status = status;
        await part.save();
        return res.status(200).json({ success: true, status: part.status });
    } catch (error) {
        console.error("[SpareParts] Status error:", error);
        return res.status(500).json({ success: false, message: "Unable to change the status." });
    }
};

export const deleteSparePart = async (req, res) => {
    try {
        if (!isId(req.params.id)) return res.status(400).json({ success: false, message: "Invalid spare part ID." });
        const part = await SparePart.findById(req.params.id);
        if (!part) return res.status(404).json({ success: false, message: "Spare part not found." });
        if (!sameUser(part.userId, req.user?.userId) && !(await isRequesterAdmin(req))) {
            return res.status(403).json({ success: false, message: "You can only delete your own spare parts." });
        }

        await SparePart.deleteOne({ _id: part._id });
        await partImages.deleteImages(part.images || []);
        Promise.resolve()
            .then(() => SavedSparePart.deleteMany({ partId: part._id }))
            .catch((error) => console.error("[SpareParts] Saved cleanup error:", error.message));

        return res.status(200).json({ success: true, message: "Spare part deleted." });
    } catch (error) {
        console.error("[SpareParts] Delete error:", error);
        return res.status(500).json({ success: false, message: "Unable to delete this spare part." });
    }
};

// -----------------------------------------------------------------------------
// Saved parts
// -----------------------------------------------------------------------------

const historyEntry = (action, at) => ({ $each: [{ action, at }], $slice: -HISTORY_LIMIT });

export const saveSparePart = async (req, res) => {
    try {
        const { id } = req.params;
        if (!isId(id)) return res.status(400).json({ success: false, message: "Invalid spare part ID." });
        const part = await SparePart.findById(id).select("_id userId").lean();
        if (!part || (await isHiddenForRequester(part.userId, req))) {
            return res.status(404).json({ success: false, message: "Spare part not found." });
        }
        const now = new Date();
        const userId = req.user.userId;
        await SavedSparePart.findOneAndUpdate(
            { userId, partId: id },
            {
                $set: { isSaved: true, savedAt: now, unsavedAt: null },
                $setOnInsert: { userId, partId: id },
                $push: { activityHistory: historyEntry("saved", now) },
            },
            { upsert: true, returnDocument: "after", setDefaultsOnInsert: true },
        );
        return res.status(200).json({ success: true, saved: true, message: "Spare part saved." });
    } catch (error) {
        console.error("[SpareParts] Save error:", error);
        return res.status(500).json({ success: false, message: "Unable to save this spare part." });
    }
};

export const unsaveSparePart = async (req, res) => {
    try {
        const { id } = req.params;
        if (!isId(id)) return res.status(400).json({ success: false, message: "Invalid spare part ID." });
        const now = new Date();
        const updated = await SavedSparePart.findOneAndUpdate(
            { userId: req.user.userId, partId: id, isSaved: { $ne: false } },
            { $set: { isSaved: false, unsavedAt: now }, $push: { activityHistory: historyEntry("unsaved", now) } },
            { returnDocument: "after" },
        );
        if (!updated) return res.status(404).json({ success: false, message: "This spare part is not in your saved list." });
        return res.status(200).json({ success: true, saved: false, message: "Removed from your saved spare parts." });
    } catch (error) {
        console.error("[SpareParts] Unsave error:", error);
        return res.status(500).json({ success: false, message: "Unable to remove this spare part." });
    }
};

/** Saved rows with their part -> list items (deleted / suspended removed). */
export function toSavedPartItems(rows, suspendedIds = []) {
    const suspended = new Set(suspendedIds.map(String));
    return rows
        .filter((row) => row.partId && !suspended.has(String(row.partId.userId)))
        .map((row) => {
            const { userId: _owner, ...part } = row.partId;
            return { savedAt: row.savedAt, part: toListItem(part) };
        });
}

export const getSavedSpareParts = async (req, res) => {
    try {
        const [rows, suspendedIds] = await Promise.all([
            SavedSparePart.find({ userId: req.user.userId, isSaved: { $ne: false } })
                .sort({ savedAt: -1 })
                .populate("partId", `userId ${LIST_FIELDS}`)
                .lean(),
            getSuspendedUserIds(),
        ]);
        const savedParts = toSavedPartItems(rows, suspendedIds);
        return res.status(200).json({ success: true, count: savedParts.length, savedParts });
    } catch (error) {
        console.error("[SpareParts] Saved list error:", error);
        return res.status(500).json({ success: false, message: "Unable to load your saved spare parts." });
    }
};
