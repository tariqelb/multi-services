// backend/controllers/dashboard/adminController.js

import mongoose from "mongoose";

import User from "../../DatabaseModels/Schema/User.js";
import Property from "../../DatabaseModels/Schema/Property.js";
import SavedProperty from "../../DatabaseModels/Schema/SavedProperty.js";
import Feedback from "../../DatabaseModels/Schema/Feedback.js";
import PropertyAlert from "../../DatabaseModels/Schema/PropertyAlert.js";

import {
    DAY_MS,
    bucketExpression,
    changeFor,
    currentMatch,
    fillSeries,
    getDateKey,
    getRangeWindow,
    percentChange,
    previousMatch,
    rate,
    round,
} from "../../utils/analytics.js";

const getValidUserId = (userId) => mongoose.Types.ObjectId.isValid(userId);

const getAdminUserOrRespond = async (userId, res) => {
    if (!getValidUserId(userId)) {
        res.status(400).json({
            success: false,
            message: "Invalid user ID.",
        });
        return null;
    }

    const user = await User.findById(userId)
        .select(
            [
                "firstName",
                "lastName",
                "email",
                "role",
                "accountStatus",
                "language",
                "emailVerified",
                "phoneNumber",
                "phoneVerified",
                "address",
                "bio",
                "profileImage",
                "notificationPreferences",
                "deletionRequestedAt",
                "scheduledDeletionAt",
                "createdAt",
                "updatedAt",
            ].join(" ")
        )
        .lean();

    if (!user) {
        res.status(404).json({
            success: false,
            message: "User not found.",
        });
        return null;
    }

    return user;
};

// GET /dashboard/users/:userId
export const getAdminUserDetails = async (req, res) => {
    try {
        const user = await getAdminUserOrRespond(req.params.userId, res);

        if (!user) return;

        const userId = new mongoose.Types.ObjectId(req.params.userId);

        const [
            totalPublications,
            availablePublications,
            activeAlerts,
            archivedAlerts,
            savedProperties,
            totalFeedback,
            openFeedback,
            inProgressFeedback,
            resolvedFeedback,
            closedFeedback,
        ] = await Promise.all([
            Property.countDocuments({ userId }),
            Property.countDocuments({ userId, status: "Available" }),
            PropertyAlert.countDocuments({ user: userId, isArchived: false }),
            PropertyAlert.countDocuments({ user: userId, isArchived: true }),
            SavedProperty.countDocuments({ userId, isSaved: true }),
            Feedback.countDocuments({ userId }),
            Feedback.countDocuments({ userId, status: "open" }),
            Feedback.countDocuments({ userId, status: "in_progress" }),
            Feedback.countDocuments({ userId, status: "resolved" }),
            Feedback.countDocuments({ userId, status: "closed" }),
        ]);

        return res.status(200).json({
            success: true,
            user,
            statistics: {
                totalPublications,
                availablePublications,
                activeAlerts,
                archivedAlerts,
                savedProperties,
                totalFeedback,
                feedbackByStatus: {
                    open: openFeedback,
                    inProgress: inProgressFeedback,
                    resolved: resolvedFeedback,
                    closed: closedFeedback,
                },
            },
        });
    } catch (error) {
        console.error("Get admin user details error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to retrieve user details.",
        });
    }
};

// GET /dashboard/users/:userId/publications
export const getAdminUserPublications = async (req, res) => {
    try {
        const user = await getAdminUserOrRespond(req.params.userId, res);

        if (!user) return;

        const publications = await Property.find({
            userId: req.params.userId,
        })
            .sort({ createdAt: -1 })
            .lean();

        return res.status(200).json({
            success: true,
            count: publications.length,
            publications,
        });
    } catch (error) {
        console.error("Get admin user publications error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to retrieve user publications.",
        });
    }
};

