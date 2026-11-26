// backend/apps/main/services/requests/requestRules.js
//
// Pure rules of requests (no database): reading the form, the professional
// profile, who is notified, which requests match a professional, and what
// each person may see.

import {
    BUSINESS_TYPES,
    CLOSE_REASONS,
    DIGEST_FREQUENCIES,
    MAX_PROFILE_CITIES,
    PART_CATEGORIES,
    PROPERTY_FEATURES,
    PROPERTY_TRANSACTIONS,
    PROPERTY_TYPES,
    REQUEST_LIFETIME_DAYS,
    REQUEST_SERVICES,
    VEHICLE_CATEGORIES,
    VEHICLE_FUELS,
    VEHICLE_TRANSACTIONS,
    VEHICLE_TRANSMISSIONS,
} from "../../utils/requestOptions.js";

const DAY_MS = 24 * 60 * 60 * 1000;

const clean = (value, max = 200) => String(value ?? "").trim().slice(0, max);
const list = (value) => (Array.isArray(value) ? value : value === undefined || value === null || value === "" ? [] : String(value).split(","));
const pick = (value, allowed) => [...new Set(list(value).map((item) => String(item).trim()).filter((item) => allowed.includes(item)))];
const bool = (value) => value === true || value === "true" || value === "on" || value === 1 || value === "1";

const number = (value) => {
    if (value === "" || value === null || value === undefined) return null;
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : NaN;
};

const escapeRegex = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
export const exactInsensitive = (value) => new RegExp(`^${escapeRegex(String(value).trim())}$`, "i");

export const expiryFrom = (date = new Date()) => new Date(date.getTime() + REQUEST_LIFETIME_DAYS * DAY_MS);

/* --------------------------------------------------
   The request form
-------------------------------------------------- */

/**
 * Reads the "Post a request" form.
 * -> { data, errors }   errors: { field: code } (the frontend translates codes)
 */
