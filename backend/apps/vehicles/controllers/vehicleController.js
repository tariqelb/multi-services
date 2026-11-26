// backend/apps/vehicles/controllers/vehicleController.js
//
//   GET    /api/vehicles                 list (category=car|moto, filters...) public
//   GET    /api/vehicles/map             available vehicles with a map position     public
//   GET    /api/vehicles/mine            my vehicles, every status                 auth
//   GET    /api/vehicles/dealers/me      my business profile (agency/showroom) auth
//   GET    /api/vehicles/:id             details + owner's current contact     public
//   GET    /api/vehicles/:id/similar     similar vehicles                      public
//   POST   /api/vehicles                 publish                                auth
//   PUT    /api/vehicles/:id             edit                                   owner
//   PATCH  /api/vehicles/:id/status      Available / Sold / Rented / Inactive   owner
//   DELETE /api/vehicles/:id             delete (photos too)                    owner or admin

import mongoose from "mongoose";

import { notifyMatchingVehicleAlerts } from "../services/vehicleAlertNotifier.js";
import Vehicle from "../models/Vehicle.js";
import VehicleDealer from "../models/VehicleDealer.js";
import User from "../../main/models/User.js";

import { createImageUpload } from "../../main/middleware/imageUpload.js";
import { extractGoogleMapsLocation } from "../../main/utils/googleMapsLocation.js";
import { OWNER_CONTACT_FIELDS, contactFromOwner } from "../../main/utils/ownerContact.js";
import { getVehicleRatingSummary } from "./vehicleProfileController.js";
import { isVehicleSaved } from "./savedVehicleController.js";
import SavedVehicle from "../models/SavedVehicle.js";
import { cityCenter } from "../../main/utils/moroccoCityCenters.js";
import {
    hideSuspended,
    isHiddenForRequester,
    isRequesterAdmin,
} from "../../main/services/accountStatus.js";

import { buildVehicleData, parseList } from "../utils/vehicleValidation.js";
import {
    BODY_TYPES,
    BUSINESS_TYPES,
    CONDITIONS,
    ALL_FUELS,
    LISTING_TYPES,
    MAX_IMAGES,
    MOTO_TYPES,
    PUBLISHER_TYPES,
    TRANSMISSIONS,
    getAllowedStatuses,
    statusForListingType,
} from "../utils/vehicleOptions.js";

export const vehicleImages = createImageUpload({ folder: "multi-services/vehicles", maxFiles: MAX_IMAGES });

const PUBLIC_STATUSES = ["Available", "Sold", "Rented"];
const MAX_LIMIT = 48;
const COLLATION = { locale: "fr", strength: 1 };

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
    res.status(400).json({
        success: false,
        message: Object.values(errors)[0] || "Please check the form.",
        errors,
        field: Object.keys(errors)[0],
    });

// -----------------------------------------------------------------------------
// List
// -----------------------------------------------------------------------------

export const SORTS = {
    newest: { createdAt: -1, _id: -1 },
    priceAsc: { price: 1, createdAt: -1 },
    priceDesc: { price: -1, createdAt: -1 },
    yearDesc: { year: -1, createdAt: -1 },
    mileageAsc: { mileage: 1, createdAt: -1 },
};

