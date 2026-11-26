// backend/apps/main/models/ServiceRequest.js
//
// A request: a user describes what they are looking for (a property or a
// vehicle / spare part). Owners, agencies and dealers who chose to receive
// requests (User.professionalProfile) are notified and can reply.
// Active for 30 days (expiresAt), then "expired" unless renewed.

import mongoose from "mongoose";

import {
    CLOSE_REASONS,
    PART_CATEGORIES,
    PROPERTY_FEATURES,
    PROPERTY_TRANSACTIONS,
    PROPERTY_TYPES,
    REQUEST_SERVICES,
    REQUEST_STATUSES,
    VEHICLE_CATEGORIES,
    VEHICLE_FUELS,
    VEHICLE_TRANSACTIONS,
    VEHICLE_TRANSMISSIONS,
} from "../utils/requestOptions.js";

const serviceRequestSchema = new mongoose.Schema(
    {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
        service: { type: String, enum: REQUEST_SERVICES, required: true },
        // property: rent | furnished | buy; vehicle: buy | rent
        transaction: { type: String, enum: [...new Set([...PROPERTY_TRANSACTIONS, ...VEHICLE_TRANSACTIONS])], required: true },

        // Property
        propertyTypes: { type: [{ type: String, enum: PROPERTY_TYPES }], default: undefined },
        minRooms: { type: Number, min: 0, max: 20, default: null },
        minSurface: { type: Number, min: 0, max: 100000, default: null },
        features: { type: [{ type: String, enum: PROPERTY_FEATURES }], default: undefined },
        moveInDate: { type: Date, default: null },

        // Vehicle
        vehicleCategory: { type: String, enum: [...VEHICLE_CATEGORIES, null], default: null },
        make: { type: String, trim: true, maxlength: 60, default: "" },
        model: { type: String, trim: true, maxlength: 60, default: "" },
        yearFrom: { type: Number, min: 1950, max: 2100, default: null },
        yearTo: { type: Number, min: 1950, max: 2100, default: null },
        maxMileage: { type: Number, min: 0, max: 2000000, default: null },
        fuel: { type: String, enum: [...VEHICLE_FUELS, ""], default: "" },
        transmission: { type: String, enum: [...VEHICLE_TRANSMISSIONS, ""], default: "" },
        partCategory: { type: String, enum: [...PART_CATEGORIES, ""], default: "" },
        partName: { type: String, trim: true, maxlength: 120, default: "" },

        // Both
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
    { timestamps: true, collection: "service_requests" }
);

serviceRequestSchema.index({ service: 1, status: 1, createdAt: -1 });
serviceRequestSchema.index({ status: 1, digestSentAt: 1, createdAt: 1 });

const ServiceRequest = mongoose.models.ServiceRequest || mongoose.model("ServiceRequest", serviceRequestSchema);

export default ServiceRequest;
