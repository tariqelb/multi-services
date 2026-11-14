
import mongoose from "mongoose";

const roommatePropertyTypes = [
    "Apartment",
    "House",
    "Villa",
    "Studio",
    "Room",
    "Other",
];

const roommatePurposes = [
    "Share My Property",
    "Find a Room",
    "Rent Together",
];

const rentalPeriods = ["Daily", "Monthly"];

const roommateAlertSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },

        city: {
            type: String,
            required: true,
            trim: true,
            maxlength: 100,
        },

        propertyTypes: {
            type: [
                {
                    type: String,
                    enum: roommatePropertyTypes,
                },
            ],
            required: true,
            validate: {
                validator(types) {
                    return (
                        Array.isArray(types) &&
                        types.length > 0 &&
                        new Set(types).size === types.length
                    );
                },
                message: "Select at least one property type.",
            },
        },

        purposes: {
            type: [
                {
                    type: String,
                    enum: roommatePurposes,
                },
            ],
            required: true,
            validate: {
                validator(purposes) {
                    return (
                        Array.isArray(purposes) &&
                        purposes.length > 0 &&
                        new Set(purposes).size === purposes.length
                    );
                },
                message: "Select at least one roommate purpose.",
            },
        },

        // Empty array means the alert accepts any rental period.
        rentalPeriods: {
            type: [
                {
                    type: String,
                    enum: rentalPeriods,
                },
            ],
            default: [],
            validate: {
                validator(periods) {
                    return (
                        Array.isArray(periods) &&
                        new Set(periods).size === periods.length
                    );
                },
                message: "Invalid or duplicate rental periods.",
            },
        },

        isArchived: {
            type: Boolean,
            default: false,
            index: true,
        },

        archivedAt: {
            type: Date,
            default: null,
        },
    },
    {
        timestamps: true,
    }
);

roommateAlertSchema.index({
    user: 1,
    isArchived: 1,
    createdAt: -1,
});

roommateAlertSchema.index({
    isArchived: 1,
    city: 1,
});

const RoommateAlert = mongoose.model(
    "RoommateAlert",
    roommateAlertSchema
);

export default RoommateAlert;