/** Query string -> MongoDB filter (pure, tested). */
export function buildListFilter(query = {}) {
    const filter = {};

    const statuses = listParam(query.status, PUBLIC_STATUSES);
    filter.status = query.status === "all" ? { $in: PUBLIC_STATUSES } : statuses.length ? { $in: statuses } : "Available";

    // Section: motos, or cars (old listings without a category are cars).
    if (query.category === "moto") filter.category = "moto";
    else if (query.category === "car") filter.category = { $ne: "moto" };
    const motoTypes = listParam(query.motoType, MOTO_TYPES);
    if (motoTypes.length) filter.motoType = { $in: motoTypes };

    if (LISTING_TYPES.includes(query.listingType)) filter.listingType = query.listingType;
    if (CONDITIONS.includes(query.condition)) filter.condition = query.condition;

    const text = (value) => String(value || "").trim().slice(0, 60);
    if (text(query.make)) filter.make = text(query.make);
    if (text(query.model)) filter.model = text(query.model);
    if (text(query.city)) filter.city = text(query.city);

    const fuels = listParam(query.fuel, ALL_FUELS);
    if (fuels.length) filter.fuel = { $in: fuels };
    const gearboxes = listParam(query.transmission, TRANSMISSIONS);
    if (gearboxes.length) filter.transmission = { $in: gearboxes };
    const bodies = listParam(query.bodyType, BODY_TYPES);
    if (bodies.length) filter.bodyType = { $in: bodies };
    const publishers = listParam(query.publisherType, PUBLISHER_TYPES);
    if (publishers.length) filter.publisherType = { $in: publishers };

    const range = (field, min, max) => {
        const condition = {};
        if (min !== null) condition.$gte = min;
        if (max !== null) condition.$lte = max;
        if (Object.keys(condition).length) filter[field] = condition;
    };
    range("price", numberParam(query.minPrice), numberParam(query.maxPrice));
    range("year", numberParam(query.minYear), numberParam(query.maxYear));
    range("mileage", null, numberParam(query.maxMileage));
    if (numberParam(query.minSeats) !== null) filter.seats = { $gte: numberParam(query.minSeats) };

    if (query.withDriver === "true") filter["rent.withDriver"] = true;
    if (query.insurance === "comprehensive") filter["rent.insurance"] = "comprehensive";

    const q = text(query.q);
    if (q) {
        const pattern = new RegExp(escapeRegex(q), "i");
        filter.$or = [{ title: pattern }, { make: pattern }, { model: pattern }, { version: pattern }, { "business.name": pattern }, { "customFields.value": pattern }];
    }

    return filter;
}

const LIST_FIELDS =
    "category motoType engineCc rangeKm publisherType business.name listingType status condition make model version year mileage fuel transmission bodyType seats price rent.pricePerMonth rent.withDriver rent.insurance sale.negotiable title city neighborhood location images createdAt";

const toListItem = (vehicle) => ({ ...vehicle, images: (vehicle.images || []).slice(0, 1) });

export const listVehicles = async (req, res) => {
    try {
        const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
        const limit = Math.min(MAX_LIMIT, Math.max(1, Number.parseInt(req.query.limit, 10) || 12));
        const sort = SORTS[req.query.sort] || SORTS.newest;

        const filter = await hideSuspended(buildListFilter(req.query));

        const [vehicles, total] = await Promise.all([
            Vehicle.find(filter).collation(COLLATION).sort(sort).skip((page - 1) * limit).limit(limit).select(LIST_FIELDS).lean(),
            Vehicle.countDocuments(filter).collation(COLLATION),
        ]);

        return res.status(200).json({
            success: true,
            vehicles: vehicles.map(toListItem),
            pagination: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) },
        });
    } catch (error) {
        console.error("[Vehicles] List error:", error);
        return res.status(500).json({ success: false, message: "Unable to load vehicles." });
    }
};

// -----------------------------------------------------------------------------
// Map
// -----------------------------------------------------------------------------

const MAP_LIMIT = 1500;
const MAP_FIELDS =
    "category motoType bodyType publisherType business.name listingType status condition make model year mileage fuel engineCc price sale.negotiable title city neighborhood location images createdAt";

const inMorocco = (location) => {
    const lat = Number(location?.lat);
    const lng = Number(location?.lng);
    return location?.lat != null && location?.lng != null && lat >= 20 && lat <= 36 && lng >= -18 && lng <= -0.5;
};

// Listings placed on a city centre are spread a little (up to ~1 km),
// always the same way for the same listing, so their markers do not stack.
const spread = (id, location) => {
    const hex = String(id).slice(-6);
    const a = Number.parseInt(hex.slice(0, 3), 16) / 4095;
    const b = Number.parseInt(hex.slice(3), 16) / 4095;
    return { lat: location.lat + (a - 0.5) * 0.018, lng: location.lng + (b - 0.5) * 0.018 };
};

/**
 * Vehicle -> map item, or null when it cannot be placed.
 * Exact position: the Google Maps link of the listing / business.
 * Otherwise the centre of its city, flagged `approximate`.
 */
export function toMapItem(vehicle) {
    let location = null;
    let approximate = false;

    if (inMorocco(vehicle.location)) {
        location = { lat: Number(vehicle.location.lat), lng: Number(vehicle.location.lng) };
    } else {
        const center = cityCenter(vehicle.city);
        if (center) {
            location = spread(vehicle._id, center);
            approximate = true;
        }
    }
    if (!location) return null;

    return { ...vehicle, images: (vehicle.images || []).slice(0, 1), location, approximate };
}

