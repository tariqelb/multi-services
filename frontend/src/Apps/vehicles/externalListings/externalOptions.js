// src/Apps/vehicles/externalListings/externalOptions.js
//
// Vehicle external listings (Avito, Moteur.ma, Wandaloo...): values shared by
// the user page and the admin page. Same values as the backend
// (backend/apps/vehicles/services/externalListings/listingClassifier.js).

export const API = "/vehicles/external-listings";
export const CATEGORIES = ["car", "moto", "part"];
export const LISTING_TYPES = ["sale", "rent"];
export const SORTS = ["newest", "priceAsc", "priceDesc"];
