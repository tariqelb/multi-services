// backend/apps/property/services/requests/requestRules.js
//
// Pure rules of property requests (no database): reading the form, who is
// notified, which requests match a professional, and what each person sees.

import { CLOSE_REASONS, PROPERTY_FEATURES, PROPERTY_TRANSACTIONS, PROPERTY_TYPES, REQUEST_LIFETIME_DAYS } from "../../utils/requestOptions.js";

export const SERVICE = "property";

const DAY_MS = 24 * 60 * 60 * 1000;

const clean = (value, max = 200) => String(value ?? "").trim().slice(0, max);
const list = (value) => (Array.isArray(value) ? value : value === undefined || value === null || value === "" ? [] : String(value).split(","));
const pick = (value, allowed) => [...new Set(list(value).map((item) => String(item).trim()).filter((item) => allowed.includes(item)))];

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
    const and = [
        { $or: [{ "professionalProfile.allMorocco": true }, { "professionalProfile.cities": exactInsensitive(request.city) }] },
        anyOr("professionalProfile.propertyTransactions", [request.transaction]),
    ];
    if (request.propertyTypes?.length) and.push(anyOr("professionalProfile.propertyTypes", request.propertyTypes));

    return {
        _id: { $ne: request.userId },
        "professionalProfile.receiveRequests": true,
        "professionalProfile.fields": SERVICE,
        accountStatus: { $ne: "suspended" },
        scheduledDeletionAt: null,
        $and: and,
    };
}

/** Does a request match a professional profile? (same rules as recipientsFilter) */
export function requestMatchesProfile(request, profile) {
    if (!profile?.fields?.includes(SERVICE)) return false;
    const cityOk = profile.allMorocco || (profile.cities || []).some((city) => city.toLowerCase() === String(request.city).toLowerCase());
    if (!cityOk) return false;

    const anyOf = (choices = [], values = []) => !choices.length || values.some((value) => choices.includes(value));
    return anyOf(profile.propertyTransactions, [request.transaction]) && (!request.propertyTypes?.length || anyOf(profile.propertyTypes, request.propertyTypes));
}

/**
 * Requests board filter.
 *   matching=true: only the requests that match the professional's profile.
 *   Other filters: city, transaction.
 */
export function boardFilter({ viewerId, profile, matching = true, city, transaction, now = new Date() } = {}) {
    const filter = { status: "active", expiresAt: { $gt: now } };
    const and = [];

    if (viewerId) filter.userId = { $ne: viewerId };
    if (city) and.push({ city: exactInsensitive(city) });
    if (PROPERTY_TRANSACTIONS.includes(transaction)) filter.transaction = transaction;

    if (matching && profile) {
        if (!profile.fields?.includes(SERVICE)) return { _id: null }; // nothing
        if (!profile.allMorocco) and.push({ city: { $in: (profile.cities || []).map(exactInsensitive) } });
        if (profile.propertyTransactions?.length) and.push({ transaction: { $in: profile.propertyTransactions } });
        if (profile.propertyTypes?.length) and.push({ propertyTypes: { $in: profile.propertyTypes } });
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
        propertyTypes: request.propertyTypes || [],
        minRooms: request.minRooms ?? null,
        minSurface: request.minSurface ?? null,
        features: request.features || [],
        moveInDate: request.moveInDate || null,
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
