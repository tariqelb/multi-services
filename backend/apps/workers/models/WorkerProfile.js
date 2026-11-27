// backend/apps/workers/models/WorkerProfile.js
//
// Daily worker profile: one per user, with up to 5 trade offers
// (one per trade: price, payment, deposit, experience...).
// Photos: the account's profile photo only; work photos go in the portfolio.

import mongoose from "mongoose";

import {
    AVAILABILITY,
    CONTACT_PREFERENCES,
    COVERAGE,
    GENDERS,
    LANGUAGES,
    MATERIALS,
    PAYMENT_TIMINGS,
    PRICE_TYPES,
    PROFILE_STATUSES,
    TEAM_MODES,
    WORK_DAYS,
    WORKPLACE_KINDS,
} from "../utils/workerOptions.js";

const offerSchema = new mongoose.Schema(
    {
        trade: { type: String, required: true },
        // trade "other": what the worker typed.
        customTrade: { type: String, default: "" },
        specialties: { type: [String], default: [] },
        customSpecialties: { type: [String], default: [] },
        experienceYears: { type: Number, default: 0, min: 0 },
        diploma: { type: String, default: "" },
        priceType: { type: String, enum: PRICE_TYPES, required: true },
        price: { type: Number, default: null },
        paymentTiming: { type: String, enum: PAYMENT_TIMINGS, required: true },
        deposit: {
            required: { type: Boolean, default: false },
            percent: { type: Number, default: null },
        },
        materials: { type: String, enum: MATERIALS, default: "client" },
        visit: {
            free: { type: Boolean, default: true },
            fee: { type: Number, default: null },
        },
        guarantee: { type: String, default: "" },
        description: { type: String, default: "" },
    },
    { timestamps: true }
);

const workerProfileSchema = new mongoose.Schema(
    {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
        firstName: { type: String, required: true, trim: true },
        lastName: { type: String, required: true, trim: true },
        // Old profiles (round 43) have none: "" until edited.
        gender: { type: String, enum: [...GENDERS, ""], default: "" },
        bio: { type: String, default: "" },

        baseCity: { type: String, required: true, trim: true },
        coverage: { type: String, enum: COVERAGE, default: "cities" },
        // coverage "cities": the base city first, then the others.
        cities: { type: [String], default: [] },

        // Workshop, shop or garage: location read from the Google Maps link.
        hasWorkplace: { type: Boolean, default: false, index: true },
        workplace: {
            kind: { type: String, enum: [...WORKPLACE_KINDS, ""], default: "" },
            name: { type: String, default: "" },
            address: { type: String, default: "" },
            mapLink: { type: String, default: "" },
            // Up to 4 photos of the place (Cloudinary).
            images: { type: [{ _id: false, filename: String, path: String }], default: [] },
            location: {
                lat: { type: Number, default: null },
                lng: { type: Number, default: null },
            },
        },

        workDays: { type: [{ type: String, enum: WORK_DAYS }], default: [] },
        hours: {
            start: { type: String, default: "08:00" },
            end: { type: String, default: "18:00" },
        },
        // Optional lunch break, inside the working hours.
        hasBreak: { type: Boolean, default: false },
        break: {
            start: { type: String, default: "" },
            end: { type: String, default: "" },
        },
        // Accepts night jobs; hours may cross midnight.
        worksAtNight: { type: Boolean, default: false },
        languages: { type: [{ type: String, enum: LANGUAGES }], default: [] },

        teamMode: { type: String, enum: TEAM_MODES, default: "alone" },
        teamSize: { type: Number, default: 1 },
        hasTools: { type: Boolean, default: false },
        hasVehicle: { type: Boolean, default: false },
        acceptsUrgent: { type: Boolean, default: false },
        contactPreference: { type: String, enum: CONTACT_PREFERENCES, default: "both" },

        availability: {
            status: { type: String, enum: AVAILABILITY, default: "available" },
            busyUntil: { type: Date, default: null },
        },

        offers: { type: [offerSchema], default: [] },
        // Trade ids of the offers (filters) and normalised words (search).
        trades: { type: [String], default: [], index: true },
        searchText: { type: String, default: "" },

        // hidden: the worker took his profile offline (only he and admins see it).
        status: { type: String, enum: PROFILE_STATUSES, default: "active", index: true },
        views: { type: Number, default: 0 },
    },
    { timestamps: true }
);

workerProfileSchema.index({ status: 1, updatedAt: -1 });
workerProfileSchema.index({ status: 1, coverage: 1, cities: 1 });

const WorkerProfile =
    mongoose.models.WorkerProfile || mongoose.model("WorkerProfile", workerProfileSchema, "worker_profiles");

export default WorkerProfile;
