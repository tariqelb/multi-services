// backend/apps/main/utils/requestOptions.js
//
// Vocabulary of "requests" (a user posts what they are looking for; owners,
// agencies and dealers who chose to receive requests are notified).
// The frontend has the same lists in src/Components/Requests/requestOptions.js.

export const REQUEST_SERVICES = ["property", "vehicle"];

// Property: what the seeker wants.
export const PROPERTY_TRANSACTIONS = ["rent", "furnished", "buy"];
export const PROPERTY_TYPES = [
    "Apartment", "House", "Villa", "Studio", "Room", "Store", "Office", "Land",
    "Warehouse", "Commercial space", "Commercial store", "Garage", "Other",
];
export const PROPERTY_FEATURES = ["parking", "elevator", "terrace", "garden", "pool", "airConditioning", "seaView", "petsAllowed"];

// Vehicles: cars, motos & bikes, spare parts; buy or rent (parts: buy).
export const VEHICLE_CATEGORIES = ["car", "moto", "part"];
export const VEHICLE_TRANSACTIONS = ["buy", "rent"];
export const VEHICLE_FUELS = ["diesel", "petrol", "hybrid", "plug_in_hybrid", "electric", "lpg"];
export const VEHICLE_TRANSMISSIONS = ["manual", "automatic"];
export const PART_CATEGORIES = [
    "engine", "transmission", "brakes", "suspension", "electrical", "lighting", "body",
    "interior", "wheels", "exhaust", "cooling", "filters", "accessories", "other",
];

// Professional profile (Settings > Receive requests).
export const BUSINESS_TYPES = ["owner", "agency", "dealer", "rental", "partsShop", "scrapyard"];
export const DIGEST_FREQUENCIES = ["instant", "daily"];

export const REQUEST_STATUSES = ["active", "closed", "expired"];
export const CLOSE_REASONS = ["found", "notNeeded", "other"];

export const REQUEST_LIFETIME_DAYS = 30;
export const MAX_ACTIVE_REQUESTS = 5;
export const MAX_PROFILE_CITIES = 30;
export const MAX_RECIPIENTS = 1000;
