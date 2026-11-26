// backend/apps/vehicles/models/VehicleStatEvent.js
//
// One document per counted event of the vehicles service, for the admin
// statistics (Vehicles › Statistics):
//   kind "view"      a details page opened (vehicle, moto or spare part)
//   kind "contact"   call / WhatsApp / email / message button pressed
//   kind "external"  an external listing (Avito, Moteur.ma...) opened
// Owners opening their own listing and bots are not counted.

import mongoose from "mongoose";

const { ObjectId } = mongoose.Schema.Types;

export const STAT_KINDS = ["view", "contact", "external"];
export const STAT_ITEM_TYPES = ["vehicle", "moto", "part", "external"];
export const CONTACT_CHANNELS = ["phone", "whatsapp", "email", "message", "website"];

const vehicleStatEventSchema = new mongoose.Schema(
    {
        kind: { type: String, enum: STAT_KINDS, required: true },
        itemType: { type: String, enum: STAT_ITEM_TYPES, required: true },
        itemId: { type: ObjectId, required: true },
        ownerId: { type: ObjectId, ref: "User", default: null },
        userId: { type: ObjectId, ref: "User", default: null },
        visitorKey: { type: String, required: true, maxlength: 140 },
        channel: { type: String, enum: [...CONTACT_CHANNELS, ""], default: "" },

        // Copy of the listing at the time of the event (charts by make, city...).
        title: { type: String, default: "", maxlength: 200 },
        category: { type: String, default: "" },
        listingType: { type: String, default: "" },
        make: { type: String, default: "" },
        model: { type: String, default: "" },
        city: { type: String, default: "" },
        price: { type: Number, default: 0 },
        sourceDomain: { type: String, default: "" },
        referrer: { type: String, default: "", maxlength: 500 },
    },
    { timestamps: { createdAt: true, updatedAt: false }, versionKey: false, collection: "vehicle_stat_events" }
);

vehicleStatEventSchema.index({ kind: 1, createdAt: -1 });
vehicleStatEventSchema.index({ kind: 1, itemId: 1, visitorKey: 1, createdAt: -1 });

export default mongoose.models.VehicleStatEvent || mongoose.model("VehicleStatEvent", vehicleStatEventSchema);
