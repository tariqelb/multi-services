// backend/apps/workers/controllers/workerController.js
//
// Daily worker profiles: one per user, up to 5 trade offers.
//   GET    /api/workers/options          trades, specialties and choices of the form
//   GET    /api/workers                  public list: one card per trade offer (filters, sort, pages)
//   GET    /api/workers/me               my profile (null when not published yet) + prefill
//   PUT    /api/workers/me               publish or update my profile (JSON)
//   PATCH  /api/workers/me/availability  available / busy until
//   PATCH  /api/workers/me/visibility    online / hidden
//   DELETE /api/workers/me               delete my profile and portfolio
//   GET    /api/workers/:id              public profile page

import mongoose from "mongoose";

import WorkerProfile from "../models/WorkerProfile.js";
import WorkerPortfolioItem from "../models/WorkerPortfolioItem.js";
import { extractGoogleMapsLocation } from "../../main/utils/googleMapsLocation.js";
import { createImageUpload } from "../../main/middleware/imageUpload.js";
import User from "../../main/models/User.js";
import { OWNER_CONTACT_FIELDS, contactFromOwner } from "../../main/utils/ownerContact.js";
import { hideSuspended, isHiddenForRequester, isRequesterAdmin } from "../../main/services/accountStatus.js";
import { OTHER_TRADE, TRADE_GROUPS, TRADE_IDS, WORKER_TRADES } from "../data/workerTrades.js";
import {
    AVAILABILITY,
    CONTACT_PREFERENCES,
    COVERAGE,
    GENDERS,
    LANGUAGES,
    MATERIALS,
    MAX_CITIES,
    MAX_CUSTOM_SPECIALTIES,
    MAX_OFFERS,
    MAX_SPECIALTIES,
    PAYMENT_TIMINGS,
    PRICE_REQUIRED,
    PRICE_TYPES,
    SORTS,
    TEAM_MODES,
    WORK_DAYS,
    WORKPLACE_KINDS,
    WORKPLACE_MAX_IMAGES,
} from "../utils/workerOptions.js";
import {
    buildAvailability,
    buildWorkerProfile,
    escapeRegex,
    isAvailableNow,
    normalize,
} from "../utils/workerValidation.js";

// Photos of the workshop / shop / garage, sent with the profile form (field "workplaceImages").
export const workplaceImages = createImageUpload({
    folder: "multi-services/worker-places",
    field: "workplaceImages",
    maxFiles: WORKPLACE_MAX_IMAGES,
});

/** Delete every photo of a profile's workplace (profile or account deleted). */
export const deleteWorkplaceImages = (profile) =>
    profile?.workplace?.images?.length ? workplaceImages.deleteImages(profile.workplace.images) : Promise.resolve();

const isId = (value) => mongoose.Types.ObjectId.isValid(String(value || "")) && /^[a-f\d]{24}$/i.test(String(value));
const sameUser = (a, b) => Boolean(a && b) && String(a) === String(b);
const MAX_LIMIT = 48;

const badRequest = (res, errors, message = "Please check the highlighted fields.") =>
    res.status(400).json({ success: false, message, errors });

/* --------------------------------------------------
   Views
-------------------------------------------------- */

