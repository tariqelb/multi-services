// backend/DatabaseModels/Schema/ListingContact.js
// Contact actions on roommate announcements and establishments.
// (Property contacts keep using the existing PropertyContact model.)

import mongoose from "mongoose";

const { ObjectId } = mongoose.Schema.Types;

export const LISTING_CONTACT_TYPES = ["roommate", "establishment"];

export const LISTING_CONTACT_ACTIONS = [
    "call",
    "whatsapp",
    "email",
    "website",
    "booking",
    "social",
];

const listingContactSchema = new mongoose.Schema(
    {
        listingType: {
            type: String,
            enum: LISTING_CONTACT_TYPES,
            required: true,
        },
        listingId: {
            type: ObjectId,
            required: true,
        },
        ownerId: {
            type: ObjectId,
            ref: "User",
            default: null,
        },
        // Logged-in visitor (null for anonymous visitors).
        clientId: {
            type: ObjectId,
            ref: "User",
            default: null,
        },
        // Unique visitor key (user, device ID or anonymous hash).
        visitorKey: {
            type: String,
            required: true,
            maxlength: 140,
        },
        action: {
            type: String,
            enum: LISTING_CONTACT_ACTIONS,
            required: true,
        },
        // e.g. social platform name ("Instagram").
        target: { type: String, default: "", maxlength: 60 },

        // Snapshot so statistics survive listing edits/deletions.
        title: { type: String, default: "" },
        city: { type: String, default: "" },
    },
    {
        timestamps: { createdAt: true, updatedAt: false },
        versionKey: false,
    }
);

listingContactSchema.index({ listingType: 1, createdAt: -1 });
listingContactSchema.index({ listingType: 1, listingId: 1, createdAt: -1 });
listingContactSchema.index({ ownerId: 1, createdAt: -1 });
listingContactSchema.index({
    listingId: 1,
    visitorKey: 1,
    action: 1,
    createdAt: -1,
});

export default mongoose.models.ListingContact ||
    mongoose.model("ListingContact", listingContactSchema);
