// backend/apps/vehicles/models/SavedVehicle.js
//
// Vehicles, motos and bikes a user saved. Same idea as the saved properties,
// kept apart: one row per user and vehicle, removing only marks it unsaved
// and every save / unsave is kept in the history (for demand statistics).

import mongoose from "mongoose";

const activitySchema = new mongoose.Schema(
    {
        action: { type: String, enum: ["saved", "unsaved"], required: true },
        at: { type: Date, default: Date.now },
    },
    { _id: false },
);

const savedVehicleSchema = new mongoose.Schema(
    {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        vehicleId: { type: mongoose.Schema.Types.ObjectId, ref: "Vehicle", required: true },
        isSaved: { type: Boolean, default: true },
        savedAt: { type: Date, default: Date.now },
        unsavedAt: { type: Date, default: null },
        activityHistory: { type: [activitySchema], default: [] },
    },
    { timestamps: true },
);

savedVehicleSchema.index({ userId: 1, vehicleId: 1 }, { unique: true });
savedVehicleSchema.index({ userId: 1, isSaved: 1, savedAt: -1 });
savedVehicleSchema.index({ vehicleId: 1 });

const SavedVehicle = mongoose.models.SavedVehicle || mongoose.model("SavedVehicle", savedVehicleSchema);

export default SavedVehicle;
