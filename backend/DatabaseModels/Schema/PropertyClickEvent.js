// backend/DatabaseModels/Schema/PropertyClickEvent.js
// One document per counted property click.
// PropertyClick keeps the lifetime counter; this collection powers
// trends, date ranges, unique visitors and conversion statistics.

import mongoose from "mongoose";

const { ObjectId } = mongoose.Schema.Types;

const propertyClickEventSchema = new mongoose.Schema(
    {
        propertyId: {
            type: ObjectId,
            ref: "Property",
            required: true,
        },
        propertyOwnerId: {
            type: ObjectId,
            ref: "User",
            default: null,
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
        title: { type: String, default: "" },
        propertyType: { type: String, default: "" },
        listingType: { type: String, default: "" },
        city: { type: String, default: "" },
        neighborhood: { type: String, default: "" },
        price: { type: Number, default: 0 },
        referrer: { type: String, default: "", maxlength: 500 },
    },
    {
        timestamps: { createdAt: true, updatedAt: false },
        versionKey: false,
    }
);

propertyClickEventSchema.index({ createdAt: -1 });
propertyClickEventSchema.index({ propertyId: 1, createdAt: -1 });
propertyClickEventSchema.index({ propertyId: 1, visitorKey: 1, createdAt: -1 });

// Optional: keep only two years of raw events.
// propertyClickEventSchema.index({ createdAt: 1 }, { expireAfterSeconds: 63072000 });

export default mongoose.models.PropertyClickEvent ||
    mongoose.model("PropertyClickEvent", propertyClickEventSchema);
