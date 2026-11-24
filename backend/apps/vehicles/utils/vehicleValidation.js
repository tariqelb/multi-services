// backend/apps/vehicles/utils/vehicleValidation.js
//
// Turns the form fields (multipart: every value is a string) into a clean vehicle
// document. Pure function: no database, no network (the Google Maps link is
// resolved by the controller).
//
//   const { data, errors } = buildVehicleData(req.body);
//   errors: { field: "message" } — empty when the form is valid.

import {
    BODY_TYPES,
    CATEGORIES,
    MOTORIZED_MOTO_TYPES,
    MOTO_FUELS,
    MOTO_TYPES,
    NON_MOTORIZED_FUELS,
    equipmentFor,
    BUSINESS_TYPES,
    COLORS,
    CONDITIONS,
    FUELS,
    LISTING_TYPES,
    MILEAGE_POLICIES,
    ORIGINS,
    PUBLISHER_TYPES,
    RENT_INSURANCES,
    TRANSMISSIONS,
    CUSTOM_LABEL_MAX,
    CUSTOM_VALUE_MAX,
    MAX_CUSTOM_FIELDS,
} from "./vehicleOptions.js";

const text = (value, max) => String(value ?? "").trim().replace(/\s+/g, " ").slice(0, max);
const longText = (value, max) => String(value ?? "").trim().slice(0, max);
const isBlank = (value) => value === undefined || value === null || String(value).trim() === "";

export const parseBoolean = (value) => value === true || value === "true" || value === "1" || value === "on";

export function parseList(value) {
    if (Array.isArray(value)) return value.map(String);
    if (isBlank(value)) return [];
    try {
        const parsed = JSON.parse(value);
        return Array.isArray(parsed) ? parsed.map(String) : [];
    } catch {
        return String(value).split(",").map((item) => item.trim()).filter(Boolean);
    }
}