/** Profile as the pages receive it. */
export function toProfileView(profile, { owner = null, now = new Date() } = {}) {
    if (!profile) return null;
    return {
        id: String(profile._id),
        userId: String(profile.userId?._id || profile.userId),
        firstName: profile.firstName,
        lastName: profile.lastName,
        gender: profile.gender || "",
        profileImage: owner?.profileImage || "",
        bio: profile.bio || "",
        hasWorkplace: Boolean(profile.hasWorkplace),
        workplace: profile.hasWorkplace
            ? {
                  kind: profile.workplace?.kind || "",
                  name: profile.workplace?.name || "",
                  address: profile.workplace?.address || "",
                  mapLink: profile.workplace?.mapLink || "",
                  images: (profile.workplace?.images || []).map((image) => ({ filename: image.filename, path: image.path })),
                  location:
                      profile.workplace?.location?.lat != null && profile.workplace?.location?.lng != null
                          ? { lat: profile.workplace.location.lat, lng: profile.workplace.location.lng }
                          : null,
              }
            : null,
        baseCity: profile.baseCity,
        coverage: profile.coverage,
        cities: profile.cities || [],
        workDays: profile.workDays || [],
        hours: profile.hours || { start: "", end: "" },
        hasBreak: Boolean(profile.hasBreak),
        break: profile.hasBreak ? { start: profile.break?.start || "", end: profile.break?.end || "" } : null,
        worksAtNight: Boolean(profile.worksAtNight),
        languages: profile.languages || [],
        teamMode: profile.teamMode,
        teamSize: profile.teamSize,
        hasTools: Boolean(profile.hasTools),
        hasVehicle: Boolean(profile.hasVehicle),
        acceptsUrgent: Boolean(profile.acceptsUrgent),
        contactPreference: profile.contactPreference,
        availability: {
            status: profile.availability?.status || "available",
            busyUntil: profile.availability?.busyUntil || null,
            availableNow: isAvailableNow(profile.availability, now),
        },
        offers: (profile.offers || []).map((offer) => ({
            id: String(offer._id),
            trade: offer.trade,
            customTrade: offer.customTrade || "",
            specialties: offer.specialties || [],
            customSpecialties: offer.customSpecialties || [],
            experienceYears: offer.experienceYears || 0,
            diploma: offer.diploma || "",
            priceType: offer.priceType,
            price: offer.price ?? null,
            paymentTiming: offer.paymentTiming,
            deposit: { required: Boolean(offer.deposit?.required), percent: offer.deposit?.percent ?? null },
            materials: offer.materials,
            visit: { free: offer.visit?.free !== false, fee: offer.visit?.fee ?? null },
            guarantee: offer.guarantee || "",
            description: offer.description || "",
        })),
        status: profile.status,
        views: profile.views || 0,
        createdAt: profile.createdAt,
        updatedAt: profile.updatedAt,
    };
}

/* --------------------------------------------------
   Options
-------------------------------------------------- */

export const getWorkerOptions = (req, res) =>
    res.status(200).json({
        success: true,
        groups: TRADE_GROUPS,
        // keywords: other spellings and Darija words, so the trade pickers find "plombi" or "zellige".
        trades: WORKER_TRADES.map(({ id, group, en, fr, ar, keywords, specialties }) => ({ id, group, en, fr, ar, keywords: keywords || [], specialties })),
        other: OTHER_TRADE,
        limits: { offers: MAX_OFFERS, cities: MAX_CITIES, specialties: MAX_SPECIALTIES, customSpecialties: MAX_CUSTOM_SPECIALTIES },
        priceTypes: PRICE_TYPES,
        priceRequired: [...PRICE_REQUIRED],
        paymentTimings: PAYMENT_TIMINGS,
        materials: MATERIALS,
        coverage: COVERAGE,
        workDays: WORK_DAYS,
        languages: LANGUAGES,
        genders: GENDERS,
        workplaceKinds: WORKPLACE_KINDS,
        workplaceMaxImages: WORKPLACE_MAX_IMAGES,
        teamModes: TEAM_MODES,
        contactPreferences: CONTACT_PREFERENCES,
        availability: AVAILABILITY,
        sorts: SORTS,
    });

/* --------------------------------------------------
   Public list (one card per trade offer)
-------------------------------------------------- */

