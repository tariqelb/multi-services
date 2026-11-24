// backend/controllers/dashboard/propertyClickController.js

import mongoose from "mongoose";

import Property from "../../models/Property.js";
import PropertyClick from "../../models/PropertyClick.js";
import PropertyClickEvent from "../../models/PropertyClickEvent.js";
import PropertyContact from "../../models/PropertyContact.js";

import {
    bucketExpression,
    buildPagination,
    changeFor,
    currentMatch,
    fillHours,
    fillSeries,
    getPagination,
    getRangeWindow,
    getReferrer,
    getVisitorKey,
    groupCount,
    hourExpression,
    isBotRequest,
    previousMatch,
    rate,
    round,
} from "../../../main/utils/analytics.js";

// The same visitor clicking the same property within this window
// is treated as one click (prevents refresh / double-click inflation).
const DUPLICATE_WINDOW_MS = 30 * 1000;

const countByProperty = async (Model, propertyIds, match = {}) => {
    if (!propertyIds.length) return new Map();

    const rows = await Model.aggregate([
        { $match: { ...match, propertyId: { $in: propertyIds } } },
        { $group: { _id: "$propertyId", count: { $sum: 1 } } },
    ]);

    return new Map(rows.map((row) => [String(row._id), row.count]));
};

// POST /api/property/:id/click
export const trackPropertyClick = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({
                message: "Invalid property ID.",
            });
        }

        if (isBotRequest(req)) {
            return res.status(200).json({
                message: "Automated traffic ignored.",
                counted: false,
            });
        }

        const property = await Property.findById(id)
            .select("userId title propertyType listingType city neighborhood price")
            .lean();

        if (!property) {
            return res.status(404).json({
                message: "Property not found.",
            });
        }

        const userId = req.user?.userId || null;

        // Owners opening their own listing are not real demand.
        if (
            userId &&
            property.userId &&
            String(property.userId) === String(userId)
        ) {
            return res.status(200).json({
                message: "Owner views are not counted.",
                counted: false,
            });
        }

        const now = new Date();
        const visitorKey = getVisitorKey(req);

        const isDuplicate = await PropertyClickEvent.exists({
            propertyId: property._id,
            visitorKey,
            createdAt: {
                $gte: new Date(now.getTime() - DUPLICATE_WINDOW_MS),
            },
        });

        if (isDuplicate) {
            const current = await PropertyClick.findOne({
                propertyId: property._id,
            })
                .select("clickCount lastClickedAt")
                .lean();

            return res.status(200).json({
                message: "Repeated click ignored.",
                counted: false,
                analytics: {
                    propertyId: property._id,
                    clickCount: current?.clickCount || 0,
                    lastClickedAt: current?.lastClickedAt || null,
                },
            });
        }

        const details = {
            propertyOwnerId: property.userId || null,
            title: property.title || "",
            propertyType: property.propertyType || "",
            listingType: property.listingType || "",
            city: property.city || "",
            neighborhood: property.neighborhood || "",
            price: property.price || 0,
        };

        const [analytics] = await Promise.all([
            PropertyClick.findOneAndUpdate(
                { propertyId: property._id },
                {
                    $inc: { clickCount: 1 },
                    $set: {
                        ...details,
                        lastClickedAt: now,
                        lastClickedBy: userId,
                    },
                    $setOnInsert: { firstClickedAt: now },
                },
                {
                    upsert: true,
                    new: true,
                    runValidators: true,
                    setDefaultsOnInsert: true,
                }
            ),

            PropertyClickEvent.create({
                ...details,
                propertyId: property._id,
                userId,
                visitorKey,
                referrer: getReferrer(req),
            }),
        ]);

        return res.status(200).json({
            message: "Property click recorded.",
            counted: true,
            analytics: {
                propertyId: analytics.propertyId,
                clickCount: analytics.clickCount,
                lastClickedAt: analytics.lastClickedAt,
            },
        });
    } catch (error) {
        console.error("Property click tracking error:", error);

        return res.status(500).json({
            message: "Unable to record property click.",
        });
    }
};

