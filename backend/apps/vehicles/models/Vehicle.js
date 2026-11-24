// backend/apps/vehicles/models/Vehicle.js
//
// One vehicle listing = one vehicle (each vehicle has its own photos, mileage, price...).
// Contact details are not stored: the details page shows the owner's
// current, verified phone / WhatsApp / email.

import mongoose from "mongoose";

import {
    ALL_FUELS,
    BODY_TYPES,
    CATEGORIES,
    MOTO_EQUIPMENT,
    MOTO_TYPES,
    COLORS,
    CONDITIONS,
    EQUIPMENT,
    LISTING_TYPES,
    MILEAGE_POLICIES,
    ORIGINS,
    PUBLISHER_TYPES,
    RENT_INSURANCES,
    TRANSMISSIONS,
} from "../utils/vehicleOptions.js";

const { Schema } = mongoose;

const optionalEnum = (values) => ({ type: String, enum: [...values, null], default: null });

const vehicleSchema = new Schema(
    {
        userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },

        // Section: car or moto (two / three wheels). Old listings have no value: car.
        category: { type: String, enum: CATEGORIES, default: "car", index: true },
        motoType: optionalEnum(MOTO_TYPES),

        // Who publishes
        publisherType: { type: String, enum: PUBLISHER_TYPES, required: true },
        business: {
            name: { type: String, trim: true, default: "" },
            address: { type: String, trim: true, default: "" },
        },

        // Offer
        listingType: { type: String, enum: LISTING_TYPES, required: true },
        status: { type: String, enum: ["Available", "Sold", "Rented", "Inactive"], default: "Available" },
        condition: { type: String, enum: CONDITIONS, default: "used" },

        // Vehicle
        make: { type: String, required: true, trim: true },
        model: { type: String, required: true, trim: true },
        version: { type: String, trim: true, default: "" },
        year: { type: Number, default: null },
        mileage: { type: Number, min: 0, default: 0 },
        fuel: { type: String, enum: ALL_FUELS, required: true },
        transmission: optionalEnum(TRANSMISSIONS),
        bodyType: optionalEnum(BODY_TYPES),
        seats: { type: Number, min: 1, default: null },
        doors: { type: Number, min: 0, default: null },
        fiscalPower: { type: Number, min: 0, default: null },
        engineSize: { type: Number, min: 0, default: null }, // litres (cars)
        engineCc: { type: Number, min: 0, default: null }, // cm³ (motos)
        rangeKm: { type: Number, min: 0, default: null }, // electric range
        exteriorColor: optionalEnum(COLORS),
        interiorColor: { type: String, trim: true, default: "" },

        // Condition and papers
        firstHand: { type: Boolean, default: false },
        previousOwners: { type: Number, min: 0, default: null },
        accidentFree: { type: Boolean, default: false },
        serviceHistory: { type: Boolean, default: false },
        origin: optionalEnum(ORIGINS),
        vignettePaid: { type: Boolean, default: false },
        technicalInspectionUntil: { type: Date, default: null },
        equipment: [{ type: String, enum: [...new Set([...EQUIPMENT, ...MOTO_EQUIPMENT])] }],

        // Extra details written by the publisher: [{ label: "Tyres", value: "New, Michelin" }]
        customFields: [
            {
                _id: false,
                label: { type: String, trim: true, required: true },
                value: { type: String, trim: true, required: true },
            },
        ],

        // Price: "price" is the sale price or the price per day (sorting and filters).
        price: { type: Number, required: true, min: 0 },
        sale: {
            negotiable: { type: Boolean, default: false },
            creditAvailable: { type: Boolean, default: false },
            tradeInAccepted: { type: Boolean, default: false },
            insuranceValidUntil: { type: Date, default: null },
        },
        rent: {
            pricePerWeek: { type: Number, min: 0, default: null },
            pricePerMonth: { type: Number, min: 0, default: null },
            deposit: { type: Number, min: 0, default: null },
            minDays: { type: Number, min: 1, default: 1 },
            insurance: optionalEnum(RENT_INSURANCES),
            insuranceExcess: { type: Number, min: 0, default: null },
            mileagePolicy: optionalEnum(MILEAGE_POLICIES),
            kmPerDay: { type: Number, min: 0, default: null },
            minDriverAge: { type: Number, min: 18, default: null },
            minLicenseYears: { type: Number, min: 0, default: null },
            withDriver: { type: Boolean, default: false },
            delivery: { type: Boolean, default: false },
        },

        // Text
        title: { type: String, required: true, trim: true },
        description: { type: String, trim: true, default: "" },

        // Place
        city: { type: String, required: true, trim: true },
        neighborhood: { type: String, trim: true, default: "" },
        mapLink: { type: String, trim: true, default: "" },
        location: {
            lat: { type: Number, default: null },
            lng: { type: Number, default: null },
        },

        // Media
        images: [
            {
                filename: { type: String, required: true },
                path: { type: String, required: true },
            },
        ],
        youtubeVideoUrl: { type: String, trim: true, default: "" },

        showEmail: { type: Boolean, default: false },
    },
    { timestamps: true, collection: "vehicles" }
);

vehicleSchema.index({ status: 1, category: 1, listingType: 1, createdAt: -1 });
vehicleSchema.index({ make: 1, model: 1 });
vehicleSchema.index({ city: 1 });
vehicleSchema.index({ price: 1 });

const Vehicle = mongoose.models.Vehicle || mongoose.model("Vehicle", vehicleSchema);

export default Vehicle;