export function buildRequestData(body = {}, { now = new Date() } = {}) {
    const errors = {};
    const service = clean(body.service, 20);

    if (!REQUEST_SERVICES.includes(service)) {
        return { data: null, errors: { service: "invalid" } };
    }

    const data = {
        service,
        city: clean(body.city, 100),
        neighborhoods: clean(body.neighborhoods, 200),
        message: clean(body.message, 1000),
    };

    if (!data.city) errors.city = "required";

    // Budget
    const budgetMin = number(body.budgetMin);
    const budgetMax = number(body.budgetMax);
    if (Number.isNaN(budgetMin)) errors.budgetMin = "invalid";
    if (Number.isNaN(budgetMax)) errors.budgetMax = "invalid";
    if (budgetMin !== null && budgetMax !== null && !Number.isNaN(budgetMin) && !Number.isNaN(budgetMax) && budgetMin > budgetMax) {
        errors.budgetMax = "lessThanMin";
    }
    data.budgetMin = Number.isNaN(budgetMin) ? null : budgetMin;
    data.budgetMax = Number.isNaN(budgetMax) ? null : budgetMax;

    if (service === "property") {
        data.transaction = clean(body.transaction, 20);
        if (!PROPERTY_TRANSACTIONS.includes(data.transaction)) errors.transaction = "required";

        data.propertyTypes = pick(body.propertyTypes, PROPERTY_TYPES);
        if (!data.propertyTypes.length) errors.propertyTypes = "required";

        const minRooms = number(body.minRooms);
        if (Number.isNaN(minRooms) || (minRooms !== null && minRooms > 20)) errors.minRooms = "invalid";
        data.minRooms = Number.isNaN(minRooms) ? null : minRooms;

        const minSurface = number(body.minSurface);
        if (Number.isNaN(minSurface) || (minSurface !== null && minSurface > 100000)) errors.minSurface = "invalid";
        data.minSurface = Number.isNaN(minSurface) ? null : minSurface;

        data.features = pick(body.features, PROPERTY_FEATURES);

        data.moveInDate = null;
        if (body.moveInDate) {
            const date = new Date(body.moveInDate);
            const limit = new Date(now.getTime() + 2 * 365 * DAY_MS);
            if (Number.isNaN(date.getTime()) || date > limit) errors.moveInDate = "invalid";
            else data.moveInDate = date;
        }
    }

    if (service === "vehicle") {
        data.vehicleCategory = clean(body.vehicleCategory, 10);
        if (!VEHICLE_CATEGORIES.includes(data.vehicleCategory)) errors.vehicleCategory = "required";

        // Spare parts are bought.
        data.transaction = data.vehicleCategory === "part" ? "buy" : clean(body.transaction, 10);
        if (!VEHICLE_TRANSACTIONS.includes(data.transaction)) errors.transaction = "required";

        data.make = clean(body.make, 60);
        data.model = clean(body.model, 60);

        const yearFrom = number(body.yearFrom);
        const yearTo = number(body.yearTo);
        const badYear = (year) => Number.isNaN(year) || (year !== null && (year < 1950 || year > now.getFullYear() + 1));
        if (badYear(yearFrom)) errors.yearFrom = "invalid";
        if (badYear(yearTo)) errors.yearTo = "invalid";
        if (!errors.yearFrom && !errors.yearTo && yearFrom !== null && yearTo !== null && yearFrom > yearTo) errors.yearTo = "lessThanMin";
        data.yearFrom = errors.yearFrom ? null : yearFrom;
        data.yearTo = errors.yearTo ? null : yearTo;

        if (data.vehicleCategory === "part") {
            data.partCategory = PART_CATEGORIES.includes(clean(body.partCategory, 30)) ? clean(body.partCategory, 30) : "";
            data.partName = clean(body.partName, 120);
            if (data.partName.length < 3) errors.partName = "required";
            data.fuel = "";
            data.transmission = "";
            data.maxMileage = null;
        } else {
            data.partCategory = "";
            data.partName = "";
            data.fuel = VEHICLE_FUELS.includes(clean(body.fuel, 20)) ? clean(body.fuel, 20) : "";
            data.transmission = VEHICLE_TRANSMISSIONS.includes(clean(body.transmission, 20)) ? clean(body.transmission, 20) : "";
            const maxMileage = number(body.maxMileage);
            if (Number.isNaN(maxMileage)) errors.maxMileage = "invalid";
            data.maxMileage = Number.isNaN(maxMileage) ? null : maxMileage;
        }
    }

    return { data, errors };
}

/* --------------------------------------------------
   Professional profile (Settings > Receive requests)
-------------------------------------------------- */

export const EMPTY_PROFILE = {
    receiveRequests: false,
    fields: [],
    businessType: "",
    businessName: "",
    propertyTransactions: [],
    propertyTypes: [],
    vehicleCategories: [],
    vehicleTransactions: [],
    allMorocco: false,
    cities: [],
    channels: { notification: true, email: true },
    frequency: "instant",
};

/** The profile as the API returns it (defaults filled). */
export function profileView(user) {
    const saved = user?.professionalProfile || {};
    return {
        receiveRequests: saved.receiveRequests === true,
        fields: [...(saved.fields || [])],
        businessType: saved.businessType || "",
        businessName: saved.businessName || "",
        propertyTransactions: [...(saved.propertyTransactions || [])],
        propertyTypes: [...(saved.propertyTypes || [])],
        vehicleCategories: [...(saved.vehicleCategories || [])],
        vehicleTransactions: [...(saved.vehicleTransactions || [])],
        allMorocco: saved.allMorocco === true,
        cities: [...(saved.cities || [])],
        channels: {
            notification: saved.channels?.notification !== false,
            email: saved.channels?.email !== false,
        },
        frequency: DIGEST_FREQUENCIES.includes(saved.frequency) ? saved.frequency : "instant",
        updatedAt: saved.updatedAt || null,
    };
}

