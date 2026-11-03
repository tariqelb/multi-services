import mongoose from "mongoose";

const propertyClickSchema = new mongoose.Schema(
    {
        propertyId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Property",
            required: true,
            unique: true,
        },

        propertyOwnerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null,
        },

        title: {
            type: String,
            default: "",
        },

        propertyType: {
            type: String,
            default: "",
            index: true,
        },

        listingType: {
            type: String,
            default: "",
            index: true,
        },

        city: {
            type: String,
            default: "",
            index: true,
        },

        neighborhood: {
            type: String,
            default: "",
        },

        price: {
            type: Number,
            default: 0,
        },

        clickCount: {
            type: Number,
            default: 0,
            min: 0,
        },

        firstClickedAt: {
            type: Date,
            default: Date.now,
        },

        lastClickedAt: {
            type: Date,
            default: Date.now,
            index: true,
        },

        lastClickedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null,
        },
    },
    {
        timestamps: true,
    }
);

propertyClickSchema.index({ clickCount: -1 });
propertyClickSchema.index({ city: 1, propertyType: 1 });
propertyClickSchema.index({ listingType: 1, clickCount: -1 });

export default mongoose.model("PropertyClick", propertyClickSchema);