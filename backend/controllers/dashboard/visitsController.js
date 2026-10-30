import mongoose from "mongoose";

import VisitSession from "../../DatabaseModels/Schema/VisitSession.js";
import User from "../../DatabaseModels/Schema/User.js";

const HEARTBEAT_INTERVAL_SECONDS = 30;
const MAX_COUNTED_INTERVAL_SECONDS = 45;
const SESSION_TIMEOUT_MINUTES = 30;

// POST /api/dashboard/visits/heartbeat
export const trackVisit = async (req, res) => {
    try {
        const { visitorId, page } = req.body;

        if (
            typeof visitorId !== "string" ||
            visitorId.length < 10 ||
            visitorId.length > 100
        ) {
            return res.status(400).json({
                success: false,
                message: "A valid visitor ID is required.",
            });
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

        const lastPage =
            typeof page === "string" &&
            page.startsWith("/") &&
            !page.startsWith("//")
                ? page.slice(0, 300)
                : "";

        let session = await VisitSession.findOne({
            visitorId,
            startedAt: {
                $gte: new Date(
                    now.getTime() -
                    SESSION_TIMEOUT_MINUTES * 60 * 1000
                ),
            },
        }).sort({ startedAt: -1 });

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
                lastPage,
            });
        } else {
            const previousHeartbeat = session.lastHeartbeatAt;
            let elapsedSeconds = 0;

            if (previousHeartbeat) {
                elapsedSeconds = Math.floor(
                    (now.getTime() -
                        previousHeartbeat.getTime()) /
                        1000
                );
            }

            // Count only recent intervals, not long idle periods.
            if (
                elapsedSeconds > 0 &&
                elapsedSeconds <= MAX_COUNTED_INTERVAL_SECONDS
            ) {
                session.activeSeconds += elapsedSeconds;
            }

            if (user) {
                // Associate anonymous browsing with the authenticated user.
                session.userId = user._id;
                session.fullName = fullName;
                session.email = user.email || "";
            }

            if (lastPage && lastPage !== session.lastPage) {
                session.pageViews += 1;
                session.lastPage = lastPage;
            }

            session.lastActivityAt = now;
            session.lastHeartbeatAt = now;

            await session.save();
        }

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

// POST /api/dashboard/visits/end
export const endVisit = async (req, res) => {
    try {
        const { visitorId } = req.body;

        if (
            typeof visitorId !== "string" ||
            visitorId.length < 10 ||
            visitorId.length > 100
        ) {
            return res.status(400).json({
                success: false,
                message: "A valid visitor ID is required.",
            });
        }

        // Do not add elapsed time here: heartbeat already records it.
        // This endpoint is only a best-effort activity marker.
        await VisitSession.updateOne(
            {
                visitorId,
                lastActivityAt: {
                    $gte: new Date(
                        Date.now() -
                        SESSION_TIMEOUT_MINUTES * 60 * 1000
                    ),
                },
            },
            {
                $set: {
                    lastActivityAt: new Date(),
                },
            },
            {
                sort: { startedAt: -1 },
            }
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

// GET /api/dashboard/visits
export const getVisitAnalytics = async (req, res) => {
    try {
        const now = new Date();

        // Daily totals use UTC calendar days.
        const startOfDay = new Date(
            Date.UTC(
                now.getUTCFullYear(),
                now.getUTCMonth(),
                now.getUTCDate()
            )
        );

        const [
            totalVisits,
            dailyVisits,
            totalActiveSeconds,
            dailyActiveSeconds,
            visitors,
        ] = await Promise.all([
            VisitSession.countDocuments(),

            VisitSession.countDocuments({
                startedAt: { $gte: startOfDay },
            }),

            VisitSession.aggregate([
                {
                    $group: {
                        _id: null,
                        total: { $sum: "$activeSeconds" },
                    },
                },
            ]),

            VisitSession.aggregate([
                {
                    $match: {
                        startedAt: { $gte: startOfDay },
                    },
                },
                {
                    $group: {
                        _id: null,
                        total: { $sum: "$activeSeconds" },
                    },
                },
            ]),

            VisitSession.find()
                .sort({ startedAt: -1 })
                .limit(100)
                .select(
                    "visitorId userId fullName email startedAt lastActivityAt activeSeconds pageViews lastPage"
                )
                .lean(),
        ]);

        const totalTime =
            totalActiveSeconds[0]?.total || 0;

        const dailyTime =
            dailyActiveSeconds[0]?.total || 0;

        return res.status(200).json({
            success: true,
            summary: {
                totalVisits,
                dailyVisits,
                totalActiveSeconds: totalTime,
                dailyActiveSeconds: dailyTime,
            },
            visitors,
        });
    } catch (error) {
        console.error("Get visit analytics error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to retrieve visit analytics.",
        });
    }
};