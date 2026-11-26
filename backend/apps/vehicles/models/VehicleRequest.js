// backend/apps/vehicles/models/VehicleRequest.js
//
// "I am looking for a vehicle or a spare part": what a user is looking for.
// Dealers, rental agencies and parts shops who chose to receive vehicle
// requests (User.professionalProfile) are notified and can reply.
// Active for 30 days (expiresAt), then "expired" unless renewed.

import mongoose from "mongoose";

import {
    CLOSE_REASONS,
    PART_CATEGORIES,
    REQUEST_STATUSES,
    VEHICLE_CATEGORIES,
    VEHICLE_FUELS,
    VEHICLE_TRANSACTIONS,
    VEHICLE_TRANSMISSIONS,
} from "../utils/requestOptions.js";

const vehicleRequestSchema = new mongoose.Schema(
    {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
        vehicleCategory: { type: String, enum: VEHICLE_CATEGORIES, required: true },
        // Spare parts: always "buy".
        transaction: { type: String, enum: VEHICLE_TRANSACTIONS, required: true },
        make: { type: String, trim: true, maxlength: 60, default: "" },
        model: { type: String, trim: true, maxlength: 60, default: "" },
        yearFrom: { type: Number, min: 1950, max: 2100, default: null },
        yearTo: { type: Number, min: 1950, max: 2100, default: null },
        maxMileage: { type: Number, min: 0, max: 2000000, default: null },
        fuel: { type: String, enum: [...VEHICLE_FUELS, ""], default: "" },
        transmission: { type: String, enum: [...VEHICLE_TRANSMISSIONS, ""], default: "" },
        partCategory: { type: String, enum: [...PART_CATEGORIES, ""], default: "" },
        partName: { type: String, trim: true, maxlength: 120, default: "" },

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
    { timestamps: true, collection: "vehicle_requests" }
);

vehicleRequestSchema.index({ status: 1, vehicleCategory: 1, createdAt: -1 });
vehicleRequestSchema.index({ status: 1, digestSentAt: 1, createdAt: 1 });

const VehicleRequest = mongoose.models.VehicleRequest || mongoose.model("VehicleRequest", vehicleRequestSchema);

export default VehicleRequest;
