// backend/apps/property/controllers/dashboard/visitsController.js
import VisitSession from "../../models/VisitSession.js";
import User from "../../../main/models/User.js";

import {
    bucketExpression,
    buildPagination,
    changeFor,
    currentMatch,
    fillHours,
    fillSeries,
    getPagination,
    getRangeWindow,
    hourExpression,
    isBotRequest,
    previousMatch,
    rate,
    round,
    startOfDay,
} from "../../../main/utils/analytics.js";

const MAX_COUNTED_INTERVAL_SECONDS = 45;
const SESSION_TIMEOUT_MINUTES = 30;
const ACTIVE_WINDOW_SECONDS = 90;
const MAX_PAGE_HISTORY = 200;

const VISITOR_FILTERS = ["all", "registered", "anonymous", "active"];

const isValidVisitorId = (visitorId) =>
    typeof visitorId === "string" &&
    visitorId.length >= 10 &&
    visitorId.length <= 100;

const sanitizePage = (page) =>
    typeof page === "string" && page.startsWith("/") && !page.startsWith("//")
        ? page.slice(0, 300)
        : "";

// "/properties?city=Agadir" -> "/properties"
const stripQuery = (pathExpression) => ({
    $arrayElemAt: [
        { $split: [{ $ifNull: [pathExpression, ""] }, "?"] },
        0,
    ],
});

const getSessionTimeoutStart = (now = new Date()) =>
    new Date(now.getTime() - SESSION_TIMEOUT_MINUTES * 60 * 1000);

// POST /api/property/dashboard/visits/heartbeat
export const trackVisit = async (req, res) => {
    try {
        const { visitorId, page } = req.body;

        if (!isValidVisitorId(visitorId)) {
            return res.status(400).json({
                success: false,
                message: "A valid visitor ID is required.",
            });
        }

        if (isBotRequest(req)) {
            return res.status(200).json({ success: true, ignored: true });
        }

        const now = new Date();

        let user = null;

        if (req.user?.userId) {
            user = await User.findById(req.user.userId)
                .select("_id firstName lastName email")
                .lean();
        }

        const fullName = user
            ? `${user.firstName || ""} ${user.lastName || ""}`.trim()
            : "";

        const currentPage = sanitizePage(page);

        // A session ends after 30 minutes of inactivity (not 30 minutes
        // after it started), matching common analytics tools.
        let session = await VisitSession.findOne({
            visitorId,
            lastActivityAt: { $gte: getSessionTimeoutStart(now) },
        }).sort({ lastActivityAt: -1 });

        if (!session) {
            session = await VisitSession.create({
                visitorId,
                userId: user?._id || null,
                fullName,
                email: user?.email || "",
                startedAt: now,
                lastActivityAt: now,
                lastHeartbeatAt: now,
                activeSeconds: 0,
                pageViews: 1,
                lastPage: currentPage,
                pageHistory: currentPage
                    ? [
                        {
                            path: currentPage,
                            visitedAt: now,
                            lastSeenAt: now,
                            durationSeconds: 0,
                        },
                    ]
                    : [],
            });

            return res.status(200).json({
                success: true,
                sessionId: session._id,
            });
        }

        const previousHeartbeat = session.lastHeartbeatAt;

        const elapsedSeconds = previousHeartbeat
            ? Math.floor((now.getTime() - previousHeartbeat.getTime()) / 1000)
            : 0;

        // Long gaps (tab hidden, computer asleep) are not counted as activity.
        const isCountedInterval =
            elapsedSeconds > 0 &&
            elapsedSeconds <= MAX_COUNTED_INTERVAL_SECONDS;

        if (isCountedInterval) {
            session.activeSeconds += elapsedSeconds;
        }

        // Associate anonymous browsing with the authenticated user.
        if (user) {
            session.userId = user._id;
            session.fullName = fullName;
            session.email = user.email || "";
        }

        if (!session.pageHistory) {
            session.pageHistory = [];
        }

        const lastHistoryEntry =
            session.pageHistory[session.pageHistory.length - 1];

        if (currentPage && currentPage !== session.lastPage) {
            if (lastHistoryEntry) {
                lastHistoryEntry.lastSeenAt = previousHeartbeat || now;

                if (isCountedInterval) {
                    lastHistoryEntry.durationSeconds += elapsedSeconds;
                }
            }

            session.pageHistory.push({
                path: currentPage,
                visitedAt: now,
                lastSeenAt: now,
                durationSeconds: 0,
            });

            session.pageViews += 1;
            session.lastPage = currentPage;
        } else if (lastHistoryEntry) {
            lastHistoryEntry.lastSeenAt = now;

            if (isCountedInterval) {
                lastHistoryEntry.durationSeconds += elapsedSeconds;
            }
        } else if (currentPage) {
            session.pageHistory.push({
                path: currentPage,
                visitedAt: now,
                lastSeenAt: now,
                durationSeconds: 0,
            });

            session.pageViews = Math.max(session.pageViews || 0, 1);
            session.lastPage = currentPage;
        }

        // Prevent unbounded document growth on very long sessions.
        if (session.pageHistory.length > MAX_PAGE_HISTORY) {
            session.pageHistory.splice(
                0,
                session.pageHistory.length - MAX_PAGE_HISTORY
            );
        }

        session.lastActivityAt = now;
        session.lastHeartbeatAt = now;

        await session.save();

        return res.status(200).json({
            success: true,
            sessionId: session._id,
        });
    } catch (error) {
        console.error("Track visit error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to track visit.",
        });
    }
};