/** MongoDB filters of the list. Exported for tests. */
export function buildListQuery(query = {}, now = new Date()) {
    const profile = { status: "active" };
    const offer = {};
    const and = [];

    const city = String(query.city || "").trim();
    if (city) {
        const exact = new RegExp(`^${escapeRegex(city)}$`, "i");
        and.push({ $or: [{ coverage: "morocco" }, { cities: exact }, { baseCity: exact }] });
    }

    const q = normalize(query.q || "").trim().slice(0, 80);
    if (q) {
        for (const word of q.split(/\s+/).filter(Boolean).slice(0, 6)) {
            and.push({ searchText: { $regex: escapeRegex(word) } });
        }
    }

    const language = String(query.language || "");
    if (LANGUAGES.includes(language)) profile.languages = language;

    if (query.available === "true" || query.available === "1") {
        and.push({ $or: [{ "availability.status": "available" }, { "availability.busyUntil": { $lte: now } }] });
    }
    if (query.urgent === "true" || query.urgent === "1") profile.acceptsUrgent = true;
    if (query.team === "team") profile.teamMode = "team";
    if (query.workplace === "true" || query.workplace === "1") profile.hasWorkplace = true;
    if (query.night === "true" || query.night === "1") profile.worksAtNight = true;
    const gender = String(query.gender || "");
    if (GENDERS.includes(gender)) profile.gender = gender;

    const trade = String(query.trade || "");
    if (trade && (TRADE_IDS.has(trade) || trade === OTHER_TRADE)) {
        profile.trades = trade;
        offer["offers.trade"] = trade;
    }
    const specialty = String(query.specialty || "");
    if (specialty && /^[A-Za-z]{2,30}$/.test(specialty)) offer["offers.specialties"] = specialty;

    const priceType = String(query.priceType || "");
    if (PRICE_TYPES.includes(priceType)) offer["offers.priceType"] = priceType;

    const maxPrice = Number(query.maxPrice);
    if (Number.isFinite(maxPrice) && maxPrice > 0) offer["offers.price"] = { $ne: null, $lte: maxPrice };

    const minExperience = Number(query.minExperience);
    if (Number.isFinite(minExperience) && minExperience > 0) offer["offers.experienceYears"] = { $gte: minExperience };

    if (query.noDeposit === "true" || query.noDeposit === "1") offer["offers.deposit.required"] = false;

    if (and.length) profile.$and = and;
    return { profile, offer };
}

const SORT_STAGES = {
    newest: { "offers.updatedAt": -1, updatedAt: -1, _id: -1 },
    priceAsc: { hasPrice: -1, "offers.price": 1, _id: -1 },
    priceDesc: { "offers.price": -1, _id: -1 },
    experience: { "offers.experienceYears": -1, _id: -1 },
    available: { availableNow: -1, updatedAt: -1, _id: -1 },
};

/** One list card. */
export function toOfferCard(row, now = new Date()) {
    const offer = row.offers || {};
    const owner = Array.isArray(row.owner) ? row.owner[0] : row.owner;
    return {
        id: String(row._id),
        offerId: String(offer._id || ""),
        userId: String(row.userId),
        firstName: row.firstName,
        lastName: row.lastName,
        gender: row.gender || "",
        profileImage: owner?.profileImage || "",
        // Card picture: the newest photo of the worker's portfolio ("" = default picture).
        // then the first photo of his workshop / shop / garage.
        coverImage: (Array.isArray(row.cover) ? row.cover[0] : row.cover)?.image || (row.hasWorkplace && row.workplace?.images?.[0]?.path) || "",
        worksAtNight: Boolean(row.worksAtNight),
        hasWorkplace: Boolean(row.hasWorkplace),
        workplaceKind: row.hasWorkplace ? row.workplace?.kind || "" : "",
        baseCity: row.baseCity,
        coverage: row.coverage,
        cities: (row.cities || []).slice(0, 4),
        citiesCount: (row.cities || []).length,
        languages: row.languages || [],
        teamMode: row.teamMode,
        teamSize: row.teamSize,
        acceptsUrgent: Boolean(row.acceptsUrgent),
        availability: {
            status: row.availability?.status || "available",
            busyUntil: row.availability?.busyUntil || null,
            availableNow: isAvailableNow(row.availability, now),
        },
        offersCount: row.offersCount || 1,
        trade: offer.trade,
        customTrade: offer.customTrade || "",
        specialties: offer.specialties || [],
        customSpecialties: offer.customSpecialties || [],
        experienceYears: offer.experienceYears || 0,
        priceType: offer.priceType,
        price: offer.price ?? null,
        paymentTiming: offer.paymentTiming,
        deposit: { required: Boolean(offer.deposit?.required), percent: offer.deposit?.percent ?? null },
        updatedAt: offer.updatedAt || row.updatedAt,
    };
}

