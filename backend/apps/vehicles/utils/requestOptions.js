// backend/apps/vehicles/utils/requestOptions.js
//
// Vehicle requests ("I am looking for a car, a moto or a spare part"): a user
// posts what they are looking for; dealers, rental agencies and parts shops
// who chose to receive requests are notified. The frontend has the same
// lists in src/Apps/vehicles/Requests/vehicleRequestOptions.js.

export const VEHICLE_CATEGORIES = ["car", "moto", "part"];
export const VEHICLE_TRANSACTIONS = ["buy", "rent"];
export const VEHICLE_FUELS = ["diesel", "petrol", "hybrid", "plug_in_hybrid", "electric", "lpg"];
export const VEHICLE_TRANSMISSIONS = ["manual", "automatic"];
export const PART_CATEGORIES = [
    "engine", "transmission", "brakes", "suspension", "electrical", "lighting", "body",
    "interior", "wheels", "exhaust", "cooling", "filters", "accessories", "other",
];

export const REQUEST_STATUSES = ["active", "closed", "expired"];
export const CLOSE_REASONS = ["found", "notNeeded", "other"];

export const REQUEST_LIFETIME_DAYS = 30;
export const MAX_ACTIVE_REQUESTS = 5;
export const MAX_RECIPIENTS = 1000;
