// backend/apps/vehicles/models/SavedSparePart.js
//
// Spare parts a user saved (same idea as SavedVehicle): one row per user
// and part, removing only marks it unsaved, the history is kept.

import mongoose from "mongoose";

const activitySchema = new mongoose.Schema(
    {
        action: { type: String, enum: ["saved", "unsaved"], required: true },
        at: { type: Date, default: Date.now },
    },
    { _id: false },
);

const savedSparePartSchema = new mongoose.Schema(
    {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        partId: { type: mongoose.Schema.Types.ObjectId, ref: "SparePart", required: true },
        isSaved: { type: Boolean, default: true },
        savedAt: { type: Date, default: Date.now },
        unsavedAt: { type: Date, default: null },
        activityHistory: { type: [activitySchema], default: [] },
    },
    { timestamps: true },
);

savedSparePartSchema.index({ userId: 1, partId: 1 }, { unique: true });
savedSparePartSchema.index({ userId: 1, isSaved: 1, savedAt: -1 });
savedSparePartSchema.index({ partId: 1 });

const SavedSparePart = mongoose.models.SavedSparePart || mongoose.model("SavedSparePart", savedSparePartSchema);

export default SavedSparePart;
