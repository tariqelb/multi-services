// src/Components/Settings/professionalProfileOptions.js
//
// Choices of Settings > "Receive requests" (one profile per account, both
// services). The backend has the same lists in
// backend/apps/main/utils/professionalProfileOptions.js.

export const BUSINESS_TYPES = ["owner", "agency", "dealer", "rental", "partsShop", "scrapyard"];

export const PROFILE_PROPERTY_TRANSACTIONS = ["rent", "furnished", "buy"];
export const PROFILE_PROPERTY_TYPES = [
    "Apartment", "House", "Villa", "Studio", "Room", "Store", "Office", "Land",
    "Warehouse", "Commercial space", "Commercial store", "Garage", "Other",
];

export const PROFILE_VEHICLE_CATEGORIES = ["car", "moto", "part"];
export const PROFILE_VEHICLE_TRANSACTIONS = ["buy", "rent"];

export const propertyTypeLabel = (t, type) => t(`requests.types.${type}`, type);
export const categoryLabel = (t, category) => t(`requests.categories.${category}`, category);