// GET /dashboard/users/:userId/alerts
export const getAdminUserAlerts = async (req, res) => {
    try {
        const user = await getAdminUserOrRespond(req.params.userId, res);

        if (!user) return;

        const alerts = await PropertyAlert.find({
            user: req.params.userId,
        })
            .sort({ createdAt: -1 })
            .lean();

        return res.status(200).json({
            success: true,
            count: alerts.length,
            alerts,
        });
    } catch (error) {
        console.error("Get admin user alerts error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to retrieve user alerts.",
        });
    }
};

// GET /dashboard/users/:userId/saved-properties
export const getAdminUserSavedProperties = async (req, res) => {
    try {
        const user = await getAdminUserOrRespond(req.params.userId, res);

        if (!user) return;

        const savedProperties = await SavedProperty.find({
            userId: req.params.userId,
            isSaved: true,
        })
            .populate({
                path: "propertyId",
                select: "title price listingType propertyType city neighborhood status images",
            })
            .sort({ savedAt: -1 })
            .lean();

        return res.status(200).json({
            success: true,
            count: savedProperties.length,
            savedProperties,
        });
    } catch (error) {
        console.error("Get admin user saved properties error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to retrieve saved properties.",
        });
    }
};

// GET /dashboard/users/:userId/feedback
export const getAdminUserFeedback = async (req, res) => {
    try {
        const user = await getAdminUserOrRespond(req.params.userId, res);

        if (!user) return;

        const feedback = await Feedback.find({
            userId: req.params.userId,
        })
            .select(
                "email type subject description priority reportedUser pageUrl status attachments createdAt updatedAt"
            )
            .sort({ createdAt: -1 })
            .lean();

        return res.status(200).json({
            success: true,
            count: feedback.length,
            feedback,
        });
    } catch (error) {
        console.error("Get admin user feedback error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to retrieve user feedback.",
        });
    }
};

// -----------------------------------------------------------------------------
// Users list + user statistics
// -----------------------------------------------------------------------------

const buildUsersSummary = (users) => {
    const now = Date.now();
    const signupWindow = getRangeWindow("30d");

    const last7Days = now - 7 * DAY_MS;
    const last30Days = now - 30 * DAY_MS;
    const previous30Days = now - 60 * DAY_MS;

    const roles = new Map();
    const statuses = new Map();
    const signupsByDay = new Map();

    const summary = {
        totalUsers: users.length,
        activeUsers: 0,
        suspendedUsers: 0,
        emailVerified: 0,
        phoneVerified: 0,
        whatsappVerified: 0,
        pendingDeletion: 0,
        publishers: 0,
        activePublishers: 0,
        savers: 0,
        reporters: 0,
        newLast7Days: 0,
        newLast30Days: 0,
        newPrevious30Days: 0,
    };

    for (const user of users) {
        const role = String(user.role || "user").toLowerCase();
        const status = String(user.accountStatus || "active").toLowerCase();

        roles.set(role, (roles.get(role) || 0) + 1);
        statuses.set(status, (statuses.get(status) || 0) + 1);

        if (status === "active") summary.activeUsers += 1;
        if (status === "suspended") summary.suspendedUsers += 1;
        if (user.emailVerified) summary.emailVerified += 1;
        if (user.phoneVerified) summary.phoneVerified += 1;
        if (user.notificationPreferences?.whatsapp?.verified) {
            summary.whatsappVerified += 1;
        }
        if (user.deletionRequestedAt) summary.pendingDeletion += 1;
        if (user.publishedProperties > 0) summary.publishers += 1;
        if (user.activeProperties > 0) summary.activePublishers += 1;
        if (user.savedProperties > 0) summary.savers += 1;
        if (user.reports > 0) summary.reporters += 1;

        const createdAt = user.createdAt
            ? new Date(user.createdAt).getTime()
            : null;

        if (!createdAt) continue;

        if (createdAt >= last7Days) summary.newLast7Days += 1;

        if (createdAt >= last30Days) {
            summary.newLast30Days += 1;
        } else if (createdAt >= previous30Days) {
            summary.newPrevious30Days += 1;
        }

        if (createdAt >= signupWindow.start.getTime()) {
            const key = getDateKey(new Date(createdAt));
            signupsByDay.set(key, (signupsByDay.get(key) || 0) + 1);
        }
    }

    const toList = (map) =>
        Array.from(map.entries())
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value);

    return {
        ...summary,
        emailVerifiedRate: rate(summary.emailVerified, summary.totalUsers),
        phoneVerifiedRate: rate(summary.phoneVerified, summary.totalUsers),
        whatsappVerifiedRate: rate(summary.whatsappVerified, summary.totalUsers),
        publisherRate: rate(summary.publishers, summary.totalUsers),
        saverRate: rate(summary.savers, summary.totalUsers),
        newUsersChange: percentChange(
            summary.newLast30Days,
            summary.newPrevious30Days
        ),
        roles: toList(roles),
        statuses: toList(statuses),
        signupTrend: fillSeries(
            Array.from(signupsByDay.entries()).map(([date, users]) => ({
                date,
                users,
            })),
            signupWindow,
            { users: 0 }
        ),
    };
};

