// backend/controllers/dashboard/externalListingAnalyticsController.js

import ExternalListingClick from "../../models/ExternalListingClick.js";
import ExternalListingClickEvent from "../../models/ExternalListingClickEvent.js";

import {
    bucketExpression,
    buildPagination,
    changeFor,
    currentMatch,
    fillHours,
    fillSeries,
    getPagination,
    getRangeWindow,
    groupCount,
    hourExpression,
    previousMatch,
    rate,
    round,
} from "../../../main/utils/analytics.js";

// GET /api/property/external-listings/analytics?range=30d&page=1&sort=recent|clicks
export const getExternalListingAnalytics = async (req, res) => {
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

        const [
            eventTotals,
            previousClicks,
            lifetimeTotals,
            trendRows,
            hourlyRows,
            propertyTypes,
            listingTypes,
            cities,
            websites,
            topListings,
            listings,
            total,
        ] = await Promise.all([
            ExternalListingClickEvent.aggregate([
                { $match: eventMatch },
                {
                    $group: {
                        _id: null,
                        clicks: { $sum: 1 },
                        visitors: { $addToSet: "$visitorKey" },
                        listings: { $addToSet: "$externalListingId" },
                        registered: {
                            $sum: {
                                $cond: [{ $ifNull: ["$userId", false] }, 1, 0],
                            },
                        },
                    },
                },
                {
                    $project: {
                        _id: 0,
                        clicks: 1,
                        registered: 1,
                        uniqueVisitors: { $size: "$visitors" },
                        clickedListings: { $size: "$listings" },
                    },
                },
            ]),

            previousEventMatch
                ? ExternalListingClickEvent.countDocuments(previousEventMatch)
                : Promise.resolve(0),

            ExternalListingClick.aggregate([
                {
                    $group: {
                        _id: null,
                        totalClicks: { $sum: "$clickCount" },
                        totalListings: { $sum: 1 },
                        websites: { $addToSet: "$sourceDomain" },
                        cities: { $addToSet: "$city" },
                    },
                },
                {
                    $project: {
                        _id: 0,
                        totalClicks: 1,
                        totalListings: 1,
                        totalWebsites: {
                            $size: {
                                $setDifference: ["$websites", ["", null]],
                            },
                        },
                        totalCities: {
                            $size: {
                                $setDifference: ["$cities", ["", null]],
                            },
                        },
                    },
                },
            ]),

            ExternalListingClickEvent.aggregate([
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

            ExternalListingClickEvent.aggregate([
                { $match: eventMatch },
                {
                    $group: {
                        _id: hourExpression("$createdAt"),
                        clicks: { $sum: 1 },
                    },
                },
                { $project: { _id: 0, hour: "$_id", clicks: 1 } },
            ]),

            ExternalListingClickEvent.aggregate([
                { $match: eventMatch },
                ...groupCount("$propertyType", { valueKey: "clicks", limit: 12 }),
            ]),

            ExternalListingClickEvent.aggregate([
                { $match: eventMatch },
                ...groupCount("$listingType", { valueKey: "clicks" }),
            ]),

            ExternalListingClickEvent.aggregate([
                { $match: eventMatch },
                ...groupCount("$city", { valueKey: "clicks", limit: 12 }),
            ]),

            ExternalListingClickEvent.aggregate([
                { $match: eventMatch },
                {
                    $group: {
                        _id: "$sourceDomain",
                        sourceName: { $last: "$sourceName" },
                        clicks: { $sum: 1 },
                        visitors: { $addToSet: "$visitorKey" },
                        listings: { $addToSet: "$externalListingId" },
                    },
                },
                { $sort: { clicks: -1 } },
                { $limit: 12 },
                {
                    $project: {
                        _id: 0,
                        domain: "$_id",
                        sourceName: 1,
                        clicks: 1,
                        uniqueVisitors: { $size: "$visitors" },
                        listings: { $size: "$listings" },
                    },
                },
            ]),

            ExternalListingClickEvent.aggregate([
                { $match: eventMatch },
                {
                    $group: {
                        _id: "$externalListingId",
                        clicks: { $sum: 1 },
                        visitors: { $addToSet: "$visitorKey" },
                        title: { $last: "$title" },
                        city: { $last: "$city" },
                        sourceName: { $last: "$sourceName" },
                        sourceDomain: { $last: "$sourceDomain" },
                        listingType: { $last: "$listingType" },
                        propertyType: { $last: "$propertyType" },
                    },
                },
                { $sort: { clicks: -1 } },
                { $limit: 10 },
                {
                    $project: {
                        _id: 0,
                        externalListingId: "$_id",
                        clicks: 1,
                        uniqueVisitors: { $size: "$visitors" },
                        title: 1,
                        city: 1,
                        sourceName: 1,
                        sourceDomain: 1,
                        listingType: 1,
                        propertyType: 1,
                    },
                },
            ]),

            ExternalListingClick.find({})
                .sort(listSort)
                .skip(skip)
                .limit(limit)
                .lean(),

            ExternalListingClick.countDocuments(),
        ]);

        // Clicks in the selected range for the listings on this page.
        const pageIds = listings.map((item) => item.externalListingId);

        const pageRangeRows = pageIds.length
            ? await ExternalListingClickEvent.aggregate([
                {
                    $match: {
                        ...eventMatch,
                        externalListingId: { $in: pageIds },
                    },
                },
                {
                    $group: {
                        _id: "$externalListingId",
                        count: { $sum: 1 },
                    },
                },
            ])
            : [];

        const pageRange = new Map(
            pageRangeRows.map((row) => [String(row._id), row.count])
        );

        const totals = eventTotals[0] || {
            clicks: 0,
            registered: 0,
            uniqueVisitors: 0,
            clickedListings: 0,
        };

        const lifetime = lifetimeTotals[0] || {
            totalClicks: 0,
            totalListings: 0,
            totalWebsites: 0,
            totalCities: 0,
        };

        return res.status(200).json({
            range: window.range,

            summary: {
                // Lifetime (kept for backward compatibility)
                totalClicks: lifetime.totalClicks,
                totalListings: lifetime.totalListings,
                totalWebsites: lifetime.totalWebsites,
                totalCities: lifetime.totalCities,

                // Selected range
                clicksInRange: totals.clicks,
                previousClicks,
                clicksChange: changeFor(window, totals.clicks, previousClicks),
                uniqueVisitors: totals.uniqueVisitors,
                clickedListings: totals.clickedListings,
                registeredShare: rate(totals.registered, totals.clicks),
                clicksPerVisitor: totals.uniqueVisitors
                    ? round(totals.clicks / totals.uniqueVisitors)
                    : 0,
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
                websites: websites.map((item) => ({
                    name: item.sourceName || item.domain || "Unknown",
                    domain: item.domain,
                    clicks: item.clicks,
                    uniqueVisitors: item.uniqueVisitors,
                    listings: item.listings,
                    share: rate(item.clicks, totals.clicks),
                })),
            },

            topListings,

            listings: listings.map((item) => ({
                ...item,
                clicksInRange: pageRange.get(String(item.externalListingId)) || 0,
            })),

            pagination: buildPagination(page, limit, total),
        });
    } catch (error) {
        console.error("External listing analytics error:", error);

        return res.status(500).json({
            message: "Unable to retrieve external listing analytics.",
        });
    }
};