/** Every available vehicle (cars and motos) that can be placed on the map. Filters run in the browser. */
export const getVehiclesMap = async (req, res) => {
    try {
        const query = { category: req.query.category, listingType: req.query.listingType };
        const filter = await hideSuspended(buildListFilter(query));

        const vehicles = await Vehicle.find(filter).sort(SORTS.newest).limit(MAP_LIMIT).select(MAP_FIELDS).lean();
        const items = vehicles.map(toMapItem).filter(Boolean);

        return res.status(200).json({ success: true, vehicles: items, total: items.length });
    } catch (error) {
        console.error("[Vehicles] Map error:", error);
        return res.status(500).json({ success: false, message: "Unable to load the map." });
    }
};

export const getMyVehicles = async (req, res) => {
    try {
        const vehicles = await Vehicle.find({ userId: req.user.userId }).sort({ createdAt: -1 }).lean();
        return res.status(200).json({ success: true, vehicles });
    } catch (error) {
        console.error("[Vehicles] My vehicles error:", error);
        return res.status(500).json({ success: false, message: "Unable to load your vehicles." });
    }
};

export const getMyDealerProfile = async (req, res) => {
    try {
        const dealer = await VehicleDealer.findOne({ userId: req.user.userId }).lean();
        return res.status(200).json({ success: true, dealer: dealer || null });
    } catch (error) {
        console.error("[Vehicles] Dealer profile error:", error);
        return res.status(500).json({ success: false, message: "Unable to load your business profile." });
    }
};

// -----------------------------------------------------------------------------
// Details
// -----------------------------------------------------------------------------

export const getVehicleById = async (req, res) => {
    try {
        if (!isId(req.params.id)) return res.status(400).json({ success: false, message: "Invalid vehicle ID." });

        const vehicle = await Vehicle.findById(req.params.id).lean();
        if (!vehicle || (await isHiddenForRequester(vehicle.userId, req))) {
            return res.status(404).json({ success: false, message: "Vehicle not found." });
        }

        const viewerId = req.user?.userId || null;
        const isOwner = sameUser(vehicle.userId, viewerId);
        const [owner, rating, isSaved] = await Promise.all([
            User.findById(vehicle.userId).select(OWNER_CONTACT_FIELDS).lean(),
            // The rating is a bonus: the page still opens without it.
            getVehicleRatingSummary(vehicle.userId).catch(() => ({ averageRating: 0, totalReviews: 0 })),
            // Saved by the person looking at it (false for visitors).
            isVehicleSaved(viewerId, vehicle._id).catch(() => false),
        ]);

        // Inactive: no contact for visitors (the owner and administrators still see it).
        const contactHidden = vehicle.status === "Inactive" && !isOwner && !(await isRequesterAdmin(req));
        const contact = owner && !contactHidden ? contactFromOwner(owner) : null;

        return res.status(200).json({
            success: true,
            vehicle: {
                ...vehicle,
                isOwner,
                isSaved,
                contactHidden,
                publisher: owner
                    ? {
                          id: String(vehicle.userId),
                          firstName: owner.firstName,
                          lastName: owner.lastName,
                          profileImage: owner.profileImage || "",
                          averageRating: rating.averageRating,
                          totalReviews: rating.totalReviews,
                      }
                    : null,
                contact: contact && {
                    ...contact,
                    email: vehicle.showEmail || isOwner ? contact.email : "",
                },
            },
        });
    } catch (error) {
        console.error("[Vehicles] Details error:", error);
        return res.status(500).json({ success: false, message: "Unable to load this vehicle." });
    }
};

// -----------------------------------------------------------------------------
// Similar vehicles
// -----------------------------------------------------------------------------

const SIMILAR_LIMIT = 6;
const SIMILAR_POOL = 60;

/**
 * Score of a candidate against the vehicle being viewed (pure, tested).
 * Same make, same type (body type or moto type), same city, close price and year.
 */
export function similarityScore(vehicle, candidate) {
    let score = 0;
    const same = (a, b) => Boolean(a) && String(a).toLowerCase() === String(b || "").toLowerCase();

    if (same(vehicle.make, candidate.make)) score += 3;
    if (same(vehicle.model, candidate.model)) score += 2;
    if (vehicle.category === "moto" ? same(vehicle.motoType, candidate.motoType) : same(vehicle.bodyType, candidate.bodyType)) score += 3;
    if (same(vehicle.city, candidate.city)) score += 2;
    if (vehicle.price && candidate.price) {
        const ratio = candidate.price / vehicle.price;
        if (ratio >= 0.7 && ratio <= 1.3) score += 2;
        else if (ratio >= 0.5 && ratio <= 1.5) score += 1;
    }
    if (vehicle.year && candidate.year && Math.abs(vehicle.year - candidate.year) <= 3) score += 1;
    if (same(vehicle.fuel, candidate.fuel)) score += 1;
    return score;
}

