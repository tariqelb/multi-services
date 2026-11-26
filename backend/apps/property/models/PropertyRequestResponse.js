// backend/apps/property/models/PropertyRequestResponse.js
//
// "I have a match": an owner's or agency's reply to a property request. One
// reply per professional and request. The seeker's contact details stay
// hidden until the seeker shares them with this professional (contactShared).

import mongoose from "mongoose";

const propertyRequestResponseSchema = new mongoose.Schema(
    {
        requestId: { type: mongoose.Schema.Types.ObjectId, ref: "PropertyRequest", required: true, index: true },
        requesterId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
        responderId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
        message: { type: String, trim: true, required: true, maxlength: 1000 },
        // Optional property of the professional: { kind: "property", id, title, image, price, city, link }
        listing: {
            kind: { type: String, enum: ["property", null], default: null },
            id: { type: String, default: "" },
            title: { type: String, default: "" },
            image: { type: String, default: "" },
            price: { type: Number, default: null },
            priceUnit: { type: String, default: "" },
            city: { type: String, default: "" },
            link: { type: String, default: "" },
        },
        readAt: { type: Date, default: null },
        contactShared: { type: Boolean, default: false },
        contactSharedAt: { type: Date, default: null },
    },
    { timestamps: true, collection: "property_request_responses" }
);

propertyRequestResponseSchema.index({ requestId: 1, responderId: 1 }, { unique: true });

const PropertyRequestResponse =
    mongoose.models.PropertyRequestResponse || mongoose.model("PropertyRequestResponse", propertyRequestResponseSchema);

export default PropertyRequestResponse;
