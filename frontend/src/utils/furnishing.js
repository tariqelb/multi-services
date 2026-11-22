// Furnished / unfurnished only makes sense for places people live in.
// Land, stores, offices, garages... have no furnishing status.

export const FURNISHABLE_TYPES = ["apartment", "house", "villa", "studio", "room"];

const normalize = (value) => String(value ?? "").trim().toLowerCase();

export const isFurnishableType = (propertyType) =>
    FURNISHABLE_TYPES.includes(normalize(propertyType));

/**
 * "Furnished" | "Unfurnished" for homes, null for other types.
 * Older listings without a status count as unfurnished.
 */
export function getFurnishingStatus(property = {}) {
    if (!isFurnishableType(property.propertyType)) return null;

    return normalize(property.furnishingStatus) === "furnished"
        ? "Furnished"
        : "Unfurnished";
}
