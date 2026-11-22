// controllers/listingExpiryController.js
//
// "Still available": the owner confirms a listing (60-day expiry starts
// again). A listing that became Inactive automatically is reactivated.
//
//   POST /api/property/:id/still-available
//   POST /api/roommates/:id/still-available

import mongoose from "mongoose";

import Property from "../DatabaseModels/Schema/Property.js";
import RoommateListing from "../DatabaseModels/Schema/RoommateListing.js";
import { confirmedNow, getExpiryInfo } from "../services/listingExpiry.js";

const sameUser = (a, b) => Boolean(a && b) && String(a?._id || a) === String(b);

const reactivatedStatus = {
    property: () => "Available",
    roommate: (listing) =>
        Number(listing.currentPeople) >= Number(listing.totalPeople) ? "Full" : "Open",
};

export const confirmStillAvailable = (kind, { PropertyModel = Property, RoommateModel = RoommateListing } = {}) =>
    async (req, res) => {
        try {
            const { id } = req.params;
            const userId = req.user?.userId || req.user?.id;

            if (!mongoose.Types.ObjectId.isValid(id)) {
                return res.status(400).json({ message: "Invalid listing ID." });
            }

            const Model = kind === "property" ? PropertyModel : RoommateModel;
            const listing = await Model.findById(id);

            if (!listing) {
                return res.status(404).json({ message: "Listing not found." });
            }

            if (!sameUser(listing.userId, userId)) {
                return res.status(403).json({ message: "You are not allowed to change this listing." });
            }

            const reactivated = listing.status === "Inactive" && Boolean(listing.expiredAt);

            if (reactivated) {
                listing.status = reactivatedStatus[kind](listing);
            }

            Object.assign(listing, confirmedNow());
            await listing.save();

            const data = listing.toObject ? listing.toObject() : listing;

            return res.status(200).json({
                message: reactivated ? "Listing reactivated." : "Listing confirmed.",
                reactivated,
                status: data.status,
                expiry: getExpiryInfo(kind, data),
            });
        } catch (error) {
            console.error("[StillAvailable] Error:", error);
            return res.status(500).json({ message: "Could not confirm the listing." });
        }
    };