export const listWorkers = async (req, res) => {
    try {
        const now = new Date();
        const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
        const limit = Math.min(MAX_LIMIT, Math.max(1, Number.parseInt(req.query.limit, 10) || 12));
        const sort = SORT_STAGES[req.query.sort] || SORT_STAGES.newest;

        const { profile, offer } = buildListQuery(req.query, now);
        const match = await hideSuspended(profile);

        const [result] = await WorkerProfile.aggregate([
            { $match: match },
            { $addFields: { offersCount: { $size: { $ifNull: ["$offers", []] } } } },
            { $unwind: "$offers" },
            ...(Object.keys(offer).length ? [{ $match: offer }] : []),
            {
                $addFields: {
                    hasPrice: { $cond: [{ $gt: ["$offers.price", null] }, 1, 0] },
                    availableNow: {
                        $cond: [
                            {
                                $or: [
                                    { $ne: ["$availability.status", "busy"] },
                                    { $and: [{ $gt: ["$availability.busyUntil", null] }, { $lte: ["$availability.busyUntil", now] }] },
                                ],
                            },
                            1,
                            0,
                        ],
                    },
                },
            },
            { $sort: sort },
            {
                $facet: {
                    items: [
                        { $skip: (page - 1) * limit },
                        { $limit: limit },
                        {
                            $lookup: {
                                from: User.collection.name,
                                let: { ownerId: "$userId" },
                                pipeline: [{ $match: { $expr: { $eq: ["$_id", "$$ownerId"] } } }, { $project: { profileImage: 1 } }],
                                as: "owner",
                            },
                        },
                        {
                            $lookup: {
                                from: WorkerPortfolioItem.collection.name,
                                let: { ownerId: "$userId" },
                                pipeline: [
                                    { $match: { $expr: { $eq: ["$userId", "$$ownerId"] }, type: "article", "images.0": { $exists: true } } },
                                    { $sort: { createdAt: -1 } },
                                    { $limit: 1 },
                                    { $project: { _id: 0, image: { $arrayElemAt: ["$images.path", 0] } } },
                                ],
                                as: "cover",
                            },
                        },
                        { $project: { searchText: 0, bio: 0 } },
                    ],
                    total: [{ $count: "count" }],
                },
            },
        ]);

        const total = result?.total?.[0]?.count || 0;
        return res.status(200).json({
            success: true,
            workers: (result?.items || []).map((row) => toOfferCard(row, now)),
            pagination: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) },
        });
    } catch (error) {
        console.error("[Workers] List error:", error);
        return res.status(500).json({ success: false, message: "Unable to load workers." });
    }
};

/* --------------------------------------------------
   Public profile page
-------------------------------------------------- */

export const getWorker = async (req, res) => {
    try {
        if (!isId(req.params.id)) return res.status(400).json({ success: false, message: "Invalid profile ID." });

        const profile = await WorkerProfile.findById(req.params.id).lean();
        if (!profile || (await isHiddenForRequester(profile.userId, req))) {
            return res.status(404).json({ success: false, message: "Worker not found." });
        }

        const viewerId = req.user?.userId || null;
        const isOwner = sameUser(profile.userId, viewerId);
        if (profile.status !== "active" && !isOwner && !(await isRequesterAdmin(req))) {
            return res.status(404).json({ success: false, message: "Worker not found." });
        }

        const owner = await User.findById(profile.userId).select(OWNER_CONTACT_FIELDS).lean();
        if (!owner) return res.status(404).json({ success: false, message: "Worker not found." });

        // Count visits of other people (not the owner), without waiting.
        if (!isOwner) WorkerProfile.updateOne({ _id: profile._id }, { $inc: { views: 1 } }).catch(() => {});

        const contact = contactFromOwner(owner);
        return res.status(200).json({
            success: true,
            worker: {
                ...toProfileView(profile, { owner }),
                isOwner,
                contact: {
                    phone: profile.contactPreference === "whatsapp" ? "" : contact.phone,
                    whatsappNumber: profile.contactPreference === "call" ? "" : contact.whatsappNumber,
                    contactVerified: contact.contactVerified,
                },
            },
        });
    } catch (error) {
        console.error("[Workers] Details error:", error);
        return res.status(500).json({ success: false, message: "Unable to load this worker." });
    }
};

