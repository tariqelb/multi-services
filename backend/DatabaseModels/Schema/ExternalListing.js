import mongoose from "mongoose";

const externalListingSchema = new mongoose.Schema(
    {
        sourceUrl: {
            type: String,
            required: true,
        },

        sourceDomain: {
            type: String,
            required: true,
        },

        sourceName: {
            type: String,
            default: "",
        },

        sourceListingId: {
            type: String,
            default: "",
        },

        title: {
            type: String,
            default: "",
        },

        description: {
            type: String,
            default: "",
        },

        imageUrl: {
            type: String,
            default: "",
        },

        imageUrls: {
            type: [String],
            default: [],
        },

        price: {
            type: Number,
            default: null,
        },

        currency: {
            type: String,
            default: "MAD",
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
        },

        neighborhood: {
            type: String,
            default: "",
        },

        surface: {
            type: Number,
            default: null,
        },

        rooms: {
            type: Number,
            default: null,
        },

        bathrooms: {
            type: Number,
            default: null,
        },

        publishedAt: {
            type: Date,
            default: null,
        },

        lastCheckedAt: {
            type: Date,
            default: Date.now,
        },

        lastSeenAt: {
            type: Date,
            default: Date.now,
        },

        contentHash: {
            type: String,
            default: "",
        },

        status: {
            type: String,
            enum: ["active", "unavailable", "error"],
            default: "active",
        },

        extractionMethod: {
            type: String,
            enum: ["metadata", "structured_data", "source_parser"],
            default: "metadata",
        },

        lastError: {
            type: String,
            default: "",
        },
    },
    {
        timestamps: true,
    }
);

// A source publication should only be stored once.
externalListingSchema.index(
    { sourceUrl: 1 },
    { unique: true }
);

externalListingSchema.index({
    status: 1,
    createdAt: -1,
});

externalListingSchema.index({
    sourceDomain: 1,
    lastSeenAt: -1,
});

export default mongoose.model(
    "ExternalListing",
    externalListingSchema
);