export const getSimilarVehicles = async (req, res) => {
    try {
        if (!isId(req.params.id)) return res.status(400).json({ success: false, message: "Invalid vehicle ID." });

        const vehicle = await Vehicle.findById(req.params.id).lean();
        if (!vehicle) return res.status(404).json({ success: false, message: "Vehicle not found." });

        const isMoto = vehicle.category === "moto";
        const filter = await hideSuspended({
            _id: { $ne: vehicle._id },
            status: "Available",
            listingType: vehicle.listingType,
            category: isMoto ? "moto" : { $ne: "moto" },
            ...(isMoto && vehicle.motoType ? { motoType: vehicle.motoType } : {}),
        });

        const candidates = await Vehicle.find(filter).sort({ createdAt: -1 }).limit(SIMILAR_POOL).select(LIST_FIELDS).lean();

        const vehicles = candidates
            .map((candidate) => ({ candidate, score: similarityScore(vehicle, candidate) }))
            .sort((a, b) => b.score - a.score || new Date(b.candidate.createdAt) - new Date(a.candidate.createdAt))
            .slice(0, SIMILAR_LIMIT)
            .map(({ candidate }) => toListItem(candidate));

        return res.status(200).json({ success: true, vehicles });
    } catch (error) {
        console.error("[Vehicles] Similar error:", error);
        return res.status(500).json({ success: false, message: "Unable to load similar vehicles." });
    }
};

// -----------------------------------------------------------------------------
// Create / edit
// -----------------------------------------------------------------------------

/**
 * Location of the vehicle:
 *  - agency / showroom: the business Google Maps link (saved on the business
 *    profile, resolved again only when the link changes);
 *  - owner: the optional Google Maps link of the vehicle.
 * Returns { location, dealer } or throws an error with .field.
 */
async function resolvePlace(userId, data, { resolve = extractGoogleMapsLocation } = {}) {
    const empty = { lat: null, lng: null };

    if (!BUSINESS_TYPES.includes(data.publisherType)) {
        if (!data.mapLink) return { location: empty, dealer: null };
        try {
            return { location: await resolve(data.mapLink), dealer: null };
        } catch (error) {
            error.field = "mapLink";
            throw error;
        }
    }

    const dealer = await VehicleDealer.findOne({ userId });
    let location = dealer?.mapLink === data.mapLink && dealer.location?.lat != null ? dealer.location : null;

    if (!location) {
        try {
            location = await resolve(data.mapLink);
        } catch (error) {
            error.field = "mapLink";
            throw error;
        }
    }

    const profile = {
        type: data.publisherType,
        name: data.business.name,
        address: data.business.address,
        city: data.city,
        mapLink: data.mapLink,
        location: { lat: location.lat, lng: location.lng },
    };

    const saved = await VehicleDealer.findOneAndUpdate({ userId }, { $set: profile, $setOnInsert: { userId } }, { upsert: true, returnDocument: "after" });
    return { location: profile.location, dealer: saved };
}

export const createVehicle = async (req, res) => {
    let uploaded = [];

    try {
        const { data, errors } = buildVehicleData(req.body);
        const files = req.files || [];

        if (!files.length) errors.images = "Add at least one photo of the vehicle.";
        if (Object.keys(errors).length) return badRequest(res, errors);

        let place;
        try {
            place = await resolvePlace(req.user.userId, data);
        } catch (error) {
            return badRequest(res, { [error.field || "mapLink"]: error.message });
        }

        uploaded = await vehicleImages.uploadImages(files);

        const vehicle = await Vehicle.create({
            ...data,
            userId: req.user.userId,
            status: "Available",
            location: place.location,
            images: uploaded,
        });

        // Alerts: notify the users looking for this kind of vehicle (in the
        // background, the publisher does not wait for emails / WhatsApp).
        const io = req.app?.get?.("io");
        notifyMatchingVehicleAlerts(vehicle.toObject?.() ?? vehicle, io).catch((error) =>
            console.error("[Vehicles] Alert notifications error:", error),
        );

        return res.status(201).json({ success: true, message: "Vehicle published.", vehicle });
    } catch (error) {
        if (uploaded.length) await vehicleImages.deleteImages(uploaded);
        console.error("[Vehicles] Create error:", error);
        return res.status(500).json({ success: false, message: "Unable to publish this vehicle." });
    }
};