/* --------------------------------------------------
   My profile
-------------------------------------------------- */

const CONTACT_REQUIRED =
    "Verify your phone or WhatsApp number in Settings before publishing: clients need a way to reach you.";

export const getMyWorkerProfile = async (req, res) => {
    try {
        const [profile, user] = await Promise.all([
            WorkerProfile.findOne({ userId: req.user.userId }).lean(),
            User.findById(req.user.userId).select(OWNER_CONTACT_FIELDS).lean(),
        ]);
        const contact = user ? contactFromOwner(user) : null;
        return res.status(200).json({
            success: true,
            profile: toProfileView(profile, { owner: user }),
            prefill: {
                firstName: user?.firstName || "",
                lastName: user?.lastName || "",
                profileImage: user?.profileImage || "",
            },
            contact: contact && {
                phone: contact.phone,
                whatsappNumber: contact.whatsappNumber,
                verified: contact.contactVerified,
                canPublish: Boolean(contact.contactVerified.phone || contact.contactVerified.whatsapp),
            },
        });
    } catch (error) {
        console.error("[Workers] Mine error:", error);
        return res.status(500).json({ success: false, message: "Unable to load your worker profile." });
    }
};

/** The form comes as multipart ("data": JSON + "workplaceImages" files) or as plain JSON. */
export function readProfileBody(req) {
    const raw = req.body?.data;
    if (typeof raw === "string") {
        try {
            return JSON.parse(raw);
        } catch {
            return null;
        }
    }
    return req.body || {};
}

export const saveMyWorkerProfile = async (req, res) => {
    let uploaded = [];
    try {
        const body = readProfileBody(req);
        if (!body) return res.status(400).json({ success: false, message: "Invalid form data." });

        const { data, errors } = buildWorkerProfile(body);
        if (Object.keys(errors).length) return badRequest(res, errors);

        const user = await User.findById(req.user.userId).select(OWNER_CONTACT_FIELDS).lean();
        if (!user) return res.status(404).json({ success: false, message: "Account not found." });
        const { contactVerified } = contactFromOwner(user);
        if (!contactVerified.phone && !contactVerified.whatsapp) {
            return res.status(403).json({ success: false, code: "CONTACT_NOT_VERIFIED", message: CONTACT_REQUIRED });
        }

        let profile = await WorkerProfile.findOne({ userId: req.user.userId });
        const created = !profile;

        // Workplace location: read from its Google Maps link (kept when the link did not change).
        let location = { lat: null, lng: null };
        if (data.hasWorkplace) {
            const previous = profile?.workplace;
            if (previous?.mapLink === data.workplace.mapLink && previous?.location?.lat != null) {
                location = { lat: previous.location.lat, lng: previous.location.lng };
            } else {
                try {
                    location = await extractGoogleMapsLocation(data.workplace.mapLink);
                } catch (error) {
                    return badRequest(res, { "workplace.mapLink": error.message || "This Google Maps link cannot be read." });
                }
            }
        }

        // Workplace photos: the ones kept + the new files (up to 4); the others are deleted after saving.
        const previousImages = (profile?.workplace?.images || []).map((image) => ({ filename: image.filename, path: image.path }));
        const keep = new Set(data.workplace.keepImages || []);
        const kept = data.hasWorkplace ? previousImages.filter((image) => keep.has(image.filename)) : [];
        const files = data.hasWorkplace ? req.files || [] : [];
        if (kept.length + files.length > WORKPLACE_MAX_IMAGES) {
            return badRequest(res, { "workplace.images": `Add up to ${WORKPLACE_MAX_IMAGES} photos of your place.` });
        }
        const dropped = previousImages.filter((image) => !kept.some((item) => item.filename === image.filename));

        if (files.length) uploaded = await workplaceImages.uploadImages(files);

        const { keepImages: _keep, ...place } = data.workplace;
        data.workplace = { ...place, location, images: [...kept, ...uploaded] };

        if (!profile) profile = new WorkerProfile({ userId: req.user.userId });

        // Offers keep their id (and creation date) when they are edited.
        const previous = new Map((profile.offers || []).map((offer) => [String(offer._id), offer]));
        const offers = data.offers.map(({ _id, ...offer }) => {
            const existing = _id && previous.get(_id);
            if (existing) {
                existing.set(offer);
                return existing;
            }
            return offer;
        });

        const { offers: _ignored, ...fields } = data;
        profile.set(fields);
        profile.offers = offers;
        await profile.save();
        uploaded = [];

        if (dropped.length) await workplaceImages.deleteImages(dropped);

        const saved = profile.toObject();
        return res.status(created ? 201 : 200).json({
            success: true,
            message: created ? "Your worker profile is published." : "Your changes are saved.",
            profile: toProfileView(saved, { owner: user }),
        });
    } catch (error) {
        if (uploaded.length) await workplaceImages.deleteImages(uploaded);
        if (error?.code === 11000) return res.status(409).json({ success: false, message: "You already have a worker profile." });
        console.error("[Workers] Save error:", error);
        return res.status(500).json({ success: false, message: "Unable to save your worker profile." });
    }
};

