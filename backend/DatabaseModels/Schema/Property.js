
import mongoose from "mongoose";

const propertySchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        role: {
            type: String,
            enum: ["Owner", "Real Estate Agent", "Agency"],
            required: true,
        },
        firstName: {
            type: String,
            required: true,
            trim: true,
        },
        lastName: {
            type: String,
            required: true,
            trim: true,
        },
        email: {
            type: String,
            trim: true,
            lowercase: true,
        },
        phone: {
            type: String,
            required: true,
            trim: true,
        },
        title: {
            type: String,
            required: true,
            trim: true,
        },
        description: {
            type: String,
            trim: true,
            default: "",
        },
        status: {
            type: String,
            enum: ["Available", "Rented", "Sold", "Inactive"],
            default: "Available",
        },
        listingType: {
            type: String,
            enum: ["For Sale", "For Rent"],
            required: true,
        },
        propertyType: {
            type: String,
            required: true,
            trim: true,
        },
        city: {
            type: String,
            required: true,
            trim: true,
        },
        neighborhood: {
            type: String,
            trim: true,
            default: "",
        },
        fullAddress: {
            type: String,
            trim: true,
            default: "",
        },
        mapLink: {
            type: String,
            trim: true,
            default: "",
        },
        price: {
            type: Number,
            required: true,
            min: 0,
        },
        surface: {
            type: Number,
            required: true,
            min: 0,
        },
        rooms: {
            type: Number,
            min: 0,
            default: 0,
        },
        salons: {
            type: Number,
            min: 0,
            default: 0,
        },
        bathrooms: {
            type: Number,
            min: 0,
            default: 0,
        },
        floor: {
            type: Number,
            min: 0,
            default: 0,
        },
        syndicateFees: {
            type: Number,
            min: 0,
            default: 0,
        },

        // Rental and agreement details
        rentWithContract: {
            type: Boolean,
            default: false,
        },
        mortgageAgreement: {
            type: Boolean,
            default: false,
        },
        deposit: {
            type: Number,
            min: 0,
            default: 0,
        },
        mediatorFee: {
            type: Number,
            min: 0,
            default: 0,
        },
        showEmail: {
            type: Boolean,
            default: false,
        },

        images: [
            {
                filename: {
                    type: String,
                    required: true,
                },
                path: {
                    type: String,
                    required: true,
                },
            },
        ],
    },
    {
        timestamps: true,
    }
);

const Property =
    mongoose.models.Property ||
    mongoose.model("Property", propertySchema);

export default Property;