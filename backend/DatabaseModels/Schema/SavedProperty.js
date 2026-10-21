
import mongoose from "mongoose";

const savedPropertySchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },

        propertyId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Property",
            required: true,
        },

        // Snapshot of important property information
        propertyInfo: {
            title: {
                type: String,
                default: "",
            },
            price: {
                type: Number,
                default: 0,
            },
            listingType: {
                type: String,
                default: "",
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
            image: {
                type: String,
                default: "",
            },
        },
    },
    {
        timestamps: true,
    }
);

// A user can save a particular property only once.
savedPropertySchema.index(
    { userId: 1, propertyId: 1 },
    { unique: true }
);

const SavedProperty = mongoose.model(
    "SavedProperty",
    savedPropertySchema
);

export default SavedProperty;
