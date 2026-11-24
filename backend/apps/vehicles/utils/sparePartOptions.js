// backend/apps/vehicles/utils/sparePartOptions.js
//
// Allowed values for a spare part listing (cars and motos). The frontend
// has the same lists (src/Apps/vehicles/SpareParts/sparePartOptions.js).

// For which vehicles: car parts or moto / bike parts.
export const PART_VEHICLE_TYPES = ["car", "moto"];

export const PART_CATEGORIES = [
    "engine",
    "transmission",
    "brakes",
    "suspension",
    "electrical",
    "lighting",
    "body",
    "interior",
    "wheels",
    "exhaust",
    "cooling",
    "filters",
    "accessories",
    "other",
];

export const PART_CONDITIONS = ["new", "used", "refurbished"];

// Who sells: a private person, a parts shop, a scrapyard (casse).
export const PART_SELLER_TYPES = ["owner", "shop", "scrapyard"];
export const PART_BUSINESS_TYPES = ["shop", "scrapyard"];

// A part is sold, not rented.
export const PART_STATUSES = ["Available", "Sold", "Inactive"];
export const PART_PUBLIC_STATUSES = ["Available", "Sold"];

export const MAX_PART_IMAGES = 10;
