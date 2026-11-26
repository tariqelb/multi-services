// backend/apps/property/controllers/dashboard/adminUserActivityController.js
//
// Admin user page, "Property" tab: everything the user does in the property
// service, as one simple list per kind.
//   GET /api/property/dashboard/users/:userId/activity?kind=publications|alerts|saved|requests|portfolio
//   -> { items: [{ id, type, title, description, status, createdAt, link }] }

import Property from "../../models/Property.js";
import RoommateListing from "../../models/RoommateListing.js";
import Establishment from "../../models/Establishment.js";
import PropertyAlert from "../../models/PropertyAlert.js";
import RoommateAlert from "../../models/RoommateAlert.js";
import SavedProperty from "../../models/SavedProperty.js";
import SavedListing from "../../models/SavedListing.js";
import PropertyRequest from "../../models/PropertyRequest.js";
import PropertyPortfolioItem from "../../models/PropertyPortfolioItem.js";

import { getAdminUserOrRespond } from "../../../main/controllers/admin/adminUsersController.js";

const LIMIT = 100;
export const ACTIVITY_KINDS = ["publications", "alerts", "saved", "requests", "portfolio"];

const join = (...values) => values.flat().filter(Boolean).join(" · ");
const byNewest = (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0);

export const toPropertyItem = (property) => ({
    id: String(property._id),
    type: "property",
    title: property.title || "Property",
    description: join(property.city, property.neighborhood, property.listingType, property.propertyType),
    status: property.status || "",
    createdAt: property.createdAt,
    link: `/properties/${property._id}`,
});

export const toRoommateItem = (listing) => ({
    id: String(listing._id),
    type: "roommate",
    title: listing.title || "Roommate announcement",
    description: join(listing.city, listing.neighborhood, listing.propertyType),
    status: listing.status || "",
    createdAt: listing.createdAt,
    link: `/roommates/${listing._id}`,
});

export const toEstablishmentItem = (establishment) => ({
    id: String(establishment._id),
    type: "establishment",
    title: establishment.name || "Hotel / riad",
    description: join(establishment.location?.city, establishment.location?.neighborhood, establishment.accommodationType),
    status: establishment.status || "",
    createdAt: establishment.createdAt,
    link: `/establishments/${establishment._id}`,
});

async function loaders(userId, kind) {
    switch (kind) {
        case "publications": {
            const [properties, roommates, establishments] = await Promise.all([
                Property.find({ userId }).sort({ createdAt: -1 }).limit(LIMIT).lean(),
                RoommateListing.find({ userId }).sort({ createdAt: -1 }).limit(LIMIT).lean(),
                Establishment.find({ userId }).sort({ createdAt: -1 }).limit(LIMIT).lean(),
            ]);
            return [...properties.map(toPropertyItem), ...roommates.map(toRoommateItem), ...establishments.map(toEstablishmentItem)];
        }
        case "alerts": {
            const [alerts, roommateAlerts] = await Promise.all([
                PropertyAlert.find({ user: userId }).sort({ createdAt: -1 }).limit(LIMIT).lean(),
                RoommateAlert.find({ user: userId }).sort({ createdAt: -1 }).limit(LIMIT).lean(),
            ]);
            return [
                ...alerts.map((alert) => ({
                    id: String(alert._id),
                    type: "propertyAlert",
                    title: alert.title || alert.city || "Property alert",
                    description: join(alert.city, alert.propertyTypes, alert.listingTypes),
                    status: alert.isArchived ? "archived" : "active",
                    createdAt: alert.createdAt,
                })),
                ...roommateAlerts.map((alert) => ({
                    id: String(alert._id),
                    type: "roommateAlert",
                    title: alert.title || alert.city || "Roommate alert",
                    description: join(alert.city, alert.propertyTypes),
                    status: alert.isArchived ? "archived" : "active",
                    createdAt: alert.createdAt,
                })),
            ];
        }
        case "saved": {
            const [savedProperties, savedListings] = await Promise.all([
                SavedProperty.find({ userId, isSaved: true })
                    .populate({ path: "propertyId", select: "title city neighborhood listingType propertyType status createdAt" })
                    .sort({ savedAt: -1 })
                    .limit(LIMIT)
                    .lean(),
                SavedListing.find({ userId, isSaved: true }).sort({ savedAt: -1 }).limit(LIMIT).lean(),
            ]);
            const roommateIds = savedListings.filter((item) => item.listingType === "roommate").map((item) => item.listingId);
            const establishmentIds = savedListings.filter((item) => item.listingType === "establishment").map((item) => item.listingId);
            const [roommates, establishments] = await Promise.all([
                roommateIds.length ? RoommateListing.find({ _id: { $in: roommateIds } }).lean() : [],
                establishmentIds.length ? Establishment.find({ _id: { $in: establishmentIds } }).lean() : [],
            ]);
            const found = new Map([
                ...roommates.map((listing) => [String(listing._id), toRoommateItem(listing)]),
                ...establishments.map((listing) => [String(listing._id), toEstablishmentItem(listing)]),
            ]);
            return [
                ...savedProperties
                    .filter((item) => item.propertyId)
                    .map((item) => ({ ...toPropertyItem(item.propertyId), id: String(item._id), createdAt: item.savedAt || item.createdAt })),
                ...savedListings
                    .filter((item) => found.has(String(item.listingId)))
                    .map((item) => ({ ...found.get(String(item.listingId)), id: String(item._id), createdAt: item.savedAt || item.createdAt })),
            ];
        }
        case "requests": {
            const requests = await PropertyRequest.find({ userId }).sort({ createdAt: -1 }).limit(LIMIT).lean();
            return requests.map((request) => ({
                id: String(request._id),
                type: "request",
                title: join(request.transaction, request.propertyTypes) || "Request",
                description: join(request.city, request.budgetMax ? `≤ ${request.budgetMax} MAD` : ""),
                status: request.status || "",
                createdAt: request.createdAt,
                link: `/requests/${request._id}`,
            }));
        }
        case "portfolio": {
            const items = await PropertyPortfolioItem.find({ userId }).sort({ createdAt: -1 }).limit(LIMIT).lean();
            return items.map((item) => ({
                id: String(item._id),
                type: item.type,
                title: item.title,
                description: item.type === "video" ? `youtube.com/watch?v=${item.youtubeId}` : String(item.text || "").slice(0, 160),
                status: "",
                createdAt: item.createdAt,
                link: `/profile/${userId}`,
            }));
        }
        default:
            return null;
    }
}

export const getAdminUserPropertyActivity = async (req, res) => {
    try {
        const kind = String(req.query.kind || "publications");
        if (!ACTIVITY_KINDS.includes(kind)) {
            return res.status(400).json({ success: false, message: "Invalid kind." });
        }

        const user = await getAdminUserOrRespond(req.params.userId, res);
        if (!user) return;

        const items = (await loaders(req.params.userId, kind)).sort(byNewest);
        return res.status(200).json({ success: true, kind, count: items.length, items });
    } catch (error) {
        console.error("Get admin user property activity error:", error);
        return res.status(500).json({ success: false, message: "Failed to retrieve the user's property activity." });
    }
};
