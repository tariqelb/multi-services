// backend/apps/property/utils/requestOptions.js
//
// Property requests ("I am looking for a property"): a user posts what they
// are looking for; owners and agencies who chose to receive requests are
// notified. The frontend has the same lists in
// src/Apps/Property/Requests/propertyRequestOptions.js.

export const PROPERTY_TRANSACTIONS = ["rent", "furnished", "buy"];
export const PROPERTY_TYPES = [
    "Apartment", "House", "Villa", "Studio", "Room", "Store", "Office", "Land",
    "Warehouse", "Commercial space", "Commercial store", "Garage", "Other",
];
export const PROPERTY_FEATURES = ["parking", "elevator", "terrace", "garden", "pool", "airConditioning", "seaView", "petsAllowed"];

export const REQUEST_STATUSES = ["active", "closed", "expired"];
export const CLOSE_REASONS = ["found", "notNeeded", "other"];

export const REQUEST_LIFETIME_DAYS = 30;
export const MAX_ACTIVE_REQUESTS = 5;
export const MAX_RECIPIENTS = 1000;
