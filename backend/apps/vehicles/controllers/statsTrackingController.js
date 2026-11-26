// backend/apps/vehicles/controllers/statsTrackingController.js
//
// Counts what visitors do on the vehicles pages (for Vehicles › Statistics).
//   POST /api/vehicles/stats/view     { itemType: "vehicle" | "part", itemId }
//   POST /api/vehicles/stats/contact  { itemType, itemId, channel: "phone" | "whatsapp" | "email" | "message" }
// External listings are counted by POST /api/vehicles/external-listings/:id/click.
// The same visitor repeating the same action within 30 seconds counts once.

import mongoose from "mongoose";

import Vehicle from "../models/Vehicle.js";
import SparePart from "../models/SparePart.js";
import VehicleStatEvent, { CONTACT_CHANNELS } from "../models/VehicleStatEvent.js";
import { getReferrer, getVisitorKey, isBotRequest } from "../../main/utils/analytics.js";

const DUPLICATE_WINDOW_MS = 30 * 1000;

/** The listing as stored in an event. */
export async function describeItem(itemType, itemId, { VehicleModel = Vehicle, PartModel = SparePart } = {}) {
    if (itemType === "part") {
        const part = await PartModel.findById(itemId).select("userId title city price compatibility").lean();
        if (!part) return null;
        return {
            itemType: "part",
            ownerId: part.userId || null,
            title: part.title || "",
            category: "part",
            make: part.compatibility?.make || "",
            model: part.compatibility?.model || "",
            city: part.city || "",
            price: part.price || 0,
        };
    }
    const vehicle = await VehicleModel.findById(itemId).select("userId make model year category listingType city price").lean();
    if (!vehicle) return null;
    return {
        itemType: vehicle.category === "moto" ? "moto" : "vehicle",
        ownerId: vehicle.userId || null,
        title: [vehicle.make, vehicle.model, vehicle.year].filter(Boolean).join(" "),
        category: vehicle.category || "car",
        listingType: vehicle.listingType || "",
        make: vehicle.make || "",
        model: vehicle.model || "",
        city: vehicle.city || "",
        price: vehicle.price || 0,
    };
}

/** Records one event unless it is a bot, the owner, or a repeat. Returns { counted, reason }. */
export async function recordEvent(req, { kind, itemId, details, channel = "" }, { EventModel = VehicleStatEvent, now = new Date() } = {}) {
    if (isBotRequest(req)) return { counted: false, reason: "bot" };

    const userId = req.user?.userId || null;
    if (userId && details.ownerId && String(details.ownerId) === String(userId)) return { counted: false, reason: "owner" };

    const visitorKey = getVisitorKey(req);
    const repeated = await EventModel.exists({
        kind,
        itemId,
        visitorKey,
        channel,
        createdAt: { $gte: new Date(now.getTime() - DUPLICATE_WINDOW_MS) },
    });
    if (repeated) return { counted: false, reason: "repeat" };

    await EventModel.create({ ...details, kind, itemId, channel, userId, visitorKey, referrer: getReferrer(req) });
    return { counted: true };
}

const readItem = (body = {}) => {
    const itemType = body.itemType === "part" ? "part" : "vehicle";
    const itemId = String(body.itemId || "");
    return mongoose.isValidObjectId(itemId) ? { itemType, itemId } : null;
};

export async function trackView(req, res) {
    try {
        const item = readItem(req.body);
        if (!item) return res.status(400).json({ success: false, message: "Invalid item." });

        const details = await describeItem(item.itemType, item.itemId);
        if (!details) return res.status(404).json({ success: false, message: "Listing not found." });

        const result = await recordEvent(req, { kind: "view", itemId: item.itemId, details });
        return res.status(200).json({ success: true, ...result });
    } catch (error) {
        console.error("[VehicleStats] view", error.message);
        return res.status(500).json({ success: false, message: "Unable to record the view." });
    }
}

export async function trackContact(req, res) {
    try {
        const item = readItem(req.body);
        const channel = String(req.body?.channel || "");
        if (!item || !CONTACT_CHANNELS.includes(channel)) return res.status(400).json({ success: false, message: "Invalid contact." });

        const details = await describeItem(item.itemType, item.itemId);
        if (!details) return res.status(404).json({ success: false, message: "Listing not found." });

        const result = await recordEvent(req, { kind: "contact", itemId: item.itemId, details, channel });
        return res.status(200).json({ success: true, ...result });
    } catch (error) {
        console.error("[VehicleStats] contact", error.message);
        return res.status(500).json({ success: false, message: "Unable to record the contact." });
    }
}