/** Reads the Settings form. -> { profile, errors } */
export function buildProfile(body = {}, { now = new Date() } = {}) {
    const errors = {};
    // Same city once (first spelling kept).
    const seen = new Set();
    const cities = list(body.cities)
        .map((city) => clean(city, 100))
        .filter((city) => city && !seen.has(city.toLowerCase()) && seen.add(city.toLowerCase()));

    const profile = {
        receiveRequests: bool(body.receiveRequests),
        fields: pick(body.fields, REQUEST_SERVICES),
        businessType: BUSINESS_TYPES.includes(clean(body.businessType, 20)) ? clean(body.businessType, 20) : "",
        businessName: clean(body.businessName, 120),
        propertyTransactions: pick(body.propertyTransactions, PROPERTY_TRANSACTIONS),
        propertyTypes: pick(body.propertyTypes, PROPERTY_TYPES),
        vehicleCategories: pick(body.vehicleCategories, VEHICLE_CATEGORIES),
        vehicleTransactions: pick(body.vehicleTransactions, VEHICLE_TRANSACTIONS),
        allMorocco: bool(body.allMorocco),
        cities,
        channels: {
            notification: body.channels?.notification === undefined ? true : bool(body.channels.notification),
            email: body.channels?.email === undefined ? true : bool(body.channels.email),
        },
        frequency: DIGEST_FREQUENCIES.includes(clean(body.frequency, 10)) ? clean(body.frequency, 10) : "instant",
        updatedAt: now,
    };

    if (cities.length > MAX_PROFILE_CITIES) errors.cities = "tooMany";
    if (profile.allMorocco) profile.cities = [];

    // Only checked when receiving is on (a paused profile keeps its choices).
    if (profile.receiveRequests) {
        if (!profile.fields.length) errors.fields = "required";
        if (!profile.allMorocco && !profile.cities.length) errors.cities = "required";
        if (!profile.channels.notification && !profile.channels.email) errors.channels = "required";
    }

    return { profile, errors };
}

/* --------------------------------------------------
   Matching
-------------------------------------------------- */

// "Empty list = all" for a profile field.
const anyOr = (field, values) => ({
    $or: [{ [field]: { $exists: false } }, { [field]: { $size: 0 } }, { [field]: { $in: values } }],
});

/** MongoDB filter of the users to notify about a new request. */
export function recipientsFilter(request) {
    const and = [
        { $or: [{ "professionalProfile.allMorocco": true }, { "professionalProfile.cities": exactInsensitive(request.city) }] },
    ];

    if (request.service === "property") {
        and.push(anyOr("professionalProfile.propertyTransactions", [request.transaction]));
        if (request.propertyTypes?.length) and.push(anyOr("professionalProfile.propertyTypes", request.propertyTypes));
    } else {
        and.push(anyOr("professionalProfile.vehicleCategories", [request.vehicleCategory]));
        and.push(anyOr("professionalProfile.vehicleTransactions", [request.transaction]));
    }

    return {
        _id: { $ne: request.userId },
        "professionalProfile.receiveRequests": true,
        "professionalProfile.fields": request.service,
        accountStatus: { $ne: "suspended" },
        scheduledDeletionAt: null,
        $and: and,
    };
}

/** Does a request match a professional profile? (same rules as recipientsFilter) */
export function requestMatchesProfile(request, profile) {
    if (!profile?.fields?.includes(request.service)) return false;
    const cityOk = profile.allMorocco || (profile.cities || []).some((city) => city.toLowerCase() === String(request.city).toLowerCase());
    if (!cityOk) return false;

    const anyOf = (choices = [], values = []) => !choices.length || values.some((value) => choices.includes(value));
    if (request.service === "property") {
        return anyOf(profile.propertyTransactions, [request.transaction]) && (!request.propertyTypes?.length || anyOf(profile.propertyTypes, request.propertyTypes));
    }
    return anyOf(profile.vehicleCategories, [request.vehicleCategory]) && anyOf(profile.vehicleTransactions, [request.transaction]);
}