// GET /api/property/clicks?range=30d&page=1&sort=recent|clicks
export const getPropertyClickAnalytics = async (req, res) => {
    try {
        const window = getRangeWindow(req.query.range);

        const { page, limit, skip } = getPagination(req.query, {
            defaultLimit: 6,
            maxLimit: 24,
        });

        const listSort =
            req.query.sort === "clicks"
                ? { clickCount: -1, _id: -1 }
                : { lastClickedAt: -1, _id: -1 };

        const eventMatch = currentMatch(window, "createdAt");
        const previousEventMatch = previousMatch(window, "createdAt");
        const contactMatch = currentMatch(window, "createdAt");

        const [
            eventTotals,
            previousClicks,
            lifetimeTotals,
            trendRows,
            hourlyRows,
            propertyTypes,
            listingTypes,
            cities,
            topRows,
            contactsInRange,
            properties,
            total,
        ] = await Promise.all([
            PropertyClickEvent.aggregate([
                { $match: eventMatch },
                {
                    $group: {
                        _id: null,
                        clicks: { $sum: 1 },
                        visitors: { $addToSet: "$visitorKey" },
                        registered: {
                            $sum: {
                                $cond: [{ $ifNull: ["$userId", false] }, 1, 0],
                            },
                        },
                        properties: { $addToSet: "$propertyId" },
                    },
                },
                {
                    $project: {
                        _id: 0,
                        clicks: 1,
                        registered: 1,
                        uniqueVisitors: { $size: "$visitors" },
                        clickedProperties: { $size: "$properties" },
                    },
                },
            ]),

            previousEventMatch
                ? PropertyClickEvent.countDocuments(previousEventMatch)
                : Promise.resolve(0),

            // Lifetime counters (includes clicks recorded before events existed).
            PropertyClick.aggregate([
                {
                    $group: {
                        _id: null,
                        totalClicks: { $sum: "$clickCount" },
                        totalProperties: { $sum: 1 },
                        cities: { $addToSet: "$city" },
                    },
                },
                {
                    $project: {
                        _id: 0,
                        totalClicks: 1,
                        totalProperties: 1,
                        totalCities: {
                            $size: {
                                $filter: {
                                    input: "$cities",
                                    as: "city",
                                    cond: {
                                        $and: [
                                            { $ne: ["$$city", null] },
                                            { $ne: ["$$city", ""] },
                                        ],
                                    },
                                },
                            },
                        },
                    },
                },
            ]),

            PropertyClickEvent.aggregate([
                { $match: eventMatch },
                {
                    $group: {
                        _id: bucketExpression("$createdAt", window.unit),
                        clicks: { $sum: 1 },
                        visitors: { $addToSet: "$visitorKey" },
                    },
                },
                {
                    $project: {
                        _id: 0,
                        date: "$_id",
                        clicks: 1,
                        uniqueVisitors: { $size: "$visitors" },
                    },
                },
            ]),

            PropertyClickEvent.aggregate([
                { $match: eventMatch },
                {
                    $group: {
                        _id: hourExpression("$createdAt"),
                        clicks: { $sum: 1 },
                    },
                },
                { $project: { _id: 0, hour: "$_id", clicks: 1 } },
            ]),

            PropertyClickEvent.aggregate([
                { $match: eventMatch },
                ...groupCount("$propertyType", { valueKey: "clicks", limit: 12 }),
            ]),

            PropertyClickEvent.aggregate([
                { $match: eventMatch },
                ...groupCount("$listingType", { valueKey: "clicks" }),
            ]),

            PropertyClickEvent.aggregate([
                { $match: eventMatch },
                ...groupCount("$city", { valueKey: "clicks", limit: 12 }),
            ]),

            // Most viewed properties in the selected range.
            PropertyClickEvent.aggregate([
                { $match: eventMatch },
                {
                    $group: {
                        _id: "$propertyId",
                        clicks: { $sum: 1 },
                        visitors: { $addToSet: "$visitorKey" },
                        title: { $last: "$title" },
                        city: { $last: "$city" },
                        propertyType: { $last: "$propertyType" },
                        listingType: { $last: "$listingType" },
                        price: { $last: "$price" },
                    },
                },
                { $sort: { clicks: -1 } },
                { $limit: 10 },
                {
                    $project: {
                        _id: 0,
                        propertyId: "$_id",
                        clicks: 1,
                        uniqueVisitors: { $size: "$visitors" },
                        title: 1,
                        city: 1,
                        propertyType: 1,
                        listingType: 1,
                        price: 1,
                    },
                },
            ]),

            PropertyContact.countDocuments(contactMatch),

            PropertyClick.find({})
                .sort(listSort)
                .skip(skip)
                .limit(limit)
                .lean(),

            PropertyClick.countDocuments(),
        ]);

        const topIds = topRows.map((row) => row.propertyId);
        const pageIds = properties.map((item) => item.propertyId);

        const [topContacts, pageContacts, pageClicksInRange] =
            await Promise.all([
                countByProperty(PropertyContact, topIds, contactMatch),
                countByProperty(PropertyContact, pageIds),
                countByProperty(PropertyClickEvent, pageIds, eventMatch),
            ]);

        const totals = eventTotals[0] || {
            clicks: 0,
            registered: 0,
            uniqueVisitors: 0,
            clickedProperties: 0,
        };

        const lifetime = lifetimeTotals[0] || {
            totalClicks: 0,
            totalProperties: 0,
            totalCities: 0,
        };

        return res.status(200).json({
            range: window.range,

            summary: {
                // Lifetime (kept for backward compatibility)
                totalClicks: lifetime.totalClicks,
                totalProperties: lifetime.totalProperties,
                totalCities: lifetime.totalCities,

                // Selected range
                clicksInRange: totals.clicks,
                previousClicks,
                clicksChange: changeFor(window, totals.clicks, previousClicks),
                uniqueVisitors: totals.uniqueVisitors,
                clickedProperties: totals.clickedProperties,
                registeredShare: rate(totals.registered, totals.clicks),
                clicksPerVisitor: totals.uniqueVisitors
                    ? round(totals.clicks / totals.uniqueVisitors)
                    : 0,
                contacts: contactsInRange,
                conversionRate: rate(contactsInRange, totals.clicks),
            },

            trend: fillSeries(trendRows, window, {
                clicks: 0,
                uniqueVisitors: 0,
            }),

            hourly: fillHours(hourlyRows, "clicks"),

            charts: {
                propertyTypes,
                listingTypes,
                cities,
            },

            topProperties: topRows.map((row) => {
                const contacts = topContacts.get(String(row.propertyId)) || 0;

                return {
                    ...row,
                    contacts,
                    conversionRate: rate(contacts, row.clicks),
                };
            }),

            properties: properties.map((item) => {
                const key = String(item.propertyId);
                const contacts = pageContacts.get(key) || 0;

                return {
                    ...item,
                    clicksInRange: pageClicksInRange.get(key) || 0,
                    contacts,
                    conversionRate: rate(contacts, item.clickCount),
                };
            }),

            pagination: buildPagination(page, limit, total),
        });
    } catch (error) {
        console.error("Property click analytics retrieval error:", error);

        return res.status(500).json({
            message: "Unable to retrieve property click analytics.",
        });
    }
};
