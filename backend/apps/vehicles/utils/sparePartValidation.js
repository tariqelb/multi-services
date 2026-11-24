// backend/apps/vehicles/utils/sparePartValidation.js
//
// Form fields (multipart: every value is a string) -> clean spare part
// document. Pure function, like buildVehicleData.
//
//   const { data, errors } = buildSparePartData(req.body);

import {
    PART_BUSINESS_TYPES,
    PART_CATEGORIES,
    PART_CONDITIONS,
    PART_SELLER_TYPES,
    PART_VEHICLE_TYPES,
} from "./sparePartOptions.js";
import { parseBoolean } from "./vehicleValidation.js";

const text = (value, max) => String(value ?? "").trim().replace(/\s+/g, " ").slice(0, max);
const longText = (value, max) => String(value ?? "").trim().slice(0, max);
const isBlank = (value) => value === undefined || value === null || String(value).trim() === "";

export function buildSparePartData(body = {}, { now = new Date() } = {}) {
    const errors = {};
    const data = {};

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

    // ---- Seller ----
    data.sellerType = choice("sellerType", PART_SELLER_TYPES, { fallback: "owner" });
    const isBusiness = PART_BUSINESS_TYPES.includes(data.sellerType);
    data.business = {
        name: isBusiness ? text(body.businessName, 80) : "",
        address: isBusiness ? text(body.businessAddress, 160) : "",
    };
    if (isBusiness && !data.business.name) errors.businessName = "Business name is required.";

    // ---- The part ----
    data.vehicleType = choice("vehicleType", PART_VEHICLE_TYPES, { fallback: "car" });
    data.partCategory = choice("partCategory", PART_CATEGORIES, { required: true, label: "Category" });
    data.title = text(body.title, 120);
    if (data.title.length < 3) errors.title = "Part name is required (3 characters at least).";
    data.brand = text(body.brand, 60);
    data.partNumber = text(body.partNumber, 60);
    data.condition = choice("condition", PART_CONDITIONS, { fallback: "used" });
    data.quantity = number("quantity", { min: 1, max: 100_000, integer: true, label: "Quantity" }) ?? 1;
    data.warrantyMonths = number("warrantyMonths", { max: 120, integer: true, label: "Warranty" });

    // ---- Compatibility ----
    const universal = parseBoolean(body.universal);
    const yearMax = now.getFullYear() + 1;
    const compatibility = {
        universal,
        make: universal ? "" : text(body.compatibleMake, 40),
        model: universal ? "" : text(body.compatibleModel, 40),
        yearFrom: universal ? null : number("yearFrom", { min: 1950, max: yearMax, integer: true, label: "Year from" }),
        yearTo: universal ? null : number("yearTo", { min: 1950, max: yearMax, integer: true, label: "Year to" }),
        notes: text(body.compatibilityNotes, 300),
    };
    if (!universal && !compatibility.make) errors.compatibleMake = "Choose the make the part fits, or mark it as universal.";
    if (compatibility.yearFrom && compatibility.yearTo && compatibility.yearFrom > compatibility.yearTo) {
        errors.yearTo = "The last year must be after the first year.";
    }
    data.compatibility = compatibility;

    // ---- Price ----
    data.price = number("price", { min: 1, max: 10_000_000, required: true, label: "Price" });
    data.negotiable = parseBoolean(body.negotiable);
    data.delivery = parseBoolean(body.delivery);
    data.installation = parseBoolean(body.installation);

    // ---- Text, place ----
    data.description = longText(body.description, 3000);
    data.city = text(body.city, 60);
    if (!data.city) errors.city = "City is required.";
    data.neighborhood = text(body.neighborhood, 80);
    data.mapLink = text(body.mapLink, 500);
    data.showEmail = parseBoolean(body.showEmail);

    return { data, errors };
}
