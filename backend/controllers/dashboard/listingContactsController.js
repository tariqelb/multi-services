// backend/controllers/dashboard/listingContactsController.js
// Contact tracking + analytics for roommate announcements and establishments.

import mongoose from "mongoose";

import User from "../../DatabaseModels/Schema/User.js";
import RoommateListing from "../../DatabaseModels/Schema/RoommateListing.js";
import Establishment from "../../DatabaseModels/Schema/Establishment.js";
import ListingContact, {
    LISTING_CONTACT_TYPES,
} from "../../DatabaseModels/Schema/ListingContact.js";

import {
    bucketExpression,
    changeFor,
    currentMatch,
    fillHours,
    fillSeries,
    getRangeWindow,
    getVisitorKey,
    hourExpression,
    isBotRequest,
    previousMatch,
    rate,
    round,
    startOfDay,
} from "../../utils/analytics.js";

// Same visitor + listing + action within this window = one contact.
const DUPLICATE_WINDOW_MS = 60 * 1000;

const ACTIONS_BY_TYPE = {
    roommate: ["call", "whatsapp"],
    establishment: ["call", "whatsapp", "email", "website", "booking", "social"],
};

const loadListing = async (listingType, listingId) => {
    if (listingType === "roommate") {
        const listing = await RoommateListing.findById(listingId)
            .select("userId title city")
            .lean();

        return listing && {
            ownerId: listing.userId || null,
            title: listing.title || "",
            city: listing.city || "",
        };
    }

    const establishment = await Establishment.findById(listingId)
        .select("userId name location.city")
        .lean();

    return establishment && {
        ownerId: establishment.userId || null,
        title: establishment.name || "",
        city: establishment.location?.city || "",
    };
};

// POST /api/listing-contacts
// Body: { listingType: "roommate" | "establishment", listingId, action, target? }
// Works for anonymous and logged-in visitors.
export const createListingContact = async (req, res) => {
    try {
        const { listingType, listingId, action, target } = req.body;

        if (!LISTING_CONTACT_TYPES.includes(listingType)) {
            return res.status(400).json({
                success: false,
                message: "Invalid listing type.",
            });
        }

        if (!mongoose.isValidObjectId(listingId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid listing ID.",
            });
        }

        if (!ACTIONS_BY_TYPE[listingType].includes(action)) {
            return res.status(400).json({
                success: false,
                message: "Invalid contact action.",
            });
        }

        if (isBotRequest(req)) {
            return res.status(200).json({ success: true, recorded: false });
        }

        const listing = await loadListing(listingType, listingId);

        if (!listing) {
            return res.status(404).json({
                success: false,
                message: "Listing not found.",
            });
        }

        const clientId = req.user?.userId || null;

        // Owners testing their own buttons are not leads.
        if (
            clientId &&
            listing.ownerId &&
            String(listing.ownerId) === String(clientId)
        ) {
            return res.status(200).json({
                success: true,
                recorded: false,
                message: "Owner contact actions are not recorded.",
            });
        }

        const visitorKey = getVisitorKey(req);

        const duplicate = await ListingContact.exists({
            listingId,
            visitorKey,
            action,
            createdAt: { $gte: new Date(Date.now() - DUPLICATE_WINDOW_MS) },
        });

        if (duplicate) {
            return res.status(200).json({
                success: true,
                recorded: false,
                message: "Contact action already recorded.",
            });
        }

        await ListingContact.create({
            listingType,
            listingId,
            ownerId: listing.ownerId,
            clientId,
            visitorKey,
            action,
            target: typeof target === "string" ? target.slice(0, 60) : "",
            title: listing.title,
            city: listing.city,
        });

        return res.status(201).json({
            success: true,
            recorded: true,
            message: "Contact action recorded successfully.",
        });
    } catch (error) {
        console.error("Create listing contact error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to record contact action.",
        });
    }
};

const actionSum = (action) => ({
    $sum: { $cond: [{ $eq: ["$action", action] }, 1, 0] },
});

