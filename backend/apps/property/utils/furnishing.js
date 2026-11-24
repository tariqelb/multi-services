// Furnished / unfurnished only applies to homes.
// Land, stores, offices, garages... keep furnishingStatus = null.

export const FURNISHABLE_TYPES = ["apartment", "house", "villa", "studio", "room"];
export const FURNISHING_STATUSES = ["Furnished", "Unfurnished"];

export const isFurnishableType = (propertyType) =>
    FURNISHABLE_TYPES.includes(String(propertyType ?? "").trim().toLowerCase());

/**
 * Returns { value } or { error } for a property type + submitted status.
 */
export function resolveFurnishingStatus(propertyType, furnishingStatus) {
    if (!isFurnishableType(propertyType)) return { value: null };

    const value = typeof furnishingStatus === "string" ? furnishingStatus.trim() : "";

    if (!FURNISHING_STATUSES.includes(value)) {
        return { error: "Please select a valid furnishing status." };
    }

    return { value };
}
