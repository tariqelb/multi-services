// backend/apps/vehicles/models/VehicleExternalListingRemoved.js
//
// Remembers vehicle listings removed because they were no longer available on their
// website, so the collector does not add them back later (expired listings
// often stay in a website's sitemap for a while).
//
// Records expire automatically after one year.

import mongoose from "mongoose";

const ONE_YEAR_SECONDS = 365 * 24 * 60 * 60;

const vehicleExternalListingRemovedSchema = new mongoose.Schema(
    {
        sourceUrl: {
            type: String,
            required: true,
            unique: true,
        },

        sourceDomain: {
            type: String,
            default: "",
            index: true,
        },

        title: {
            type: String,
            default: "",
        },

        reason: {
            type: String,
            default: "",
        },

        removedBy: {
            type: String,
            default: "",
        },

        removedAt: {
            type: Date,
            default: Date.now,
            expires: ONE_YEAR_SECONDS,
        },
    },
    {
        timestamps: false,
        collection: "vehicle_external_listings_removed",
    }
);

export default mongoose.models.VehicleExternalListingRemoved ||
    mongoose.model("VehicleExternalListingRemoved", vehicleExternalListingRemovedSchema);
