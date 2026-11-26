// backend/apps/vehicles/services/externalListings/listingNormalizer.js
//
// Cleans what was read from a listing page before it is stored
// (VehicleExternalListing).

const LISTING_TYPES = new Set(["sale", "rent", "unknown"]);
const CATEGORIES = new Set(["car", "moto", "part", ""]);
const FUELS = new Set(["diesel", "petrol", "hybrid", "electric", "lpg", ""]);
const TRANSMISSIONS = new Set(["manual", "automatic", ""]);
const EXTRACTION_METHODS = new Set(["metadata", "structured_data", "source_parser", "manual"]);

function cleanText(value, maxLength = 5000) {
    if (typeof value !== "string") return "";
    return value.trim().slice(0, maxLength);
}

function normalizeNumber(value) {
    if (value === null || value === undefined || value === "") return null;
    const number = Number(value);
    return Number.isFinite(number) && number >= 0 ? number : null;
}

function normalizeDate(value) {
    if (!value) return null;
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
}

function normalizeImageUrl(value) {
    if (!value) return "";
    try {
        const url = new URL(value);
        return ["http:", "https:"].includes(url.protocol) ? url.href : "";
    } catch {
        return "";
    }
}

const pick = (value, allowed, fallback = "") => (allowed.has(value) ? value : fallback);

export function normalizeExternalListing(data) {
    const url = new URL(data.sourceUrl);
    if (!["http:", "https:"].includes(url.protocol)) throw new Error("Unsupported source URL.");

    const imageUrls = Array.isArray(data.imageUrls)
        ? [...new Set(data.imageUrls.map(normalizeImageUrl).filter(Boolean))].slice(0, 20)
        : [];
    const year = normalizeNumber(data.year);

    return {
        sourceUrl: url.href,
        sourceDomain: url.hostname.toLowerCase(),
        sourceName: cleanText(data.sourceName, 200),
        sourceListingId: cleanText(data.sourceListingId, 200),

        title: cleanText(data.title, 500),
        description: cleanText(data.description, 10000),
        imageUrl: normalizeImageUrl(data.imageUrl) || imageUrls[0] || "",
        imageUrls,

        price: normalizeNumber(data.price),
        currency: cleanText(data.currency || "MAD", 10),
        priceUnit: cleanText(data.priceUnit, 50),

        listingType: pick(data.listingType, LISTING_TYPES, "unknown"),
        category: pick(data.category, CATEGORIES),
        make: cleanText(data.make, 60),
        model: cleanText(data.model, 60),
        year: year && year >= 1950 && year <= 2100 ? year : null,
        mileage: normalizeNumber(data.mileage),
        fuel: pick(data.fuel, FUELS),
        transmission: pick(data.transmission, TRANSMISSIONS),

        city: cleanText(data.city, 100),
        neighborhood: cleanText(data.neighborhood, 150),

        publishedAt: normalizeDate(data.publishedAt),
        lastCheckedAt: new Date(),
        lastSeenAt: new Date(),
        contentHash: cleanText(data.contentHash, 128),
        status: "active",
        extractionMethod: pick(data.extractionMethod, EXTRACTION_METHODS, "metadata"),
        lastError: "",
    };
}
