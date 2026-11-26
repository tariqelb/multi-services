// backend/apps/property/models/PropertyRequest.js
//
// "I am looking for a property": what a user is looking for. Owners and
// agencies who chose to receive property requests (User.professionalProfile)
// are notified and can reply. Active for 30 days (expiresAt), then
// "expired" unless renewed.

import mongoose from "mongoose";

import { CLOSE_REASONS, PROPERTY_FEATURES, PROPERTY_TRANSACTIONS, PROPERTY_TYPES, REQUEST_STATUSES } from "../utils/requestOptions.js";

const propertyRequestSchema = new mongoose.Schema(
    {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
        transaction: { type: String, enum: PROPERTY_TRANSACTIONS, required: true },
        propertyTypes: { type: [{ type: String, enum: PROPERTY_TYPES }], default: undefined },
        minRooms: { type: Number, min: 0, max: 20, default: null },
        minSurface: { type: Number, min: 0, max: 100000, default: null },
        features: { type: [{ type: String, enum: PROPERTY_FEATURES }], default: undefined },
        moveInDate: { type: Date, default: null },

        city: { type: String, required: true, trim: true, maxlength: 100 },
        neighborhoods: { type: String, trim: true, maxlength: 200, default: "" },
        budgetMin: { type: Number, min: 0, default: null },
        budgetMax: { type: Number, min: 0, default: null },
        message: { type: String, trim: true, maxlength: 1000, default: "" },

        status: { type: String, enum: REQUEST_STATUSES, default: "active", index: true },
        closedReason: { type: String, enum: [...CLOSE_REASONS, ""], default: "" },
        expiresAt: { type: Date, required: true, index: true },
        renewedAt: { type: Date, default: null },

        recipientsCount: { type: Number, default: 0 },
        responsesCount: { type: Number, default: 0 },
        // Daily summaries: set once this request was included in one.
        digestSentAt: { type: Date, default: null },
    },
    { timestamps: true, collection: "property_requests" }
);

propertyRequestSchema.index({ status: 1, createdAt: -1 });
propertyRequestSchema.index({ status: 1, digestSentAt: 1, createdAt: 1 });

const PropertyRequest = mongoose.models.PropertyRequest || mongoose.model("PropertyRequest", propertyRequestSchema);

export default PropertyRequest;
