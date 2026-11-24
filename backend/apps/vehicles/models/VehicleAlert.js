// backend/apps/vehicles/models/VehicleAlert.js
//
// A user's alert for new vehicles. When a vehicle is published, every active
// alert it matches notifies its owner (in-app notification, email and
// WhatsApp, depending on the user's settings). Archived alerts are silent and
// kept for statistics; they can be restored.
//
// Empty lists mean "any": no city = every city, no body type = every car...

import mongoose from "mongoose";

import { BODY_TYPES, CATEGORIES, LISTING_TYPES, MOTO_TYPES } from "../utils/vehicleOptions.js";

export const MAX_ACTIVE_ALERTS = 20;
export const MAX_ALERT_MAKES = 10;

const nonEmpty = (message) => ({
    validator: (values) => Array.isArray(values) && values.length > 0,
    message,
});

const vehicleAlertSchema = new mongoose.Schema(
    {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },

        // "" = every city.
        city: { type: String, trim: true, maxlength: 100, default: "" },

        // Sale, rent or both.
        listingTypes: {
            type: [{ type: String, enum: LISTING_TYPES }],
            validate: nonEmpty("Choose for sale, for rent or both."),
        },

        // Cars, motos & bikes or both.
        categories: {
            type: [{ type: String, enum: CATEGORIES }],
            validate: nonEmpty("Choose vehicles, motos & bikes or both."),
        },

        // Empty = every type of that section.
        bodyTypes: { type: [{ type: String, enum: BODY_TYPES }], default: [] },
        motoTypes: { type: [{ type: String, enum: MOTO_TYPES }], default: [] },

        // Optional: makes (as typed) and their lower-case copy used to match.
        makes: { type: [{ type: String, trim: true, maxlength: 60 }], default: [] },
        makeKeys: { type: [String], default: [], select: false },

        // Optional maximum price (MAD; per day for rentals).
        maxPrice: { type: Number, min: 0, default: null },

        isArchived: { type: Boolean, default: false, index: true },
        archivedAt: { type: Date, default: null },

        // How often it matched (shown on the alert card).
        matchCount: { type: Number, default: 0 },
        lastMatchedAt: { type: Date, default: null },
    },
    { timestamps: true },
);

vehicleAlertSchema.pre("validate", function () {
    const unique = (values) => [...new Set((values || []).filter(Boolean))];
    this.listingTypes = unique(this.listingTypes);
    this.categories = unique(this.categories);
    this.bodyTypes = this.categories.includes("car") ? unique(this.bodyTypes) : [];
    this.motoTypes = this.categories.includes("moto") ? unique(this.motoTypes) : [];
    const makes = [];
    const keys = new Set();
    for (const make of this.makes || []) {
        const key = String(make).trim().toLowerCase();
        if (key && !keys.has(key)) {
            keys.add(key);
            makes.push(String(make).trim());
        }
    }
    this.makes = makes.slice(0, MAX_ALERT_MAKES);
    this.makeKeys = [...keys].slice(0, MAX_ALERT_MAKES);
});

// Matching on publish: active alerts by offer and section.
// MongoDB cannot put two array fields in one index ("parallel arrays"),
// so the matching index holds one array only (categories).
vehicleAlertSchema.index({ isArchived: 1, categories: 1 });
vehicleAlertSchema.index({ user: 1, isArchived: 1 });

const VehicleAlert = mongoose.models.VehicleAlert || mongoose.model("VehicleAlert", vehicleAlertSchema);

// Remove the invalid index created by the first version (it blocked every
// new alert with "cannot index parallel arrays"). Runs once the database is
// connected; nothing happens when the index is not there.
const OLD_INDEX = "isArchived_1_listingTypes_1_categories_1";
const dropOldIndex = () =>
    VehicleAlert.collection
        .dropIndex(OLD_INDEX)
        .then(() => console.log(`[Vehicles] Removed invalid alert index ${OLD_INDEX}`))
        .catch(() => {});
if (mongoose.connection?.readyState === 1) dropOldIndex();
else mongoose.connection?.once?.("open", dropOldIndex);

export default VehicleAlert;
