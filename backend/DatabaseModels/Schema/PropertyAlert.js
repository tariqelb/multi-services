
import mongoose from "mongoose";

const propertyTypes = [
    "Apartment",
    "House",
    "Villa",
    "Studio",
    "Room",
    "Store",
    "Office",
    "Land",
    "Warehouse",
    "Commercial space",
    "Commercial store",
    "Garage",
    "Other",
];

const listingTypes = ["For Sale", "For Rent"];

const propertyAlertSchema = new mongoose.Schema(
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
                    enum: propertyTypes,
                },
            ],
            required: true,
            validate: {
                validator: (types) =>
                    Array.isArray(types) && types.length > 0,
                message: "Select at least one property type.",
            },
        },

        listingTypes: {
            type: [
                {
                    type: String,
                    enum: listingTypes,
                },
            ],
            required: true,
            validate: {
                validator: (types) =>
                    Array.isArray(types) && types.length > 0,
                message: "Select For Sale, For Rent, or both.",
            },
        },
    },
    {
        timestamps: true,
    }
);

propertyAlertSchema.pre("validate", function () {
    if (this.propertyTypes) {
        this.propertyTypes = [...new Set(this.propertyTypes)];
    }

    if (this.listingTypes) {
        this.listingTypes = [...new Set(this.listingTypes)];
    }
});

const PropertyAlert = mongoose.model(
    "PropertyAlert",
    propertyAlertSchema
);

export default PropertyAlert;