export function youtubeVideoId(url) {
    try {
        const parsed = new URL(url);
        const host = parsed.hostname.toLowerCase().replace(/^www\./, "");
        let id = "";
        if (host === "youtu.be") id = parsed.pathname.slice(1).split("/")[0];
        else if (["youtube.com", "m.youtube.com", "youtube-nocookie.com"].includes(host)) {
            if (parsed.pathname === "/watch") id = parsed.searchParams.get("v") || "";
            else if (/^\/(embed|shorts)\//.test(parsed.pathname)) id = parsed.pathname.split("/")[2] || "";
        }
        return /^[a-zA-Z0-9_-]{11}$/.test(id) ? id : null;
    } catch {
        return null;
    }
}

/**
 * Extra details: JSON array of { label, value }. Empty rows are dropped;
 * a row with only one of the two is an error (so nothing typed is lost silently).
 */
export function parseCustomFields(value) {
    let rows = value;
    if (typeof rows === "string") {
        try {
            rows = JSON.parse(rows || "[]");
        } catch {
            return { fields: [], error: "Additional details are not valid." };
        }
    }
    if (!Array.isArray(rows)) return { fields: [], error: null };

    const fields = [];
    for (const row of rows) {
        const label = text(row?.label, CUSTOM_LABEL_MAX);
        const content = text(row?.value, CUSTOM_VALUE_MAX);
        if (!label && !content) continue;
        if (!label || !content) return { fields, error: "Each additional detail needs a title and a value." };
        fields.push({ label, value: content });
    }

    if (fields.length > MAX_CUSTOM_FIELDS) {
        return { fields: fields.slice(0, MAX_CUSTOM_FIELDS), error: `At most ${MAX_CUSTOM_FIELDS} additional details.` };
    }
    return { fields, error: null };
}

export function buildVehicleData(body = {}, { now = new Date() } = {}) {
    const errors = {};
    const data = {};

    // Numbers: blank -> null (or error when required), out of range -> error.
    const number = (field, { min = 0, max = Number.MAX_SAFE_INTEGER, required = false, integer = false, label = field } = {}) => {
        const raw = body[field];
        if (isBlank(raw)) {
            if (required) errors[field] = `${label} is required.`;
            return null;
        }
        const value = Number(String(raw).replace(/\s/g, "").replace(",", "."));
        if (!Number.isFinite(value) || value < min || value > max || (integer && !Number.isInteger(value))) {
            errors[field] = `${label} must be ${integer ? "a whole number" : "a number"} between ${min} and ${max}.`;
            return null;
        }
        return value;
    };

    const choice = (field, values, { required = false, fallback = null, label = field } = {}) => {
        const raw = text(body[field], 40);
        if (!raw) {
            if (required) errors[field] = `${label} is required.`;
            return fallback;
        }
        if (!values.includes(raw)) {
            errors[field] = `${label} is not valid.`;
            return fallback;
        }
        return raw;
    };

    const date = (field, label = field) => {
        if (isBlank(body[field])) return null;
        const value = new Date(body[field]);
        if (Number.isNaN(value.getTime())) {
            errors[field] = `${label} is not a valid date.`;
            return null;
        }
        return value;
    };

    // ---- Publisher ----
    data.publisherType = choice("publisherType", PUBLISHER_TYPES, { required: true, label: "Publisher type" });
    const isBusiness = BUSINESS_TYPES.includes(data.publisherType);
    data.business = {
        name: isBusiness ? text(body.businessName, 80) : "",
        address: isBusiness ? text(body.businessAddress, 160) : "",
    };
    if (isBusiness && !data.business.name) errors.businessName = "Business name is required.";

    // ---- Offer ----
    data.listingType = choice("listingType", LISTING_TYPES, { required: true, label: "Sale or rent" });
    data.condition = choice("condition", CONDITIONS, { fallback: "used" });

    // ---- Vehicle ----
    data.category = choice("category", CATEGORIES, { fallback: "car" });
    const isMoto = data.category === "moto";
    data.motoType = isMoto ? choice("motoType", MOTO_TYPES, { required: true, label: "Type" }) : null;
    // Cars, motorcycles, scooters and tricycles have an engine; bicycles and kick scooters may not.
    const motorized = !isMoto || MOTORIZED_MOTO_TYPES.includes(data.motoType);

    data.make = text(body.make, 40);
    if (!data.make) errors.make = "Make is required.";
    data.model = text(body.model, 40);
    if (!data.model && motorized) errors.model = "Model is required.";
    data.version = text(body.version, 60);

    data.year = number("year", { min: 1950, max: now.getFullYear() + 1, required: motorized, integer: true, label: "Year" });
    data.mileage =
        number("mileage", { max: 2_000_000, integer: true, required: motorized && data.condition === "used", label: "Mileage" }) ?? 0;

    if (!isMoto) {
        data.fuel = choice("fuel", FUELS, { required: true, label: "Fuel" });
        data.transmission = choice("transmission", TRANSMISSIONS, { required: true, label: "Gearbox" });
        data.bodyType = choice("bodyType", BODY_TYPES);
        data.seats = number("seats", { min: 1, max: 60, required: true, integer: true, label: "Seats" });
        data.doors = number("doors", { min: 0, max: 6, integer: true, label: "Doors" });
        data.fiscalPower = number("fiscalPower", { min: 1, max: 100, integer: true, label: "Tax horsepower" });
        data.engineSize = number("engineSize", { min: 0.1, max: 10, label: "Engine size" });
        data.engineCc = null;
    } else {
        data.fuel = motorized
            ? choice("fuel", MOTO_FUELS, { required: true, label: "Fuel" })
            : choice("fuel", NON_MOTORIZED_FUELS, { fallback: "none" });
        data.transmission = motorized ? choice("transmission", TRANSMISSIONS) : null;
        data.bodyType = null;
        data.seats = motorized ? number("seats", { min: 1, max: 3, integer: true, label: "Seats" }) : null;
        data.doors = null;
        data.fiscalPower = motorized ? number("fiscalPower", { min: 1, max: 100, integer: true, label: "Tax horsepower" }) : null;
        data.engineSize = null;
        data.engineCc = motorized && data.fuel === "petrol" ? number("engineCc", { min: 25, max: 3000, integer: true, label: "Engine size" }) : null;
    }
    data.rangeKm = data.fuel === "electric" ? number("rangeKm", { min: 1, max: 2000, integer: true, label: "Range" }) : null;

    data.exteriorColor = choice("exteriorColor", COLORS);
    data.interiorColor = isMoto ? "" : text(body.interiorColor, 30);

    // ---- Condition and papers ----
    const used = data.condition === "used";
    data.firstHand = used && parseBoolean(body.firstHand);
    data.previousOwners = used ? number("previousOwners", { max: 20, integer: true, label: "Previous owners" }) : null;
    data.accidentFree = parseBoolean(body.accidentFree);
    data.serviceHistory = parseBoolean(body.serviceHistory);
    data.origin = choice("origin", ORIGINS);
    data.vignettePaid = parseBoolean(body.vignettePaid);
    data.technicalInspectionUntil = date("technicalInspectionUntil", "Technical inspection date");
    const allowedEquipment = equipmentFor(data.category);
    data.equipment = [...new Set(parseList(body.equipment).filter((item) => allowedEquipment.includes(item)))];

    const custom = parseCustomFields(body.customFields);
    data.customFields = custom.fields;
    if (custom.error) errors.customFields = custom.error;

    // ---- Price ----
    if (data.listingType === "rent") {
        data.price = number("pricePerDay", { min: 1, max: 1_000_000, required: true, label: "Price per day" });
        const mileagePolicy = choice("mileagePolicy", MILEAGE_POLICIES, { fallback: "unlimited" });
        data.rent = {
            pricePerWeek: number("pricePerWeek", { min: 1, max: 10_000_000, label: "Price per week" }),
            pricePerMonth: number("pricePerMonth", { min: 1, max: 10_000_000, label: "Price per month" }),
            deposit: number("deposit", { max: 10_000_000, label: "Deposit" }),
            minDays: number("minDays", { min: 1, max: 365, integer: true, label: "Minimum days" }) ?? 1,
            insurance: choice("insurance", RENT_INSURANCES, { required: true, label: "Insurance" }),
            insuranceExcess: number("insuranceExcess", { max: 10_000_000, label: "Insurance excess" }),
            mileagePolicy,
            kmPerDay: mileagePolicy === "limited"
                ? number("kmPerDay", { min: 1, max: 10_000, integer: true, required: true, label: "Km per day" })
                : null,
            minDriverAge: number("minDriverAge", { min: 18, max: 80, integer: true, label: "Driver minimum age" }),
            minLicenseYears: number("minLicenseYears", { max: 50, integer: true, label: "Years with a licence" }),
            withDriver: parseBoolean(body.withDriver),
            delivery: parseBoolean(body.delivery),
        };
        data.sale = {};
    } else {
        data.price = number("price", { min: 1, max: 100_000_000, required: true, label: "Price" });
        data.sale = {
            negotiable: parseBoolean(body.negotiable),
            creditAvailable: parseBoolean(body.creditAvailable),
            tradeInAccepted: parseBoolean(body.tradeInAccepted),
            insuranceValidUntil: date("insuranceValidUntil", "Insurance date"),
        };
        data.rent = {};
    }

    // ---- Text, place, media ----
    const autoTitle = [data.make, data.model, data.version, data.year].filter(Boolean).join(" ");
    data.title = text(body.title, 120) || autoTitle;
    data.description = longText(body.description, 5000);

    data.city = text(body.city, 60);
    if (!data.city) errors.city = "City is required.";
    data.neighborhood = text(body.neighborhood, 80);

    data.mapLink = text(body.mapLink, 500);
    if (isBusiness && !data.mapLink) errors.mapLink = "The Google Maps link of the business is required.";

    data.youtubeVideoUrl = text(body.youtubeVideoUrl, 300);
    if (data.youtubeVideoUrl && !youtubeVideoId(data.youtubeVideoUrl)) {
        errors.youtubeVideoUrl = "Please provide a valid YouTube video link.";
    }

    data.showEmail = parseBoolean(body.showEmail);

    return { data, errors };
}
