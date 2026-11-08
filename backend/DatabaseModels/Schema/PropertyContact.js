import mongoose from "mongoose";

const propertyContactSchema = new mongoose.Schema(
    {
        clientId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        propertyId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Property",
            required: true,
        },
        ownerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        action: {
            type: String,
            enum: ["call", "whatsapp"],
            required: true,
        },
    },
    {
        timestamps: true,
    }
);

propertyContactSchema.index({ propertyId: 1, createdAt: -1 });
propertyContactSchema.index({ clientId: 1, createdAt: -1 });
propertyContactSchema.index({ action: 1, createdAt: -1 });

const PropertyContact =
    mongoose.models.PropertyContact ||
    mongoose.model("PropertyContact", propertyContactSchema);

export default PropertyContact;