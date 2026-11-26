// backend/apps/vehicles/models/VehicleExternalListing.js
//
// Vehicles, motos and spare parts published on other Moroccan websites
// (Avito, Moteur.ma, Wandaloo...), collected by the administrators
// (Admin > Vehicles > External listings) and shown in Vehicles > External
// listings. A card opens the listing on its website.

import mongoose from "mongoose";

const vehicleExternalListingSchema = new mongoose.Schema(
    {
        sourceUrl: { type: String, required: true },
        sourceDomain: { type: String, required: true },
        sourceName: { type: String, default: "" },
        sourceListingId: { type: String, default: "" },

        title: { type: String, default: "" },
        description: { type: String, default: "" },
        imageUrl: { type: String, default: "" },
        imageUrls: { type: [String], default: [] },

        price: { type: Number, default: null },
        currency: { type: String, default: "MAD" },
        // "day", "month"... (shown next to the price of a rental).
        priceUnit: { type: String, default: "" },

        listingType: { type: String, enum: ["sale", "rent", "unknown"], default: "unknown" },
        category: { type: String, enum: ["car", "moto", "part", ""], default: "" },
        make: { type: String, default: "" },
        model: { type: String, default: "" },
        year: { type: Number, default: null },
        mileage: { type: Number, default: null },
        fuel: { type: String, default: "" },
        transmission: { type: String, default: "" },

        city: { type: String, default: "" },
        neighborhood: { type: String, default: "" },

        publishedAt: { type: Date, default: null },
        lastCheckedAt: { type: Date, default: Date.now },
        lastSeenAt: { type: Date, default: Date.now },
        contentHash: { type: String, default: "" },

        status: { type: String, enum: ["active", "unavailable", "error"], default: "active" },
        extractionMethod: { type: String, enum: ["metadata", "structured_data", "source_parser", "manual"], default: "metadata" },
        lastError: { type: String, default: "" },

        // Times a visitor opened the listing on its website.
        clicks: { type: Number, default: 0 },
        lastClickedAt: { type: Date, default: null },
    },
    { timestamps: true, collection: "vehicle_external_listings" }
);

// A listing of a website is stored once.
vehicleExternalListingSchema.index({ sourceUrl: 1 }, { unique: true });
vehicleExternalListingSchema.index({ status: 1, createdAt: -1 });
vehicleExternalListingSchema.index({ sourceDomain: 1, lastSeenAt: -1 });
vehicleExternalListingSchema.index({ status: 1, category: 1, listingType: 1 });

export default mongoose.models.VehicleExternalListing ||
    mongoose.model("VehicleExternalListing", vehicleExternalListingSchema);
