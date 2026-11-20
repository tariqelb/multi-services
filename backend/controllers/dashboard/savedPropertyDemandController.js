// backend/controllers/dashboard/savedPropertyDemandController.js
// Saved-property analytics computed in MongoDB (no full collection load).

import Property from "../../DatabaseModels/Schema/Property.js";
import User from "../../DatabaseModels/Schema/User.js";
import SavedProperty from "../../DatabaseModels/Schema/SavedProperty.js";

import {
    buildDateFilter,
    bucketExpression,
    changeFor,
    fillSeries,
    getRangeWindow,
    rate,
} from "../../utils/analytics.js";

// Returns `path` when it is a non-empty value, otherwise `fallback`.
const nonEmpty = (path, fallback) => ({
    $cond: [
        { $gt: [{ $strLenCP: { $toString: { $ifNull: [path, ""] } } }, 0] },
        path,
        fallback,
    ],
});

/**
 * One row per save/unsave event.
 * Older records without activityHistory produce a single "saved" event.
 */
const saveEventStages = (start, end) => {
    const dateFilter = buildDateFilter(start, end);

    return [
        {
            $project: {
                userId: 1,
                propertyId: 1,
                propertyInfo: 1,
                isSaved: 1,
                events: {
                    $cond: [
                        {
                            $gt: [
                                { $size: { $ifNull: ["$activityHistory", []] } },
                                0,
                            ],
                        },
                        "$activityHistory",
                        {
                            $cond: [
                                { $ne: ["$isSaved", false] },
                                [
                                    {
                                        action: "saved",
                                        at: { $ifNull: ["$savedAt", "$createdAt"] },
                                    },
                                ],
                                [],
                            ],
                        },
                    ],
                },
            },
        },
        { $unwind: "$events" },
        {
            $match: {
                "events.at": dateFilter || { $ne: null },
            },
        },
    ];
};

// Used by the dashboard overview as well.
export const getSaveEventStats = async (start = null, end = null) => {
    const [row] = await SavedProperty.aggregate([
        ...saveEventStages(start, end),
        { $match: { "events.action": "saved" } },
        {
            $group: {
                _id: null,
                saves: { $sum: 1 },
                users: { $addToSet: "$userId" },
            },
        },
        { $project: { _id: 0, saves: 1, uniqueUsers: { $size: "$users" } } },
    ]);

    return row || { saves: 0, uniqueUsers: 0 };
};

export const getSaveTrendRows = (start, unit) =>
    SavedProperty.aggregate([
        ...saveEventStages(start, null),
        { $match: { "events.action": "saved" } },
        {
            $group: {
                _id: bucketExpression("$events.at", unit),
                saves: { $sum: 1 },
            },
        },
        { $project: { _id: 0, date: "$_id", saves: 1 } },
    ]);

const groupSaved = (field, limit = 0) => {
    const stages = [
        { $match: { isSave: true } },
        {
            $group: {
                _id: { $toLower: field },
                name: { $first: field },
                requests: { $sum: 1 },
            },
        },
        { $sort: { requests: -1 } },
    ];

    if (limit) stages.push({ $limit: limit });

    stages.push({ $project: { _id: 0, name: 1, requests: 1 } });

    return stages;
};

