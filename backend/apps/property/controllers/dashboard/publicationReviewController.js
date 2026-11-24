// backend/apps/property/controllers/dashboard/publicationReviewController.js
//
// Admin review of everything users publish: properties, establishments and
// roommate announcements.
//
//   GET    /api/property/dashboard/publications?period=today|week|month|year|all&type=all|property|establishment|roommate
//   DELETE /api/property/dashboard/publications/:kind/:id
//
// Admins, and members with the "propertyPublications" section (read: list, write: delete).

import mongoose from "mongoose";

import Property from "../../models/Property.js";
import Establishment from "../../models/Establishment.js";
import RoommateListing from "../../models/RoommateListing.js";

import { deletePropertyImages } from "../../middleware/propertyUpload.js";
import { deleteEstablishmentImages } from "../../middleware/establishmentImageUpload.js";

export const PUBLICATION_KINDS = ["property", "establishment", "roommate"];
const PERIODS = ["today", "week", "month", "year", "all"];
const MAX_PER_KIND = 300;

const OWNER_FIELDS = "firstName lastName email profileImage";

// Only the fields the review cards need.
const FIELDS = {
    property: "title price images listingType propertyType city neighborhood surface rooms bathrooms status userId createdAt",
    establishment: "name accommodationType shortDescription location.city location.neighborhood numberOfRooms rooms.pricePerNight rooms.quantity media.coverPhoto media.gallery userId createdAt",
    roommate: "title purpose propertyType city neighborhood totalRent rentalPeriod individualRoomPrice totalPeople currentPeople images status userId createdAt",
};

const MODELS = {
    property: Property,
    establishment: Establishment,
    roommate: RoommateListing,
};

export function getPeriodStart(period, now = new Date()) {
    const start = new Date(now);

    switch (period) {
        case "today":
            start.setHours(0, 0, 0, 0);
            return start;
        case "week":
            start.setDate(start.getDate() - 7);
            return start;
        case "month":
            start.setMonth(start.getMonth() - 1);
            return start;
        case "year":
            start.setFullYear(start.getFullYear() - 1);
            return start;
        default:
            return null; // "all"
    }
}

function getEstablishmentImages(establishment) {
    if (!establishment) return [];

    return [
        establishment.media?.coverPhoto,
        ...(establishment.media?.gallery || []),
        ...(establishment.rooms || []).flatMap((room) => room.photos || []),
    ].filter(Boolean);
}

// GET /api/property/dashboard/publications
export async function getAdminPublications(req, res) {
    try {
        const period = String(req.query.period || "today");
        const type = String(req.query.type || "all");

        if (!PERIODS.includes(period)) {
            return res.status(400).json({ success: false, message: "Invalid period." });
        }

        if (type !== "all" && !PUBLICATION_KINDS.includes(type)) {
            return res.status(400).json({ success: false, message: "Invalid publication type." });
        }

        const now = new Date();
        const start = getPeriodStart(period, now);
        const filter = start ? { createdAt: { $gte: start, $lte: now } } : {};

        // Counts for every kind (for the filter chips), list for the chosen kind(s).
        const counts = {};
        const lists = await Promise.all(
            PUBLICATION_KINDS.map(async (kind) => {
                const Model = MODELS[kind];

                counts[kind] = await Model.countDocuments(filter);

                if (type !== "all" && type !== kind) return [];

                const items = await Model.find(filter)
                    .select(FIELDS[kind])
                    .populate("userId", OWNER_FIELDS)
                    .sort({ createdAt: -1 })
                    .limit(MAX_PER_KIND)
                    .lean();

                return items.map((item) => ({ ...item, kind }));
            })
        );

        const publications = lists
            .flat()
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        counts.all = PUBLICATION_KINDS.reduce((sum, kind) => sum + counts[kind], 0);

        return res.status(200).json({
            success: true,
            period,
            type,
            counts,
            count: publications.length,
            publications,
        });
    } catch (error) {
        console.error("[Publications] Admin list error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to retrieve publications.",
        });
    }
}

// DELETE /api/property/dashboard/publications/:kind/:id
export async function deleteAdminPublication(req, res) {
    try {
        const { kind, id } = req.params;

        if (!PUBLICATION_KINDS.includes(kind)) {
            return res.status(400).json({ success: false, message: "Invalid publication type." });
        }

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ success: false, message: "Invalid publication ID." });
        }

        const deleted = await MODELS[kind].findByIdAndDelete(id);

        if (!deleted) {
            return res.status(404).json({ success: false, message: "Publication not found." });
        }

        // Images are removed after the database record; a failure here
        // must not undo the deletion.
        try {
            if (kind === "establishment") {
                await deleteEstablishmentImages(getEstablishmentImages(deleted));
            } else {
                await deletePropertyImages(deleted.images || []);
            }
        } catch (imageError) {
            console.error("[Publications] Image cleanup error:", imageError);
        }

        console.log(`[Publications] Admin ${req.user?.userId} deleted ${kind} ${id}`);

        return res.status(200).json({
            success: true,
            message: "Publication deleted successfully.",
            kind,
            id,
        });
    } catch (error) {
        console.error("[Publications] Admin delete error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to delete publication.",
        });
    }
}
