// backend/apps/vehicles/services/requests/requestRules.js
//
// Pure rules of vehicle requests (no database): reading the form, who is
// notified, which requests match a professional, and what each person sees.

import {
    CLOSE_REASONS,
    PART_CATEGORIES,
    REQUEST_LIFETIME_DAYS,
    VEHICLE_CATEGORIES,
    VEHICLE_FUELS,
    VEHICLE_TRANSACTIONS,
    VEHICLE_TRANSMISSIONS,
} from "../../utils/requestOptions.js";

export const SERVICE = "vehicle";

const DAY_MS = 24 * 60 * 60 * 1000;

const clean = (value, max = 200) => String(value ?? "").trim().slice(0, max);

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

    const data = {
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

    return { data, errors };
}

/* --------------------------------------------------
   Matching (professional profile: Settings > Receive requests)
-------------------------------------------------- */

// "Empty list = all" for a profile field.
const anyOr = (field, values) => ({
    $or: [{ [field]: { $exists: false } }, { [field]: { $size: 0 } }, { [field]: { $in: values } }],
});

/** MongoDB filter of the users to notify about a new request. */
export function recipientsFilter(request) {
    return {
        _id: { $ne: request.userId },
        "professionalProfile.receiveRequests": true,
        "professionalProfile.fields": SERVICE,
        accountStatus: { $ne: "suspended" },
        scheduledDeletionAt: null,
        $and: [
            { $or: [{ "professionalProfile.allMorocco": true }, { "professionalProfile.cities": exactInsensitive(request.city) }] },
            anyOr("professionalProfile.vehicleCategories", [request.vehicleCategory]),
            anyOr("professionalProfile.vehicleTransactions", [request.transaction]),
        ],
    };
}

/** Does a request match a professional profile? (same rules as recipientsFilter) */
export function requestMatchesProfile(request, profile) {
    if (!profile?.fields?.includes(SERVICE)) return false;
    const cityOk = profile.allMorocco || (profile.cities || []).some((city) => city.toLowerCase() === String(request.city).toLowerCase());
    if (!cityOk) return false;

    const anyOf = (choices = [], values = []) => !choices.length || values.some((value) => choices.includes(value));
    return anyOf(profile.vehicleCategories, [request.vehicleCategory]) && anyOf(profile.vehicleTransactions, [request.transaction]);
}

/**
 * Requests board filter.
 *   matching=true: only the requests that match the professional's profile.
 *   Other filters: city, transaction, category (car | moto | part).
 */
export function boardFilter({ viewerId, profile, matching = true, city, transaction, category, now = new Date() } = {}) {
    const filter = { status: "active", expiresAt: { $gt: now } };
    const and = [];

    if (viewerId) filter.userId = { $ne: viewerId };
    if (city) and.push({ city: exactInsensitive(city) });
    if (VEHICLE_TRANSACTIONS.includes(transaction)) filter.transaction = transaction;
    if (VEHICLE_CATEGORIES.includes(category)) filter.vehicleCategory = category;

    if (matching && profile) {
        if (!profile.fields?.includes(SERVICE)) return { _id: null }; // nothing
        if (!profile.allMorocco) and.push({ city: { $in: (profile.cities || []).map(exactInsensitive) } });
        if (profile.vehicleCategories?.length) and.push({ vehicleCategory: { $in: profile.vehicleCategories } });
        if (profile.vehicleTransactions?.length) and.push({ transaction: { $in: profile.vehicleTransactions } });
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
        service: SERVICE,
        transaction: request.transaction,
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