// GET /api/dashboard/saved-property-demand?range=30d
export const getSavedPropertyDemandAnalytics = async (req, res) => {
    try {
        const window = getRangeWindow(req.query.range);

        const [[facets], previousStats, activeSavedProperties] =
            await Promise.all([
                SavedProperty.aggregate([
                    ...saveEventStages(window.start, null),
                    {
                        $lookup: {
                            from: Property.collection.name,
                            localField: "propertyId",
                            foreignField: "_id",
                            as: "property",
                        },
                    },
                    {
                        $addFields: {
                            property: { $arrayElemAt: ["$property", 0] },
                        },
                    },
                    {
                        $addFields: {
                            isSave: { $eq: ["$events.action", "saved"] },
                            city: {
                                $trim: {
                                    input: {
                                        $toString: nonEmpty(
                                            "$propertyInfo.city",
                                            nonEmpty("$property.city", "Unknown")
                                        ),
                                    },
                                },
                            },
                            propertyType: nonEmpty(
                                "$propertyInfo.propertyType",
                                nonEmpty("$property.propertyType", "Unknown")
                            ),
                            listingType: nonEmpty(
                                "$propertyInfo.listingType",
                                nonEmpty("$property.listingType", "Unknown")
                            ),
                            title: nonEmpty(
                                "$propertyInfo.title",
                                nonEmpty(
                                    "$property.title",
                                    "Property no longer available"
                                )
                            ),
                            price: {
                                $ifNull: [
                                    "$propertyInfo.price",
                                    { $ifNull: ["$property.price", 0] },
                                ],
                            },
                            image: nonEmpty(
                                "$propertyInfo.image",
                                {
                                    $let: {
                                        vars: {
                                            first: {
                                                $arrayElemAt: [
                                                    { $ifNull: ["$property.images", []] },
                                                    0,
                                                ],
                                            },
                                        },
                                        in: {
                                            $cond: [
                                                { $eq: [{ $type: "$$first" }, "string"] },
                                                "$$first",
                                                { $ifNull: ["$$first.path", ""] },
                                            ],
                                        },
                                    },
                                }
                            ),
                        },
                    },
                    {
                        $facet: {
                            totals: [
                                {
                                    $group: {
                                        _id: null,
                                        saves: { $sum: { $cond: ["$isSave", 1, 0] } },
                                        unsaves: { $sum: { $cond: ["$isSave", 0, 1] } },
                                        users: {
                                            $addToSet: {
                                                $cond: ["$isSave", "$userId", "$$REMOVE"],
                                            },
                                        },
                                        properties: {
                                            $addToSet: {
                                                $cond: ["$isSave", "$propertyId", "$$REMOVE"],
                                            },
                                        },
                                    },
                                },
                                {
                                    $project: {
                                        _id: 0,
                                        saves: 1,
                                        unsaves: 1,
                                        uniqueUsers: { $size: "$users" },
                                        uniqueProperties: { $size: "$properties" },
                                    },
                                },
                            ],

                            // Of the saves made in the range, how many are still saved?
                            retention: [
                                { $match: { isSave: true } },
                                {
                                    $group: {
                                        _id: "$_id",
                                        stillSaved: {
                                            $first: { $ne: ["$isSaved", false] },
                                        },
                                    },
                                },
                                {
                                    $group: {
                                        _id: null,
                                        pairs: { $sum: 1 },
                                        retained: {
                                            $sum: { $cond: ["$stillSaved", 1, 0] },
                                        },
                                    },
                                },
                            ],

                            cities: groupSaved("$city", 10),
                            propertyTypes: groupSaved("$propertyType", 10),
                            listingTypes: groupSaved("$listingType"),

                            priceByListingType: [
                                { $match: { isSave: true, price: { $gt: 0 } } },
                                {
                                    $group: {
                                        _id: "$listingType",
                                        saves: { $sum: 1 },
                                        avgPrice: { $avg: "$price" },
                                        minPrice: { $min: "$price" },
                                        maxPrice: { $max: "$price" },
                                    },
                                },
                                { $sort: { saves: -1 } },
                                {
                                    $project: {
                                        _id: 0,
                                        name: "$_id",
                                        saves: 1,
                                        avgPrice: { $round: ["$avgPrice", 0] },
                                        minPrice: 1,
                                        maxPrice: 1,
                                    },
                                },
                            ],

                            topProperties: [
                                {
                                    $group: {
                                        _id: "$propertyId",
                                        saves: { $sum: { $cond: ["$isSave", 1, 0] } },
                                        unsaves: { $sum: { $cond: ["$isSave", 0, 1] } },
                                        users: {
                                            $addToSet: {
                                                $cond: ["$isSave", "$userId", "$$REMOVE"],
                                            },
                                        },
                                        title: { $first: "$title" },
                                        city: { $first: "$city" },
                                        propertyType: { $first: "$propertyType" },
                                        listingType: { $first: "$listingType" },
                                        price: { $first: "$price" },
                                        image: { $first: "$image" },
                                    },
                                },
                                { $match: { saves: { $gt: 0 } } },
                                { $sort: { saves: -1 } },
                                { $limit: 10 },
                                {
                                    $project: {
                                        _id: 0,
                                        propertyId: "$_id",
                                        saves: 1,
                                        unsaves: 1,
                                        uniqueUsers: { $size: "$users" },
                                        title: 1,
                                        city: 1,
                                        propertyType: 1,
                                        listingType: 1,
                                        price: 1,
                                        image: 1,
                                    },
                                },
                            ],

                            trend: [
                                {
                                    $group: {
                                        _id: bucketExpression("$events.at", window.unit),
                                        saves: { $sum: { $cond: ["$isSave", 1, 0] } },
                                        unsaves: { $sum: { $cond: ["$isSave", 0, 1] } },
                                    },
                                },
                                {
                                    $project: {
                                        _id: 0,
                                        date: "$_id",
                                        saves: 1,
                                        unsaves: 1,
                                    },
                                },
                            ],

                            recent: [
                                { $match: { isSave: true } },
                                { $sort: { "events.at": -1 } },
                                { $limit: 20 },
                                {
                                    $lookup: {
                                        from: User.collection.name,
                                        localField: "userId",
                                        foreignField: "_id",
                                        as: "user",
                                    },
                                },
                                {
                                    $project: {
                                        _id: {
                                            $concat: [
                                                { $toString: "$_id" },
                                                "-",
                                                { $toString: { $toLong: "$events.at" } },
                                            ],
                                        },
                                        createdAt: "$events.at",
                                        user: {
                                            firstName: {
                                                $ifNull: [{ $arrayElemAt: ["$user.firstName", 0] }, ""],
                                            },
                                            lastName: {
                                                $ifNull: [{ $arrayElemAt: ["$user.lastName", 0] }, ""],
                                            },
                                            email: {
                                                $ifNull: [{ $arrayElemAt: ["$user.email", 0] }, ""],
                                            },
                                        },
                                        property: {
                                            propertyId: "$propertyId",
                                            title: "$title",
                                            city: "$city",
                                            propertyType: "$propertyType",
                                            listingType: "$listingType",
                                            price: "$price",
                                        },
                                    },
                                },
                            ],
                        },
                    },
                ]),

                window.start
                    ? getSaveEventStats(window.previousStart, window.previousEnd)
                    : Promise.resolve({ saves: 0, uniqueUsers: 0 }),

                SavedProperty.countDocuments({ isSaved: { $ne: false } }),
            ]);

        const totals = facets.totals[0] || {
            saves: 0,
            unsaves: 0,
            uniqueUsers: 0,
            uniqueProperties: 0,
        };

        const retention = facets.retention[0] || { pairs: 0, retained: 0 };

        return res.status(200).json({
            success: true,
            range: window.range,

            summary: {
                totalSaves: totals.saves,
                unsaves: totals.unsaves,
                netSaves: totals.saves - totals.unsaves,
                uniqueUsers: totals.uniqueUsers,
                uniqueProperties: totals.uniqueProperties,
                activeSavedProperties,
                retentionRate: rate(retention.retained, retention.pairs),
                savesPerUser: totals.uniqueUsers
                    ? Math.round((totals.saves / totals.uniqueUsers) * 10) / 10
                    : 0,
                previousSaves: previousStats.saves,
                savesChange: changeFor(window, totals.saves, previousStats.saves),
            },

            topCities: facets.cities,
            propertyTypes: facets.propertyTypes,
            listingTypes: facets.listingTypes,
            priceByListingType: facets.priceByListingType,
            topSavedProperties: facets.topProperties,

            demandTrend: fillSeries(facets.trend, window, {
                saves: 0,
                unsaves: 0,
            }),

            recentSaves: facets.recent,
        });
    } catch (error) {
        console.error("Get saved property demand analytics error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to retrieve saved property analytics.",
        });
    }
};