export const setMyAvailability = async (req, res) => {
    try {
        const { data, error } = buildAvailability(req.body || {});
        if (error) return res.status(400).json({ success: false, message: error });

        const profile = await WorkerProfile.findOneAndUpdate(
            { userId: req.user.userId },
            { $set: { availability: data } },
            { new: true }
        ).lean();
        if (!profile) return res.status(404).json({ success: false, message: "Publish your worker profile first." });

        return res.status(200).json({ success: true, availability: toProfileView(profile).availability });
    } catch (error) {
        console.error("[Workers] Availability error:", error);
        return res.status(500).json({ success: false, message: "Unable to change your availability." });
    }
};

export const setMyVisibility = async (req, res) => {
    try {
        const status = String(req.body?.status || "");
        if (!["active", "hidden"].includes(status)) return res.status(400).json({ success: false, message: "Invalid status." });

        const profile = await WorkerProfile.findOneAndUpdate({ userId: req.user.userId }, { $set: { status } }, { new: true }).lean();
        if (!profile) return res.status(404).json({ success: false, message: "Publish your worker profile first." });

        return res.status(200).json({ success: true, status: profile.status });
    } catch (error) {
        console.error("[Workers] Visibility error:", error);
        return res.status(500).json({ success: false, message: "Unable to change your profile." });
    }
};

export function createDeleteMine({ deletePortfolio }) {
    return async (req, res) => {
        try {
            const profile = await WorkerProfile.findOneAndDelete({ userId: req.user.userId });
            if (!profile) return res.status(404).json({ success: false, message: "You have no worker profile." });
            await deleteWorkplaceImages(profile).catch((error) => console.error("[Workers] Workplace photos cleanup:", error));
            await deletePortfolio(req.user.userId).catch((error) => console.error("[Workers] Portfolio cleanup:", error));
            return res.status(200).json({ success: true, message: "Your worker profile is deleted." });
        } catch (error) {
            console.error("[Workers] Delete error:", error);
            return res.status(500).json({ success: false, message: "Unable to delete your worker profile." });
        }
    };
}

/** GET /api/workers/user/:userId -> { id } of that user's worker profile (links from portfolio review). */
export const getWorkerIdByUser = async (req, res) => {
    try {
        if (!isId(req.params.userId)) return res.status(400).json({ success: false, message: "Invalid user ID." });
        const profile = await WorkerProfile.findOne({ userId: req.params.userId }).select("_id status userId").lean();
        if (!profile || (await isHiddenForRequester(profile.userId, req))) {
            return res.status(404).json({ success: false, message: "Worker not found." });
        }
        if (profile.status !== "active" && !sameUser(profile.userId, req.user?.userId) && !(await isRequesterAdmin(req))) {
            return res.status(404).json({ success: false, message: "Worker not found." });
        }
        return res.status(200).json({ success: true, id: String(profile._id) });
    } catch (error) {
        console.error("[Workers] By user error:", error);
        return res.status(500).json({ success: false, message: "Unable to find this worker." });
    }
};
