// backend/DatabaseModels/Schema/ExternalListingClickEvent.js
// One document per counted external listing click.
// ExternalListingClick keeps the lifetime counter; this collection powers
// trends, date ranges and unique visitor statistics.

import mongoose from "mongoose";

const { ObjectId } = mongoose.Schema.Types;

const externalListingClickEventSchema = new mongoose.Schema(
    {
        externalListingId: {
            type: ObjectId,
            ref: "ExternalListing",
            required: true,
        },
        userId: {
            type: ObjectId,
            ref: "User",
            default: null,
        },
        visitorKey: {
            type: String,
            required: true,
            maxlength: 140,
        },
        sourceDomain: { type: String, default: "" },
        sourceName: { type: String, default: "" },
        title: { type: String, default: "" },
        listingType: { type: String, default: "" },
        propertyType: { type: String, default: "" },
        city: { type: String, default: "" },
        neighborhood: { type: String, default: "" },
        referrer: { type: String, default: "", maxlength: 500 },
    },
    {
        timestamps: { createdAt: true, updatedAt: false },
        versionKey: false,
    }
);

externalListingClickEventSchema.index({ createdAt: -1 });
externalListingClickEventSchema.index({ externalListingId: 1, createdAt: -1 });
externalListingClickEventSchema.index({
    externalListingId: 1,
    visitorKey: 1,
    createdAt: -1,
});

export default mongoose.models.ExternalListingClickEvent ||
    mongoose.model(
        "ExternalListingClickEvent",
        externalListingClickEventSchema
    );