// POST /api/property/dashboard/visits/end
export const endVisit = async (req, res) => {
    try {
        const { visitorId } = req.body;

        if (!isValidVisitorId(visitorId)) {
            return res.status(400).json({
                success: false,
                message: "A valid visitor ID is required.",
            });
        }

        // Best-effort activity marker. Elapsed time is recorded by heartbeats.
        await VisitSession.findOneAndUpdate(
            {
                visitorId,
                lastActivityAt: { $gte: getSessionTimeoutStart() },
            },
            { $set: { lastActivityAt: new Date() } },
            { sort: { lastActivityAt: -1 } }
        );

        return res.status(200).json({ success: true });
    } catch (error) {
        console.error("End visit error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to end visit.",
        });
    }
};

// GET /api/property/dashboard/visits?range=30d&page=1&limit=10&filter=all
export const getVisitAnalytics = async (req, res) => {
    try {
        const now = new Date();
        const window = getRangeWindow(req.query.range);

        const { page, limit, skip } = getPagination(req.query, {
            defaultLimit: 10,
            maxLimit: 50,
        });

        const visitorFilter = VISITOR_FILTERS.includes(req.query.filter)
            ? req.query.filter
            : "all";

        const sessionMatch = currentMatch(window, "startedAt");
        const previousSessionMatch = previousMatch(window, "startedAt");

        const activeThreshold = new Date(
            now.getTime() - ACTIVE_WINDOW_SECONDS * 1000
        );

        const listFilter = { ...sessionMatch };

        if (visitorFilter === "registered") listFilter.userId = { $ne: null };
        if (visitorFilter === "anonymous") listFilter.userId = null;
        if (visitorFilter === "active") {
            listFilter.lastActivityAt = { $gte: activeThreshold };
        }

        const [
            [facets],
            previousTotals,
            activeNow,
            todayTotals,
            visitors,
            totalVisitors,
        ] = await Promise.all([
            VisitSession.aggregate([
                { $match: sessionMatch },
                {
                    $facet: {
                        totals: [
                            {
                                $group: {
                                    _id: null,
                                    sessions: { $sum: 1 },
                                    visitors: { $addToSet: "$visitorId" },
                                    users: { $addToSet: "$userId" },
                                    registeredSessions: {
                                        $sum: {
                                            $cond: [
                                                { $ifNull: ["$userId", false] },
                                                1,
                                                0,
                                            ],
                                        },
                                    },
                                    activeSeconds: {
                                        $sum: { $ifNull: ["$activeSeconds", 0] },
                                    },
                                    pageViews: {
                                        $sum: { $ifNull: ["$pageViews", 0] },
                                    },
                                    bounces: {
                                        $sum: {
                                            $cond: [
                                                {
                                                    $lte: [
                                                        { $ifNull: ["$pageViews", 0] },
                                                        1,
                                                    ],
                                                },
                                                1,
                                                0,
                                            ],
                                        },
                                    },
                                },
                            },
                            {
                                $project: {
                                    _id: 0,
                                    sessions: 1,
                                    registeredSessions: 1,
                                    activeSeconds: 1,
                                    pageViews: 1,
                                    bounces: 1,
                                    uniqueVisitors: { $size: "$visitors" },
                                    registeredUsers: {
                                        $size: {
                                            $setDifference: ["$users", [null]],
                                        },
                                    },
                                },
                            },
                        ],

                        trend: [
                            {
                                $group: {
                                    _id: bucketExpression("$startedAt", window.unit),
                                    sessions: { $sum: 1 },
                                    visitors: { $addToSet: "$visitorId" },
                                    activeSeconds: {
                                        $sum: { $ifNull: ["$activeSeconds", 0] },
                                    },
                                },
                            },
                            {
                                $project: {
                                    _id: 0,
                                    date: "$_id",
                                    sessions: 1,
                                    activeSeconds: 1,
                                    uniqueVisitors: { $size: "$visitors" },
                                },
                            },
                        ],

                        hourly: [
                            {
                                $group: {
                                    _id: hourExpression("$startedAt"),
                                    sessions: { $sum: 1 },
                                },
                            },
                            { $project: { _id: 0, hour: "$_id", sessions: 1 } },
                        ],

                        topPages: [
                            { $unwind: "$pageHistory" },
                            {
                                $group: {
                                    _id: stripQuery("$pageHistory.path"),
                                    views: { $sum: 1 },
                                    visitors: { $addToSet: "$visitorId" },
                                    durationSeconds: {
                                        $sum: {
                                            $ifNull: ["$pageHistory.durationSeconds", 0],
                                        },
                                    },
                                },
                            },
                            { $match: { _id: { $nin: ["", null] } } },
                            { $sort: { views: -1 } },
                            { $limit: 10 },
                            {
                                $project: {
                                    _id: 0,
                                    path: "$_id",
                                    views: 1,
                                    durationSeconds: 1,
                                    uniqueVisitors: { $size: "$visitors" },
                                    avgDurationSeconds: {
                                        $round: [
                                            { $divide: ["$durationSeconds", "$views"] },
                                            0,
                                        ],
                                    },
                                },
                            },
                        ],

                        entryPages: [
                            {
                                $project: {
                                    path: stripQuery({
                                        $arrayElemAt: ["$pageHistory.path", 0],
                                    }),
                                },
                            },
                            { $match: { path: { $nin: ["", null] } } },
                            { $group: { _id: "$path", sessions: { $sum: 1 } } },
                            { $sort: { sessions: -1 } },
                            { $limit: 8 },
                            { $project: { _id: 0, path: "$_id", sessions: 1 } },
                        ],

                        exitPages: [
                            { $project: { path: stripQuery("$lastPage") } },
                            { $match: { path: { $nin: ["", null] } } },
                            { $group: { _id: "$path", sessions: { $sum: 1 } } },
                            { $sort: { sessions: -1 } },
                            { $limit: 8 },
                            { $project: { _id: 0, path: "$_id", sessions: 1 } },
                        ],
                    },
                },
            ]),

            previousSessionMatch
                ? VisitSession.aggregate([
                    { $match: previousSessionMatch },
                    {
                        $group: {
                            _id: null,
                            sessions: { $sum: 1 },
                            visitors: { $addToSet: "$visitorId" },
                            activeSeconds: {
                                $sum: { $ifNull: ["$activeSeconds", 0] },
                            },
                            bounces: {
                                $sum: {
                                    $cond: [
                                        { $lte: [{ $ifNull: ["$pageViews", 0] }, 1] },
                                        1,
                                        0,
                                    ],
                                },
                            },
                        },
                    },
                    {
                        $project: {
                            _id: 0,
                            sessions: 1,
                            activeSeconds: 1,
                            bounces: 1,
                            uniqueVisitors: { $size: "$visitors" },
                        },
                    },
                ])
                : Promise.resolve([]),

            VisitSession.countDocuments({
                lastActivityAt: { $gte: activeThreshold },
            }),

            VisitSession.aggregate([
                { $match: { startedAt: { $gte: startOfDay(now) } } },
                {
                    $group: {
                        _id: null,
                        sessions: { $sum: 1 },
                        activeSeconds: {
                            $sum: { $ifNull: ["$activeSeconds", 0] },
                        },
                    },
                },
            ]),

            VisitSession.find(listFilter)
                .sort({ startedAt: -1 })
                .skip(skip)
                .limit(limit)
                .select(
                    "visitorId userId fullName email startedAt lastActivityAt activeSeconds pageViews lastPage pageHistory"
                )
                .lean(),

            VisitSession.countDocuments(listFilter),
        ]);

        const totals = facets.totals[0] || {
            sessions: 0,
            registeredSessions: 0,
            activeSeconds: 0,
            pageViews: 0,
            bounces: 0,
            uniqueVisitors: 0,
            registeredUsers: 0,
        };

        const previous = previousTotals[0] || {
            sessions: 0,
            activeSeconds: 0,
            bounces: 0,
            uniqueVisitors: 0,
        };

        const today = todayTotals[0] || { sessions: 0, activeSeconds: 0 };

        const avgSessionSeconds = totals.sessions
            ? Math.round(totals.activeSeconds / totals.sessions)
            : 0;

        const previousAvgSessionSeconds = previous.sessions
            ? Math.round(previous.activeSeconds / previous.sessions)
            : 0;

        const bounceRate = rate(totals.bounces, totals.sessions);
        const previousBounceRate = rate(previous.bounces, previous.sessions);

        return res.status(200).json({
            success: true,
            range: window.range,

            summary: {
                totalVisits: totals.sessions,
                uniqueVisitors: totals.uniqueVisitors,
                registeredUsers: totals.registeredUsers,
                registeredShare: rate(totals.registeredSessions, totals.sessions),
                totalActiveSeconds: totals.activeSeconds,
                avgSessionSeconds,
                pagesPerSession: totals.sessions
                    ? round(totals.pageViews / totals.sessions)
                    : 0,
                bounceRate,
                activeNow,
                dailyVisits: today.sessions,
                dailyActiveSeconds: today.activeSeconds,

                visitsChange: changeFor(window, totals.sessions, previous.sessions),
                uniqueVisitorsChange: changeFor(
                    window,
                    totals.uniqueVisitors,
                    previous.uniqueVisitors
                ),
                avgSessionChange: changeFor(
                    window,
                    avgSessionSeconds,
                    previousAvgSessionSeconds
                ),
                bounceRateChange: changeFor(window, bounceRate, previousBounceRate),
            },

            trend: fillSeries(facets.trend, window, {
                sessions: 0,
                uniqueVisitors: 0,
                activeSeconds: 0,
            }),

            hourly: fillHours(facets.hourly, "sessions"),
            topPages: facets.topPages,
            entryPages: facets.entryPages,
            exitPages: facets.exitPages,

            visitors: visitors.map((visitor) => ({
                ...visitor,
                isActive: visitor.lastActivityAt >= activeThreshold,
                pageHistory: visitor.pageHistory || [],
            })),

            pagination: buildPagination(page, limit, totalVisitors),
        });
    } catch (error) {
        console.error("Get visit analytics error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to retrieve visit analytics.",
        });
    }
};
