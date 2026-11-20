// backend/controllers/dashboard/propertyContactsController.js

import mongoose from "mongoose";

import Property from "../../DatabaseModels/Schema/Property.js";
import User from "../../DatabaseModels/Schema/User.js";
import PropertyContact from "../../DatabaseModels/Schema/PropertyContact.js";
import PropertyClickEvent from "../../DatabaseModels/Schema/PropertyClickEvent.js";

import {
    bucketExpression,
    changeFor,
    currentMatch,
    fillHours,
    fillSeries,
    getRangeWindow,
    hourExpression,
    previousMatch,
    rate,
    startOfDay,
} from "../../utils/analytics.js";

// Same client + property + action within this window = one contact.
const DUPLICATE_WINDOW_MS = 60 * 1000;

const ALLOWED_ACTIONS = ["call", "whatsapp"];

const callSum = { $sum: { $cond: [{ $eq: ["$action", "call"] }, 1, 0] } };
const whatsappSum = { $sum: { $cond: [{ $eq: ["$action", "whatsapp"] }, 1, 0] } };

const firstFromLookup = (field, fallback = "") => ({
    $ifNull: [{ $arrayElemAt: [field, 0] }, fallback],
});

// POST /api/dashboard/property-contacts
// Record an authenticated user's contact action.
export const createPropertyContact = async (req, res) => {
    try {
        const { propertyId, action } = req.body;

        if (!mongoose.Types.ObjectId.isValid(propertyId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid property ID.",
            });
        }

        if (!ALLOWED_ACTIONS.includes(action)) {
            return res.status(400).json({
                success: false,
                message: "Invalid contact action.",
            });
        }

        const client = await User.findById(req.user.userId).select("_id").lean();

        if (!client) {
            return res.status(401).json({
                success: false,
                message: "User account not found.",
            });
        }

        const property = await Property.findById(propertyId)
            .select("_id userId")
            .lean();

        if (!property) {
            return res.status(404).json({
                success: false,
                message: "Property not found.",
            });
        }

        const owner = await User.findById(property.userId).select("_id").lean();

        if (!owner) {
            return res.status(404).json({
                success: false,
                message: "Property owner not found.",
            });
        }

        // Owners testing their own contact buttons are not leads.
        if (String(owner._id) === String(client._id)) {
            return res.status(200).json({
                success: true,
                recorded: false,
                message: "Owner contact actions are not recorded.",
            });
        }

        const duplicate = await PropertyContact.findOne({
            clientId: client._id,
            propertyId: property._id,
            action,
            createdAt: {
                $gte: new Date(Date.now() - DUPLICATE_WINDOW_MS),
            },
        }).lean();

        if (duplicate) {
            return res.status(200).json({
                success: true,
                recorded: false,
                message: "Contact action already recorded.",
                contact: duplicate,
            });
        }

        const contact = await PropertyContact.create({
            clientId: client._id,
            propertyId: property._id,
            ownerId: owner._id,
            action,
        });

        return res.status(201).json({
            success: true,
            recorded: true,
            message: "Contact action recorded successfully.",
            contact,
        });
    } catch (error) {
        console.error("Create property contact error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to record contact action.",
        });
    }
};

