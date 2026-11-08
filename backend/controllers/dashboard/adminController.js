///home/tariq/multi-services/app/backend/controllers/dashboard/adminController.js
import mongoose from "mongoose";

import User from "../../DatabaseModels/Schema/User.js";
import Property from "../../DatabaseModels/Schema/Property.js";
import SavedProperty from "../../DatabaseModels/Schema/SavedProperty.js";
import Feedback from "../../DatabaseModels/Schema/Feedback.js";
import PropertyAlert from "../../DatabaseModels/Schema/PropertyAlert.js";
// GET /api/admin/users
export const getAdminUsers = async (req, res) => {
    try {
        const users = await User.aggregate([
            {
                $lookup: {
                    from: Property.collection.name,
                    let: { userId: "$_id" },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $eq: [
                                        "$userId",
                                        "$$userId",
                                    ],
                                },
                            },
                        },
                        {
                            $count: "count",
                        },
                    ],
                    as: "propertyStats",
                },
            },
            {
                $lookup: {
                    from: SavedProperty.collection.name,
                    let: { userId: "$_id" },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $eq: [
                                        "$userId",
                                        "$$userId",
                                    ],
                                },
                            },
                        },
                        {
                            $count: "count",
                        },
                    ],
                    as: "savedStats",
                },
            },
            {
                $lookup: {
                    from: Feedback.collection.name,
                    let: { userId: "$_id" },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $eq: [
                                        "$userId",
                                        "$$userId",
                                    ],
                                },
                            },
                        },
                        {
                            $count: "count",
                        },
                    ],
                    as: "reportStats",
                },
            },
            {
                $addFields: {
                    publishedProperties: {
                        $ifNull: [
                            {
                                $arrayElemAt: [
                                    "$propertyStats.count",
                                    0,
                                ],
                            },
                            0,
                        ],
                    },
                    savedProperties: {
                        $ifNull: [
                            {
                                $arrayElemAt: [
                                    "$savedStats.count",
                                    0,
                                ],
                            },
                            0,
                        ],
                    },
                    reports: {
                        $ifNull: [
                            {
                                $arrayElemAt: [
                                    "$reportStats.count",
                                    0,
                                ],
                            },
                            0,
                        ],
                    },
                },
            },
            {
                $project: {
                    password: 0,
                    propertyStats: 0,
                    savedStats: 0,
                    reportStats: 0,
                },
            },
            {
                $sort: {
                    createdAt: -1,
                },
            },
        ]);

        return res.status(200).json({
            success: true,
            count: users.length,
            users,
        });
    } catch (error) {
        console.error("Get admin users error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to retrieve users.",
        });
    }
};
// GET /api/admin/property-demand?range=30d
export const getPropertyDemandAnalytics = async (req, res) => {
    try {
        const range = req.query.range || "30d";

        const allowedRanges = ["7d", "30d", "90d", "all"];

        if (!allowedRanges.includes(range)) {
            return res.status(400).json({
                success: false,
                message: "Invalid analytics date range.",
            });
        }

        const now = new Date();
        let startDate = null;

        if (range !== "all") {
            const days = Number.parseInt(range, 10);

            startDate = new Date(now);
            startDate.setDate(startDate.getDate() - days);
        }

        const dateMatch = startDate
            ? { createdAt: { $gte: startDate, $lte: now } }
            : {};

        const activeMatch = {
            ...dateMatch,
            isArchived: { $ne: true },
        };

        const historicalMatch = {
            ...dateMatch,
        };

        const trendFormat =
            range === "7d" || range === "30d"
                ? "%Y-%m-%d"
                : "%Y-%m";

        const [
            totals,
            topCities,
            propertyTypes,
            listingTypes,
            cityListingTypes,
            demandTrend,
            recentAlerts,
        ] = await Promise.all([
            // Summary statistics.
            PropertyAlert.aggregate([
                { $match: historicalMatch },
                {
                    $group: {
                        _id: null,
                        totalAlerts: { $sum: 1 },
                        archivedAlerts: {
                            $sum: {
                                $cond: ["$isArchived", 1, 0],
                            },
                        },
                        activeAlerts: {
                            $sum: {
                                $cond: ["$isArchived", 0, 1],
                            },
                        },
                        uniqueUsers: {
                            $addToSet: "$user",
                        },
                    },
                },
                {
                    $project: {
                        _id: 0,
                        totalAlerts: 1,
                        activeAlerts: 1,
                        archivedAlerts: 1,
                        uniqueUsers: {
                            $size: "$uniqueUsers",
                        },
                    },
                },
            ]),

            // Most requested cities (active alerts).
            PropertyAlert.aggregate([
                { $match: activeMatch },
                {
                    $group: {
                        _id: {
                            $trim: {
                                input: "$city",
                            },
                        },
                        requests: { $sum: 1 },
                        uniqueUsers: {
                            $addToSet: "$user",
                        },
                    },
                },
                {
                    $project: {
                        _id: 0,
                        city: "$_id",
                        requests: 1,
                        uniqueUsers: {
                            $size: "$uniqueUsers",
                        },
                    },
                },
                { $sort: { requests: -1 } },
                { $limit: 10 },
            ]),

            // Most requested property types.
            PropertyAlert.aggregate([
                { $match: activeMatch },
                { $unwind: "$propertyTypes" },
                {
                    $group: {
                        _id: "$propertyTypes",
                        requests: { $sum: 1 },
                    },
                },
                {
                    $project: {
                        _id: 0,
                        type: "$_id",
                        requests: 1,
                    },
                },
                { $sort: { requests: -1 } },
            ]),

            // Sale vs rent.
            PropertyAlert.aggregate([
                { $match: activeMatch },
                { $unwind: "$listingTypes" },
                {
                    $group: {
                        _id: "$listingTypes",
                        requests: { $sum: 1 },
                    },
                },
                {
                    $project: {
                        _id: 0,
                        type: "$_id",
                        requests: 1,
                    },
                },
                { $sort: { requests: -1 } },
            ]),

            // Sale vs rent by city.
            PropertyAlert.aggregate([
                { $match: activeMatch },
                { $unwind: "$listingTypes" },
                {
                    $group: {
                        _id: {
                            city: "$city",
                            listingType: "$listingTypes",
                        },
                        requests: { $sum: 1 },
                    },
                },
                {
                    $project: {
                        _id: 0,
                        city: "$_id.city",
                        listingType: "$_id.listingType",
                        requests: 1,
                    },
                },
                { $sort: { requests: -1 } },
            ]),

            // Historical alert creation trend.
            PropertyAlert.aggregate([
                { $match: historicalMatch },
                {
                    $group: {
                        _id: {
                            $dateToString: {
                                format: trendFormat,
                                date: "$createdAt",
                                timezone: "Africa/Casablanca",
                            },
                        },
                        alerts: { $sum: 1 },
                        archived: {
                            $sum: {
                                $cond: ["$isArchived", 1, 0],
                            },
                        },
                    },
                },
                {
                    $project: {
                        _id: 0,
                        date: "$_id",
                        alerts: 1,
                        archived: 1,
                        active: {
                            $subtract: ["$alerts", "$archived"],
                        },
                    },
                },
                { $sort: { date: 1 } },
            ]),

            // Recent alerts, including archived alerts.
            PropertyAlert.find(dateMatch)
                .sort({ createdAt: -1 })
                .limit(10)
                .populate("user", "firstName lastName email")
                .lean(),
        ]);

        const summary = totals[0] || {
            totalAlerts: 0,
            activeAlerts: 0,
            archivedAlerts: 0,
            uniqueUsers: 0,
        };

        return res.status(200).json({
            success: true,
            range,
            summary,
            topCities,
            propertyTypes,
            listingTypes,
            cityListingTypes,
            demandTrend,
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