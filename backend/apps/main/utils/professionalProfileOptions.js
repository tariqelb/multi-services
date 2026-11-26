// backend/apps/main/utils/professionalProfileOptions.js
//
// Choices of the professional profile (Settings > Receive requests).
// The profile is one per account and covers both services; the requests
// themselves live in each service (property/, vehicles/).

export const PROFILE_FIELDS = ["property", "vehicle"];
export const BUSINESS_TYPES = ["owner", "agency", "dealer", "rental", "partsShop", "scrapyard"];
export const DIGEST_FREQUENCIES = ["instant", "daily"];
export const MAX_PROFILE_CITIES = 30;

// Property work
export const PROFILE_PROPERTY_TRANSACTIONS = ["rent", "furnished", "buy"];
export const PROFILE_PROPERTY_TYPES = [
    "Apartment", "House", "Villa", "Studio", "Room", "Store", "Office", "Land",
    "Warehouse", "Commercial space", "Commercial store", "Garage", "Other",
];

// Vehicle work
export const PROFILE_VEHICLE_CATEGORIES = ["car", "moto", "part"];
export const PROFILE_VEHICLE_TRANSACTIONS = ["buy", "rent"];
