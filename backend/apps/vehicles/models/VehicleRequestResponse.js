// backend/apps/vehicles/models/VehicleRequestResponse.js
//
// "I have a match": a dealer's, rental agency's or parts shop's reply to a
// vehicle request. One reply per professional and request. The seeker's
// contact details stay hidden until the seeker shares them (contactShared).

import mongoose from "mongoose";

const vehicleRequestResponseSchema = new mongoose.Schema(
    {
        requestId: { type: mongoose.Schema.Types.ObjectId, ref: "VehicleRequest", required: true, index: true },
        requesterId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
        responderId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
        message: { type: String, trim: true, required: true, maxlength: 1000 },
        // Optional vehicle or spare part of the professional: { kind: vehicle | part, id, title, image, price, city, link }
        listing: {
            kind: { type: String, enum: ["vehicle", "part", null], default: null },
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
    { timestamps: true, collection: "vehicle_request_responses" }
);

vehicleRequestResponseSchema.index({ requestId: 1, responderId: 1 }, { unique: true });

const VehicleRequestResponse =
    mongoose.models.VehicleRequestResponse || mongoose.model("VehicleRequestResponse", vehicleRequestResponseSchema);

export default VehicleRequestResponse;