async function findOwnedVehicle(req, res) {
    if (!isId(req.params.id)) {
        res.status(400).json({ success: false, message: "Invalid vehicle ID." });
        return null;
    }
    const vehicle = await Vehicle.findById(req.params.id);
    if (!vehicle) {
        res.status(404).json({ success: false, message: "Vehicle not found." });
        return null;
    }
    if (!sameUser(vehicle.userId, req.user?.userId)) {
        res.status(403).json({ success: false, message: "You can only change your own vehicles." });
        return null;
    }
    return vehicle;
}

export const updateVehicle = async (req, res) => {
    let uploaded = [];

    try {
        const vehicle = await findOwnedVehicle(req, res);
        if (!vehicle) return;

        const { data, errors } = buildVehicleData(req.body);

        // Photos: keep the saved ones not removed, add the new ones.
        const removed = new Set(parseList(req.body.removeImages));
        const kept = vehicle.images.filter((image) => !removed.has(image.filename));
        const files = req.files || [];

        if (kept.length + files.length === 0) errors.images = "Add at least one photo of the vehicle.";
        if (kept.length + files.length > MAX_IMAGES) errors.images = `A vehicle can have at most ${MAX_IMAGES} photos.`;
        if (Object.keys(errors).length) return badRequest(res, errors);

        let place;
        try {
            const sameLink = data.mapLink && data.mapLink === vehicle.mapLink && vehicle.location?.lat != null;
            place = sameLink && !BUSINESS_TYPES.includes(data.publisherType)
                ? { location: vehicle.location }
                : await resolvePlace(req.user.userId, data);
        } catch (error) {
            return badRequest(res, { [error.field || "mapLink"]: error.message });
        }

        uploaded = await vehicleImages.uploadImages(files);
        const dropped = vehicle.images.filter((image) => removed.has(image.filename));

        vehicle.set({
            ...data,
            status: statusForListingType(data.listingType, vehicle.status),
            location: place.location,
            images: [...kept, ...uploaded],
        });
        await vehicle.save();

        if (dropped.length) await vehicleImages.deleteImages(dropped);

        return res.status(200).json({ success: true, message: "Vehicle updated.", vehicle });
    } catch (error) {
        if (uploaded.length) await vehicleImages.deleteImages(uploaded);
        console.error("[Vehicles] Update error:", error);
        return res.status(500).json({ success: false, message: "Unable to update this vehicle." });
    }
};

export const updateVehicleStatus = async (req, res) => {
    try {
        const vehicle = await findOwnedVehicle(req, res);
        if (!vehicle) return;

        const status = String(req.body?.status || "");
        if (!getAllowedStatuses(vehicle.listingType).includes(status)) {
            return res.status(400).json({
                success: false,
                message: `Status must be one of: ${getAllowedStatuses(vehicle.listingType).join(", ")}.`,
            });
        }

        vehicle.status = status;
        await vehicle.save();

        return res.status(200).json({ success: true, status: vehicle.status });
    } catch (error) {
        console.error("[Vehicles] Status error:", error);
        return res.status(500).json({ success: false, message: "Unable to change the status." });
    }
};

export const deleteVehicle = async (req, res) => {
    try {
        if (!isId(req.params.id)) return res.status(400).json({ success: false, message: "Invalid vehicle ID." });

        const vehicle = await Vehicle.findById(req.params.id);
        if (!vehicle) return res.status(404).json({ success: false, message: "Vehicle not found." });

        if (!sameUser(vehicle.userId, req.user?.userId) && !(await isRequesterAdmin(req))) {
            return res.status(403).json({ success: false, message: "You can only delete your own vehicles." });
        }

        await Vehicle.deleteOne({ _id: vehicle._id });
        await vehicleImages.deleteImages(vehicle.images || []);
        // The vehicle is gone: its saves are cleaned up without blocking the answer.
        Promise.resolve()
            .then(() => SavedVehicle.deleteMany({ vehicleId: vehicle._id }))
            .catch((error) => console.error("[Vehicles] Saved cleanup error:", error.message));

        return res.status(200).json({ success: true, message: "Vehicle deleted." });
    } catch (error) {
        console.error("[Vehicles] Delete error:", error);
        return res.status(500).json({ success: false, message: "Unable to delete this vehicle." });
    }
};

// For tests.
export { resolvePlace };
