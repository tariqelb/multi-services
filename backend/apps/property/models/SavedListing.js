// backend/apps/property/models/SavedListing.js
//
// Roommate announcements and hotels / riads a user saved (properties have
// their own SavedProperty). One row per user and listing: removing only
// marks it unsaved, and every save / unsave is kept in the history.

import mongoose from "mongoose";

export const SAVED_LISTING_TYPES = ["roommate", "establishment"];

const activitySchema = new mongoose.Schema(
    {
        action: { type: String, enum: ["saved", "unsaved"], required: true },
        at: { type: Date, default: Date.now },
    },
    { _id: false },
);

const savedListingSchema = new mongoose.Schema(
    {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        listingType: { type: String, enum: SAVED_LISTING_TYPES, required: true },
        listingId: { type: mongoose.Schema.Types.ObjectId, required: true },
        isSaved: { type: Boolean, default: true },
        savedAt: { type: Date, default: Date.now },
        unsavedAt: { type: Date, default: null },
        activityHistory: { type: [activitySchema], default: [] },
    },
    { timestamps: true },
);

savedListingSchema.index({ userId: 1, listingType: 1, listingId: 1 }, { unique: true });
savedListingSchema.index({ userId: 1, isSaved: 1, savedAt: -1 });
savedListingSchema.index({ listingType: 1, listingId: 1 });

const SavedListing = mongoose.models.SavedListing || mongoose.model("SavedListing", savedListingSchema);

export default SavedListing;
