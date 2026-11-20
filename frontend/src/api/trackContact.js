// src/api/trackContact.js
// Fire-and-forget contact tracking.
// Never awaited before opening tel:/WhatsApp/links, so:
//  - the call/WhatsApp always opens even if tracking fails,
//  - browsers don't block window.open as a non-user-initiated popup.

import axiosInstance from "./axiosInstance";

const report = (label) => (error) => {
    console.warn(`[Tracking] ${label} not recorded:`, error?.message);
};

// Properties: action = "call" | "whatsapp"
export const trackPropertyContact = (propertyId, action) => {
    if (!propertyId) return;

    axiosInstance
        .post("/dashboard/property-contacts", { propertyId, action })
        .catch(report("Property contact"));
};

// Roommates: "call" | "whatsapp"
// Establishments: "call" | "whatsapp" | "email" | "website" | "booking" | "social"
export const trackListingContact = (listingType, listingId, action, target = "") => {
    if (!listingId) return;

    axiosInstance
        .post("/dashboard/listing-contacts", { listingType, listingId, action, target })
        .catch(report("Listing contact"));
};
