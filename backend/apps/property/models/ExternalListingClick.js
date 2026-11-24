
import mongoose from "mongoose";

const externalListingClickSchema = new mongoose.Schema(
    {
        externalListingId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "ExternalListing",
            required: true,
            unique: true,
        },

        sourceUrl: {
            type: String,
            required: true,
        },

        sourceDomain: {
            type: String,
            required: true,
            index: true,
        },

        sourceName: {
            type: String,
            default: "",
        },

        title: {
            type: String,
            default: "",
        },

        listingType: {
            type: String,
            enum: ["For Sale", "For Rent", "Unknown"],
            default: "Unknown",
        },

        propertyType: {
            type: String,
            default: "",
        },

        city: {
            type: String,
            default: "",
            index: true,
        },

        neighborhood: {
            type: String,
            default: "",
        },

        clickCount: {
            type: Number,
            default: 0,
            min: 0,
        },

        firstClickedAt: {
            type: Date,
            default: Date.now,
        },

        lastClickedAt: {
            type: Date,
            default: Date.now,
            index: true,
        },

        lastClickedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null,
        },

        lastReferrer: {
            type: String,
            default: "",
        },
    },
    {
        timestamps: true,
    }
);

externalListingClickSchema.index({
    clickCount: -1,
});

externalListingClickSchema.index({
    city: 1,
    propertyType: 1,
});

externalListingClickSchema.index({
    sourceDomain: 1,
    clickCount: -1,
});

export default mongoose.model(
    "ExternalListingClick",
    externalListingClickSchema
);
