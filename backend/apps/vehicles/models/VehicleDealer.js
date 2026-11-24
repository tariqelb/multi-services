// backend/apps/vehicles/models/VehicleDealer.js
//
// Business profile of an agency or showroom: name and Google Maps location,
// saved with the first vehicle so the next vehicles are filled in automatically.

import mongoose from "mongoose";

const { Schema } = mongoose;

const vehicleDealerSchema = new Schema(
    {
        userId: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
        type: { type: String, enum: ["agency", "showroom"], required: true },
        name: { type: String, required: true, trim: true },
        address: { type: String, trim: true, default: "" },
        city: { type: String, trim: true, default: "" },
        mapLink: { type: String, trim: true, default: "" },
        location: {
            lat: { type: Number, default: null },
            lng: { type: Number, default: null },
        },
    },
    { timestamps: true, collection: "vehicle_dealers" }
);

const VehicleDealer = mongoose.models.VehicleDealer || mongoose.model("VehicleDealer", vehicleDealerSchema);

export default VehicleDealer;
