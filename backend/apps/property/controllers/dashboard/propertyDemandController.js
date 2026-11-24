// backend/apps/property/controllers/dashboard/propertyDemandController.js
//
// Property demand (alerts) compared with supply (published properties).

import Property from "../../models/Property.js";
import PropertyAlert from "../../models/PropertyAlert.js";

import {
    bucketExpression,
    changeFor,
    currentMatch,
    fillSeries,
    getRangeWindow,
    previousMatch,
    rate,
    round,
} from "../../../main/utils/analytics.js";

// -----------------------------------------------------------------------------
// Property demand (alerts) + supply comparison
// -----------------------------------------------------------------------------

const normalizedCity = {
    $trim: { input: { $toString: { $ifNull: ["$city", ""] } } },
};

// GET /api/property/dashboard/property-demand?range=30d
export const getPropertyDemandAnalytics = async (req, res) => {
    try {
        const window = getRangeWindow(req.query.range);

        const historicalMatch = currentMatch(window, "createdAt");
        const previousHistoricalMatch = previousMatch(window, "createdAt");

        const activeMatch = {
            ...historicalMatch,
            isArchived: { $ne: true },
        };

        const [
            totals,
            previousTotals,
            topCities,
            propertyTypes,
            listingTypes,
            cityListingTypes,
            trendRows,
            recentAlerts,
            supplyByCity,
            supplyByType,
        ] = await Promise.all([
            PropertyAlert.aggregate([
                { $match: historicalMatch },
                {
                    $group: {
                        _id: null,
                        totalAlerts: { $sum: 1 },
                        archivedAlerts: { $sum: { $cond: ["$isArchived", 1, 0] } },
                        activeAlerts: { $sum: { $cond: ["$isArchived", 0, 1] } },
                        uniqueUsers: { $addToSet: "$user" },
                        cities: { $addToSet: { $toLower: normalizedCity } },
                    },
                },
                {
                    $project: {
                        _id: 0,
                        totalAlerts: 1,
                        activeAlerts: 1,
                        archivedAlerts: 1,
                        uniqueUsers: { $size: "$uniqueUsers" },
                        uniqueCities: { $size: "$cities" },
                    },
                },
            ]),

            previousHistoricalMatch
                ? PropertyAlert.aggregate([
                    { $match: previousHistoricalMatch },
                    {
                        $group: {
                            _id: null,
                            totalAlerts: { $sum: 1 },
                            uniqueUsers: { $addToSet: "$user" },
                        },
                    },
                    {
                        $project: {
                            _id: 0,
                            totalAlerts: 1,
                            uniqueUsers: { $size: "$uniqueUsers" },
                        },
                    },
                ])
                : Promise.resolve([]),

            // Most requested cities (active alerts), case-insensitive.
            PropertyAlert.aggregate([
                { $match: activeMatch },
                {
                    $group: {
                        _id: { $toLower: normalizedCity },
                        city: { $first: normalizedCity },
                        requests: { $sum: 1 },
                        uniqueUsers: { $addToSet: "$user" },
                    },
                },
                { $match: { _id: { $ne: "" } } },
                { $sort: { requests: -1 } },
                { $limit: 10 },
                {
                    $project: {
                        _id: 0,
                        key: "$_id",
                        city: 1,
                        requests: 1,
                        uniqueUsers: { $size: "$uniqueUsers" },
                    },
                },
            ]),

            PropertyAlert.aggregate([
                { $match: activeMatch },
                { $unwind: "$propertyTypes" },
                { $group: { _id: "$propertyTypes", requests: { $sum: 1 } } },
                { $project: { _id: 0, type: "$_id", requests: 1 } },
                { $sort: { requests: -1 } },
            ]),

            PropertyAlert.aggregate([
                { $match: activeMatch },
                { $unwind: "$listingTypes" },
                { $group: { _id: "$listingTypes", requests: { $sum: 1 } } },
                { $project: { _id: 0, type: "$_id", requests: 1 } },
                { $sort: { requests: -1 } },
            ]),

            PropertyAlert.aggregate([
                { $match: activeMatch },
                { $unwind: "$listingTypes" },
                {
                    $group: {
                        _id: {
                            key: { $toLower: normalizedCity },
                            listingType: "$listingTypes",
                        },
                        city: { $first: normalizedCity },
                        requests: { $sum: 1 },
                    },
                },
                {
                    $project: {
                        _id: 0,
                        key: "$_id.key",
                        city: 1,
                        listingType: "$_id.listingType",
                        requests: 1,
                    },
                },
                { $sort: { requests: -1 } },
            ]),

            PropertyAlert.aggregate([
                { $match: historicalMatch },
                {
                    $group: {
                        _id: bucketExpression("$createdAt", window.unit),
                        alerts: { $sum: 1 },
                        archived: { $sum: { $cond: ["$isArchived", 1, 0] } },
                    },
                },
                {
                    $project: {
                        _id: 0,
                        date: "$_id",
                        alerts: 1,
                        archived: 1,
                        active: { $subtract: ["$alerts", "$archived"] },
                    },
                },
            ]),

            PropertyAlert.find(historicalMatch)
                .sort({ createdAt: -1 })
                .limit(10)
                .populate("user", "firstName lastName email")
                .lean(),

            // Current supply: available listings per city.
            Property.aggregate([
                { $match: { status: "Available" } },
                {
                    $group: {
                        _id: { $toLower: normalizedCity },
                        city: { $first: normalizedCity },
                        listings: { $sum: 1 },
                        forSale: {
                            $sum: { $cond: [{ $eq: ["$listingType", "For Sale"] }, 1, 0] },
                        },
                        forRent: {
                            $sum: { $cond: [{ $eq: ["$listingType", "For Rent"] }, 1, 0] },
                        },
                    },
                },
            ]),

            Property.aggregate([
                { $match: { status: "Available" } },
                { $group: { _id: "$propertyType", listings: { $sum: 1 } } },
            ]),
        ]);

        const summaryRow = totals[0] || {
            totalAlerts: 0,
            activeAlerts: 0,
            archivedAlerts: 0,
            uniqueUsers: 0,
            uniqueCities: 0,
        };

        const previousRow = previousTotals[0] || {
            totalAlerts: 0,
            uniqueUsers: 0,
        };

        const supplyMap = new Map(supplyByCity.map((row) => [row._id, row]));
        const typeSupplyMap = new Map(
            supplyByType.map((row) => [row._id, row.listings])
        );

        // Demand vs supply: ratio > 1 means more searchers than listings.
        const demandVsSupply = topCities.map((row) => {
            const supply = supplyMap.get(row.key);
            const listings = supply?.listings || 0;

            return {
                city: row.city,
                demand: row.requests,
                uniqueUsers: row.uniqueUsers,
                supply: listings,
                supplyForSale: supply?.forSale || 0,
                supplyForRent: supply?.forRent || 0,
                demandPerListing: listings ? round(row.requests / listings, 2) : null,
            };
        });

        return res.status(200).json({
            success: true,
            range: window.range,

            summary: {
                ...summaryRow,
                archiveRate: rate(summaryRow.archivedAlerts, summaryRow.totalAlerts),
                alertsPerUser: summaryRow.uniqueUsers
                    ? round(summaryRow.totalAlerts / summaryRow.uniqueUsers)
                    : 0,
                previousAlerts: previousRow.totalAlerts,
                totalAlertsChange: changeFor(
                    window,
                    summaryRow.totalAlerts,
                    previousRow.totalAlerts
                ),
                uniqueUsersChange: changeFor(
                    window,
                    summaryRow.uniqueUsers,
                    previousRow.uniqueUsers
                ),
                availableListings: supplyByCity.reduce(
                    (sum, row) => sum + row.listings,
                    0
                ),
            },

            topCities: topCities.map(({ key, ...row }) => row),

            propertyTypes: propertyTypes.map((row) => ({
                ...row,
                supply: typeSupplyMap.get(row.type) || 0,
            })),

            listingTypes,
            cityListingTypes: cityListingTypes.map(({ key, ...row }) => row),
            demandVsSupply,

            demandTrend: fillSeries(trendRows, window, {
                alerts: 0,
                archived: 0,
                active: 0,
            }),

            recentAlerts,
        });
    } catch (error) {
        console.error("Get property demand analytics error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to retrieve property demand analytics.",
        });
    }
};

