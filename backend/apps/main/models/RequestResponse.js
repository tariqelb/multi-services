// backend/apps/main/models/RequestResponse.js
//
// "I have a match": a professional's reply to a request. One reply per
// professional and request. The seeker's contact details stay hidden until
// the seeker shares them with this professional (contactShared).

import mongoose from "mongoose";

const requestResponseSchema = new mongoose.Schema(
    {
        requestId: { type: mongoose.Schema.Types.ObjectId, ref: "ServiceRequest", required: true, index: true },
        requesterId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
        responderId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
        message: { type: String, trim: true, required: true, maxlength: 1000 },
        // Optional listing of the professional: { kind: property | vehicle | part, id, title, image, price, city, link }
        listing: {
            kind: { type: String, enum: ["property", "vehicle", "part", null], default: null },
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
    { timestamps: true, collection: "request_responses" }
);

requestResponseSchema.index({ requestId: 1, responderId: 1 }, { unique: true });

const RequestResponse = mongoose.models.RequestResponse || mongoose.model("RequestResponse", requestResponseSchema);

export default RequestResponse;