// GET /api/dashboard/users
export const getAdminUsers = async (req, res) => {
    try {
        const users = await User.aggregate([
            {
                $lookup: {
                    from: Property.collection.name,
                    let: { userId: "$_id" },
                    pipeline: [
                        { $match: { $expr: { $eq: ["$userId", "$$userId"] } } },
                        {
                            $group: {
                                _id: null,
                                total: { $sum: 1 },
                                available: {
                                    $sum: {
                                        $cond: [{ $eq: ["$status", "Available"] }, 1, 0],
                                    },
                                },
                            },
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
                                    $and: [
                                        { $eq: ["$userId", "$$userId"] },
                                        { $eq: ["$isSaved", true] },
                                    ],
                                },
                            },
                        },
                        { $count: "count" },
                    ],
                    as: "savedStats",
                },
            },
            {
                $lookup: {
                    from: Feedback.collection.name,
                    let: { userId: "$_id" },
                    pipeline: [
                        { $match: { $expr: { $eq: ["$userId", "$$userId"] } } },
                        { $count: "count" },
                    ],
                    as: "feedbackStats",
                },
            },
            {
                $addFields: {
                    publishedProperties: {
                        $ifNull: [{ $arrayElemAt: ["$propertyStats.total", 0] }, 0],
                    },
                    activeProperties: {
                        $ifNull: [{ $arrayElemAt: ["$propertyStats.available", 0] }, 0],
                    },
                    savedProperties: {
                        $ifNull: [{ $arrayElemAt: ["$savedStats.count", 0] }, 0],
                    },
                    reports: {
                        $ifNull: [{ $arrayElemAt: ["$feedbackStats.count", 0] }, 0],
                    },
                },
            },
            {
                $project: {
                    password: 0,
                    emailVerificationCodeHash: 0,
                    emailVerificationExpires: 0,
                    phoneVerificationSessionId: 0,
                    phoneVerificationExpires: 0,
                    "notificationPreferences.whatsapp.verificationSessionId": 0,
                    "notificationPreferences.whatsapp.verificationExpires": 0,
                    propertyStats: 0,
                    savedStats: 0,
                    feedbackStats: 0,
                    profileImagePublicId: 0,
                },
            },
            { $sort: { createdAt: -1 } },
        ]);

        return res.status(200).json({
            success: true,
            count: users.length,
            summary: buildUsersSummary(users),
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

// -----------------------------------------------------------------------------
// Property demand (alerts) + supply comparison
// -----------------------------------------------------------------------------

const normalizedCity = {
    $trim: { input: { $toString: { $ifNull: ["$city", ""] } } },
};

// GET /api/dashboard/property-demand?range=30d
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
