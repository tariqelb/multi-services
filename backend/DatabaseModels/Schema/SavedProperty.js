
import mongoose from "mongoose";

const savedPropertyActivitySchema = new mongoose.Schema(
    {
        action: {
            type: String,
            enum: ["saved", "unsaved"],
            required: true,
        },
        at: {
            type: Date,
            default: Date.now,
        },
    },
    { _id: false }
);

const savedPropertySchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },

        propertyId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Property",
            required: true,
        },

        propertyInfo: {
            title: { type: String, default: "" },
            price: { type: Number, default: 0 },
            listingType: { type: String, default: "" },
            propertyType: { type: String, default: "" },
            city: { type: String, default: "" },
            neighborhood: { type: String, default: "" },
            image: { type: String, default: "" },
        },

        // Current saved state
        isSaved: {
            type: Boolean,
            default: true,
            index: true,
        },

        savedAt: {
            type: Date,
            default: Date.now,
        },

        unsavedAt: {
            type: Date,
            default: null,
        },

        // Historical save and unsave actions
        activityHistory: {
            type: [savedPropertyActivitySchema],
            default: [],
        },
    },
    {
        timestamps: true,
    }
);

// One record per user and property, including previously unsaved properties.
savedPropertySchema.index(
    { userId: 1, propertyId: 1 },
    { unique: true }
);

savedPropertySchema.index({ isSaved: 1, savedAt: -1 });

const SavedProperty = mongoose.model(
    "SavedProperty",
    savedPropertySchema
);

export default SavedProperty;