const otherSum = {
    $sum: {
        $cond: [{ $in: ["$action", ["call", "whatsapp"]] }, 0, 1],
    },
};

const firstFromLookup = (field, fallback = "") => ({
    $ifNull: [{ $arrayElemAt: [field, 0] }, fallback],
});

// GET /api/dashboard/listing-contacts?listingType=roommate&range=30d
// Same response shape as /dashboard/property-contacts.
export const getListingContactAnalytics = async (req, res) => {
    try {
        const listingType = LISTING_CONTACT_TYPES.includes(req.query.listingType)
            ? req.query.listingType
            : "roommate";

        const window = getRangeWindow(req.query.range);
        const base = { listingType };

        const match = currentMatch(window, "createdAt", base);
        const previous = previousMatch(window, "createdAt", base);

        const [
            totalsRows,
            previousTotal,
            contactsToday,
            trendRows,
            hourlyRows,
            actions,
            topListings,
            topOwners,
            cities,
            repeatRows,
            recentContacts,
        ] = await Promise.all([
            ListingContact.aggregate([
                { $match: match },
                {
                    $group: {
                        _id: null,
                        total: { $sum: 1 },
                        calls: actionSum("call"),
                        whatsapp: actionSum("whatsapp"),
                        other: otherSum,
                        visitors: { $addToSet: "$visitorKey" },
                        users: { $addToSet: "$clientId" },
                        listings: { $addToSet: "$listingId" },
                        owners: { $addToSet: "$ownerId" },
                    },
                },
                {
                    $project: {
                        _id: 0,
                        total: 1,
                        calls: 1,
                        whatsapp: 1,
                        other: 1,
                        uniqueClients: { $size: "$visitors" },
                        registeredClients: {
                            $size: { $setDifference: ["$users", [null]] },
                        },
                        uniqueListings: { $size: "$listings" },
                        uniqueOwners: {
                            $size: { $setDifference: ["$owners", [null]] },
                        },
                    },
                },
            ]),

            previous ? ListingContact.countDocuments(previous) : Promise.resolve(0),

            ListingContact.countDocuments({
                ...base,
                createdAt: { $gte: startOfDay() },
            }),

            ListingContact.aggregate([
                { $match: match },
                {
                    $group: {
                        _id: bucketExpression("$createdAt", window.unit),
                        calls: actionSum("call"),
                        whatsapp: actionSum("whatsapp"),
                        other: otherSum,
                        total: { $sum: 1 },
                    },
                },
                {
                    $project: {
                        _id: 0,
                        date: "$_id",
                        calls: 1,
                        whatsapp: 1,
                        other: 1,
                        total: 1,
                    },
                },
            ]),

            ListingContact.aggregate([
                { $match: match },
                {
                    $group: {
                        _id: hourExpression("$createdAt"),
                        contacts: { $sum: 1 },
                    },
                },
                { $project: { _id: 0, hour: "$_id", contacts: 1 } },
            ]),

            ListingContact.aggregate([
                { $match: match },
                { $group: { _id: "$action", value: { $sum: 1 } } },
                { $sort: { value: -1 } },
                { $project: { _id: 0, name: "$_id", value: 1 } },
            ]),

            ListingContact.aggregate([
                { $match: match },
                {
                    $group: {
                        _id: "$listingId",
                        total: { $sum: 1 },
                        calls: actionSum("call"),
                        whatsapp: actionSum("whatsapp"),
                        other: otherSum,
                        visitors: { $addToSet: "$visitorKey" },
                        title: { $last: "$title" },
                        city: { $last: "$city" },
                    },
                },
                { $sort: { total: -1 } },
                { $limit: 10 },
                {
                    $project: {
                        _id: 0,
                        listingId: "$_id",
                        total: 1,
                        calls: 1,
                        whatsapp: 1,
                        other: 1,
                        uniqueClients: { $size: "$visitors" },
                        title: 1,
                        city: 1,
                    },
                },
            ]),

            ListingContact.aggregate([
                { $match: { ...match, ownerId: { $ne: null } } },
                {
                    $group: {
                        _id: "$ownerId",
                        total: { $sum: 1 },
                        calls: actionSum("call"),
                        whatsapp: actionSum("whatsapp"),
                        listings: { $addToSet: "$listingId" },
                        visitors: { $addToSet: "$visitorKey" },
                    },
                },
                { $sort: { total: -1 } },
                { $limit: 8 },
                {
                    $lookup: {
                        from: User.collection.name,
                        localField: "_id",
                        foreignField: "_id",
                        as: "owner",
                    },
                },
                {
                    $project: {
                        _id: 0,
                        ownerId: "$_id",
                        total: 1,
                        calls: 1,
                        whatsapp: 1,
                        properties: { $size: "$listings" },
                        uniqueClients: { $size: "$visitors" },
                        firstName: firstFromLookup("$owner.firstName"),
                        lastName: firstFromLookup("$owner.lastName"),
                        email: firstFromLookup("$owner.email"),
                    },
                },
            ]),

            ListingContact.aggregate([
                { $match: match },
                {
                    $addFields: {
                        cleanCity: {
                            $trim: { input: { $ifNull: ["$city", ""] } },
                        },
                    },
                },
                {
                    $group: {
                        _id: { $toLower: "$cleanCity" },
                        name: { $first: "$cleanCity" },
                        total: { $sum: 1 },
                        calls: actionSum("call"),
                        whatsapp: actionSum("whatsapp"),
                        other: otherSum,
                    },
                },
                { $sort: { total: -1 } },
                { $limit: 10 },
                {
                    $project: {
                        _id: 0,
                        name: { $cond: [{ $eq: ["$name", ""] }, "Unknown", "$name"] },
                        total: 1,
                        calls: 1,
                        whatsapp: 1,
                        other: 1,
                    },
                },
            ]),

            ListingContact.aggregate([
                { $match: match },
                { $group: { _id: "$visitorKey", count: { $sum: 1 } } },
                { $match: { count: { $gt: 1 } } },
                { $count: "count" },
            ]),

            ListingContact.find(match)
                .populate("clientId", "firstName lastName email phoneNumber")
                .populate("ownerId", "firstName lastName email phoneNumber")
                .sort({ createdAt: -1 })
                .limit(20)
                .lean(),
        ]);

        const totals = totalsRows[0] || {
            total: 0,
            calls: 0,
            whatsapp: 0,
            other: 0,
            uniqueClients: 0,
            registeredClients: 0,
            uniqueListings: 0,
            uniqueOwners: 0,
        };

        const repeatClients = repeatRows[0]?.count || 0;

        return res.status(200).json({
            success: true,
            listingType,
            range: window.range,

            statistics: {
                totalContacts: totals.total,
                callContacts: totals.calls,
                whatsappContacts: totals.whatsapp,
                otherContacts: totals.other,
                whatsappShare: rate(totals.whatsapp, totals.total),
                contactsToday,
                uniqueClients: totals.uniqueClients,
                registeredClients: totals.registeredClients,
                uniqueProperties: totals.uniqueListings,
                uniqueOwners: totals.uniqueOwners,
                repeatClients,
                repeatClientRate: rate(repeatClients, totals.uniqueClients),
                contactsPerClient: totals.uniqueClients
                    ? round(totals.total / totals.uniqueClients)
                    : 0,
                previousContacts: previousTotal,
                contactsChange: changeFor(window, totals.total, previousTotal),
            },

            dailyActivity: fillSeries(trendRows, window, {
                calls: 0,
                whatsapp: 0,
                other: 0,
                total: 0,
            }),

            hourly: fillHours(hourlyRows, "contacts"),
            actions,
            topListings,
            topOwners,
            cities,

            recentContacts: recentContacts.map((contact) => ({
                ...contact,
                listing: {
                    _id: contact.listingId,
                    title: contact.title,
                    city: contact.city,
                },
            })),
        });
    } catch (error) {
        console.error("Get listing contact analytics error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to retrieve contact analytics.",
        });
    }
};