/**
 * Requests board filter.
 *   matching=true: only the requests that match the professional's profile.
 *   Other filters: service, city, transaction, category (vehicle category).
 */
export function boardFilter({ viewerId, profile, matching = true, service, city, transaction, category, now = new Date() } = {}) {
    const filter = { status: "active", expiresAt: { $gt: now } };
    const and = [];

    if (viewerId) filter.userId = { $ne: viewerId };
    if (REQUEST_SERVICES.includes(service)) filter.service = service;
    if (city) and.push({ city: exactInsensitive(city) });
    if (transaction && [...PROPERTY_TRANSACTIONS, ...VEHICLE_TRANSACTIONS].includes(transaction)) filter.transaction = transaction;
    if (VEHICLE_CATEGORIES.includes(category)) filter.vehicleCategory = category;

    if (matching && profile) {
        const services = (profile.fields || []).filter((field) => !filter.service || field === filter.service);
        if (!services.length) return { _id: null }; // nothing

        and.push({
            $or: services.map((field) => {
                const branch = { service: field };
                const parts = [];
                if (!profile.allMorocco) parts.push({ city: { $in: (profile.cities || []).map(exactInsensitive) } });
                if (field === "property") {
                    if (profile.propertyTransactions?.length) parts.push({ transaction: { $in: profile.propertyTransactions } });
                    if (profile.propertyTypes?.length) parts.push({ propertyTypes: { $in: profile.propertyTypes } });
                } else {
                    if (profile.vehicleCategories?.length) parts.push({ vehicleCategory: { $in: profile.vehicleCategories } });
                    if (profile.vehicleTransactions?.length) parts.push({ transaction: { $in: profile.vehicleTransactions } });
                }
                return parts.length ? { ...branch, $and: parts } : branch;
            }),
        });
    }

    if (and.length) filter.$and = and;
    return filter;
}

/* --------------------------------------------------
   What each person sees
-------------------------------------------------- */

/** "Sara A." — the seeker is never shown in full to professionals. */
export const shortName = (user) =>
    [user?.firstName, user?.lastName ? `${String(user.lastName).charAt(0)}.` : ""].filter(Boolean).join(" ") || "";

export function isExpired(request, now = new Date()) {
    return request.status === "expired" || (request.status === "active" && new Date(request.expiresAt) <= now);
}

/** Public part of a request (board, notifications, details). */
export function requestView(request, { now = new Date() } = {}) {
    return {
        id: String(request._id),
        service: request.service,
        transaction: request.transaction,
        propertyTypes: request.propertyTypes || [],
        minRooms: request.minRooms ?? null,
        minSurface: request.minSurface ?? null,
        features: request.features || [],
        moveInDate: request.moveInDate || null,
        vehicleCategory: request.vehicleCategory || null,
        make: request.make || "",
        model: request.model || "",
        yearFrom: request.yearFrom ?? null,
        yearTo: request.yearTo ?? null,
        maxMileage: request.maxMileage ?? null,
        fuel: request.fuel || "",
        transmission: request.transmission || "",
        partCategory: request.partCategory || "",
        partName: request.partName || "",
        city: request.city,
        neighborhoods: request.neighborhoods || "",
        budgetMin: request.budgetMin ?? null,
        budgetMax: request.budgetMax ?? null,
        message: request.message || "",
        status: isExpired(request, now) ? "expired" : request.status,
        closedReason: request.closedReason || "",
        expiresAt: request.expiresAt,
        createdAt: request.createdAt,
        responsesCount: request.responsesCount || 0,
        recipientsCount: request.recipientsCount || 0,
    };
}

export const CLOSE_REASON_VALUES = CLOSE_REASONS;
