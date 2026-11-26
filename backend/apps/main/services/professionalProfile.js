// backend/apps/main/services/professionalProfile.js
//
// Professional profile (Settings > Receive requests): reading the form and
// the profile as the API returns it. Used by the profile endpoint and by the
// requests of each service (who to notify, instant or daily, which channels).

import {
    BUSINESS_TYPES,
    DIGEST_FREQUENCIES,
    MAX_PROFILE_CITIES,
    PROFILE_FIELDS,
    PROFILE_PROPERTY_TRANSACTIONS,
    PROFILE_PROPERTY_TYPES,
    PROFILE_VEHICLE_CATEGORIES,
    PROFILE_VEHICLE_TRANSACTIONS,
} from "../utils/professionalProfileOptions.js";

const clean = (value, max = 200) => String(value ?? "").trim().slice(0, max);
const list = (value) => (Array.isArray(value) ? value : value === undefined || value === null || value === "" ? [] : String(value).split(","));
const pick = (value, allowed) => [...new Set(list(value).map((item) => String(item).trim()).filter((item) => allowed.includes(item)))];
const bool = (value) => value === true || value === "true" || value === "on" || value === 1 || value === "1";

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
        fields: pick(body.fields, PROFILE_FIELDS),
        businessType: BUSINESS_TYPES.includes(clean(body.businessType, 20)) ? clean(body.businessType, 20) : "",
        businessName: clean(body.businessName, 120),
        propertyTransactions: pick(body.propertyTransactions, PROFILE_PROPERTY_TRANSACTIONS),
        propertyTypes: pick(body.propertyTypes, PROFILE_PROPERTY_TYPES),
        vehicleCategories: pick(body.vehicleCategories, PROFILE_VEHICLE_CATEGORIES),
        vehicleTransactions: pick(body.vehicleTransactions, PROFILE_VEHICLE_TRANSACTIONS),
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