// GET /api/dashboard/property-contacts?range=30d
// Retrieve contact (lead) analytics for administrators.
export const getPropertyContactAnalytics = async (req, res) => {
    try {
        const window = getRangeWindow(req.query.range);

        const match = currentMatch(window, "createdAt");
        const previous = previousMatch(window, "createdAt");

        const propertyLookup = {
            $lookup: {
                from: Property.collection.name,
                localField: "_id",
                foreignField: "_id",
                as: "property",
            },
        };

        const [
            totalsRows,
            previousTotal,
            contactsToday,
            trendRows,
            hourlyRows,
            topPropertyRows,
            topOwners,
            cities,
            repeatClientRows,
            recentContacts,
        ] = await Promise.all([
            PropertyContact.aggregate([
                { $match: match },
                {
                    $group: {
                        _id: null,
                        total: { $sum: 1 },
                        calls: callSum,
                        whatsapp: whatsappSum,
                        clients: { $addToSet: "$clientId" },
                        properties: { $addToSet: "$propertyId" },
                        owners: { $addToSet: "$ownerId" },
                    },
                },
                {
                    $project: {
                        _id: 0,
                        total: 1,
                        calls: 1,
                        whatsapp: 1,
                        uniqueClients: { $size: "$clients" },
                        uniqueProperties: { $size: "$properties" },
                        uniqueOwners: { $size: "$owners" },
                    },
                },
            ]),

            previous
                ? PropertyContact.countDocuments(previous)
                : Promise.resolve(0),

            PropertyContact.countDocuments({
                createdAt: { $gte: startOfDay() },
            }),

            PropertyContact.aggregate([
                { $match: match },
                {
                    $group: {
                        _id: bucketExpression("$createdAt", window.unit),
                        calls: callSum,
                        whatsapp: whatsappSum,
                    },
                },
                {
                    $project: {
                        _id: 0,
                        date: "$_id",
                        calls: 1,
                        whatsapp: 1,
                        total: { $add: ["$calls", "$whatsapp"] },
                    },
                },
            ]),

            PropertyContact.aggregate([
                { $match: match },
                {
                    $group: {
                        _id: hourExpression("$createdAt"),
                        contacts: { $sum: 1 },
                    },
                },
                { $project: { _id: 0, hour: "$_id", contacts: 1 } },
            ]),

            // Most-contacted properties.
            PropertyContact.aggregate([
                { $match: match },
                {
                    $group: {
                        _id: "$propertyId",
                        total: { $sum: 1 },
                        calls: callSum,
                        whatsapp: whatsappSum,
                        clients: { $addToSet: "$clientId" },
                    },
                },
                { $sort: { total: -1 } },
                { $limit: 10 },
                propertyLookup,
                {
                    $project: {
                        _id: 0,
                        propertyId: "$_id",
                        total: 1,
                        calls: 1,
                        whatsapp: 1,
                        uniqueClients: { $size: "$clients" },
                        title: firstFromLookup(
                            "$property.title",
                            "Property no longer available"
                        ),
                        city: firstFromLookup("$property.city"),
                        propertyType: firstFromLookup("$property.propertyType"),
                        listingType: firstFromLookup("$property.listingType"),
                        price: firstFromLookup("$property.price", 0),
                    },
                },
            ]),

            // Owners receiving the most leads.
            PropertyContact.aggregate([
                { $match: match },
                {
                    $group: {
                        _id: "$ownerId",
                        total: { $sum: 1 },
                        calls: callSum,
                        whatsapp: whatsappSum,
                        properties: { $addToSet: "$propertyId" },
                        clients: { $addToSet: "$clientId" },
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
                        properties: { $size: "$properties" },
                        uniqueClients: { $size: "$clients" },
                        firstName: firstFromLookup("$owner.firstName"),
                        lastName: firstFromLookup("$owner.lastName"),
                        email: firstFromLookup("$owner.email"),
                    },
                },
            ]),

            // Contacts by property city.
            PropertyContact.aggregate([
                { $match: match },
                {
                    $group: {
                        _id: "$propertyId",
                        total: { $sum: 1 },
                        calls: callSum,
                        whatsapp: whatsappSum,
                    },
                },
                propertyLookup,
                {
                    $addFields: {
                        city: {
                            $trim: {
                                input: {
                                    $toString: firstFromLookup("$property.city"),
                                },
                            },
                        },
                    },
                },
                {
                    $group: {
                        _id: { $toLower: "$city" },
                        name: { $first: "$city" },
                        total: { $sum: "$total" },
                        calls: { $sum: "$calls" },
                        whatsapp: { $sum: "$whatsapp" },
                    },
                },
                { $sort: { total: -1 } },
                { $limit: 10 },
                {
                    $project: {
                        _id: 0,
                        name: {
                            $cond: [{ $eq: ["$name", ""] }, "Unknown", "$name"],
                        },
                        total: 1,
                        calls: 1,
                        whatsapp: 1,
                    },
                },
            ]),

            // Clients who contacted more than once (strong buyers/renters).
            PropertyContact.aggregate([
                { $match: match },
                { $group: { _id: "$clientId", count: { $sum: 1 } } },
                { $match: { count: { $gt: 1 } } },
                { $count: "count" },
            ]),

            PropertyContact.find(match)
                .populate("clientId", "firstName lastName email phoneNumber")
                .populate("ownerId", "firstName lastName email phoneNumber")
                .populate(
                    "propertyId",
                    "title propertyType listingType city price images"
                )
                .sort({ createdAt: -1 })
                .limit(20)
                .lean(),
        ]);

        // Views of the top properties in the same range -> lead conversion.
        const topIds = topPropertyRows.map((row) => row.propertyId);

        const clickRows = topIds.length
            ? await PropertyClickEvent.aggregate([
                {
                    $match: {
                        ...currentMatch(window, "createdAt"),
                        propertyId: { $in: topIds },
                    },
                },
                { $group: { _id: "$propertyId", clicks: { $sum: 1 } } },
            ])
            : [];

        const clicksByProperty = new Map(
            clickRows.map((row) => [String(row._id), row.clicks])
        );

        const totals = totalsRows[0] || {
            total: 0,
            calls: 0,
            whatsapp: 0,
            uniqueClients: 0,
            uniqueProperties: 0,
            uniqueOwners: 0,
        };

        const repeatClients = repeatClientRows[0]?.count || 0;

        return res.status(200).json({
            success: true,
            range: window.range,

            statistics: {
                totalContacts: totals.total,
                callContacts: totals.calls,
                whatsappContacts: totals.whatsapp,
                whatsappShare: rate(totals.whatsapp, totals.total),
                contactsToday,
                uniqueClients: totals.uniqueClients,
                uniqueProperties: totals.uniqueProperties,
                uniqueOwners: totals.uniqueOwners,
                repeatClients,
                repeatClientRate: rate(repeatClients, totals.uniqueClients),
                contactsPerClient: totals.uniqueClients
                    ? Math.round((totals.total / totals.uniqueClients) * 10) / 10
                    : 0,
                previousContacts: previousTotal,
                contactsChange: changeFor(window, totals.total, previousTotal),
            },

            dailyActivity: fillSeries(trendRows, window, {
                calls: 0,
                whatsapp: 0,
                total: 0,
            }),

            hourly: fillHours(hourlyRows, "contacts"),

            topProperties: topPropertyRows.map((row) => {
                const clicks = clicksByProperty.get(String(row.propertyId)) || 0;

                return {
                    ...row,
                    clicks,
                    conversionRate: rate(row.total, clicks),
                };
            }),

            topOwners,
            cities,
            recentContacts,
        });
    } catch (error) {
        console.error("Get property contact analytics error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to retrieve contact analytics.",
        });
    }
};
