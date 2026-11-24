// backend/apps/vehicles/models/SparePart.js
//
// One spare part listing (car or moto / bike part). Like vehicles, the
// contact is not stored: the details page shows the seller's current,
// verified phone / WhatsApp / email.

import mongoose from "mongoose";

import {
    PART_CATEGORIES,
    PART_CONDITIONS,
    PART_SELLER_TYPES,
    PART_STATUSES,
    PART_VEHICLE_TYPES,
} from "../utils/sparePartOptions.js";

const { Schema } = mongoose;

const sparePartSchema = new Schema(
    {
        userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },

        // Car or moto / bike part, and its family (brakes, engine...).
        vehicleType: { type: String, enum: PART_VEHICLE_TYPES, default: "car", index: true },
        partCategory: { type: String, enum: PART_CATEGORIES, required: true },

        // Seller: private person, parts shop or scrapyard.
        sellerType: { type: String, enum: PART_SELLER_TYPES, default: "owner" },
        business: {
            name: { type: String, trim: true, default: "" },
            address: { type: String, trim: true, default: "" },
        },

        // The part
        title: { type: String, required: true, trim: true },
        brand: { type: String, trim: true, default: "" }, // Bosch, Valeo, original...
        partNumber: { type: String, trim: true, default: "" }, // OEM / reference
        condition: { type: String, enum: PART_CONDITIONS, default: "used" },
        quantity: { type: Number, min: 1, default: 1 },
        warrantyMonths: { type: Number, min: 0, default: null },

        // Compatible vehicles: universal, or a make / model / years.
        compatibility: {
            universal: { type: Boolean, default: false },
            make: { type: String, trim: true, default: "" },
            model: { type: String, trim: true, default: "" },
            yearFrom: { type: Number, default: null },
            yearTo: { type: Number, default: null },
            notes: { type: String, trim: true, default: "" }, // other compatible vehicles
        },

        // Price and delivery
        price: { type: Number, required: true, min: 0 },
        negotiable: { type: Boolean, default: false },
        delivery: { type: Boolean, default: false },
        installation: { type: Boolean, default: false }, // fitting offered

        status: { type: String, enum: PART_STATUSES, default: "Available" },

        description: { type: String, trim: true, default: "" },

        // Place
        city: { type: String, required: true, trim: true },
        neighborhood: { type: String, trim: true, default: "" },
        mapLink: { type: String, trim: true, default: "" },
        location: {
            lat: { type: Number, default: null },
            lng: { type: Number, default: null },
        },

        images: [
            {
                filename: { type: String, required: true },
                path: { type: String, required: true },
            },
        ],

        showEmail: { type: Boolean, default: false },
    },
    { timestamps: true, collection: "spare_parts" },
);

sparePartSchema.index({ status: 1, vehicleType: 1, partCategory: 1, createdAt: -1 });
sparePartSchema.index({ "compatibility.make": 1, "compatibility.model": 1 });
sparePartSchema.index({ city: 1 });
sparePartSchema.index({ price: 1 });

const SparePart = mongoose.models.SparePart || mongoose.model("SparePart", sparePartSchema);

export default SparePart;
