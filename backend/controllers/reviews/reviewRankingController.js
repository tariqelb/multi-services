// app/backend/controllers/reviews/reviewRankingController.js
//
// GET /api/reviews/users
//   q        name to look for (first name, last name or both, any order)
//   page     1..
//   limit    1..50 (default 20)
//
// Users ranked best first by their reviews. The order uses a weighted score
// (Bayesian average) so one 5-star review does not beat forty 4.8-star ones:
//
//   score = (average * reviews + siteAverage * PRIOR_REVIEWS) / (reviews + PRIOR_REVIEWS)
//
// The average shown to people is always the real one. Without q, only users
// with at least one review are listed; with q, matching users without reviews
// are listed after the reviewed ones. Suspended accounts and accounts waiting
// for deletion never appear (same rule as the profile reviews page).

import Review from "../../DatabaseModels/Schema/Review.js";
import User from "../../DatabaseModels/Schema/User.js";

export const PRIOR_REVIEWS = 3;
const MAX_LIMIT = 50;
const COMMENT_PREVIEW = 160;

const VISIBLE_USER = { accountStatus: "active", deletionRequestedAt: null };

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export function parseRankingQuery(query = {}) {
    const q = String(query.q ?? "").trim().replace(/\s+/g, " ").slice(0, 80);
    const page = Math.max(1, Number.parseInt(query.page, 10) || 1);
    const limit = Math.min(MAX_LIMIT, Math.max(1, Number.parseInt(query.limit, 10) || 20));
    return { q, page, limit };
}

/** Every word must be found in the first or the last name. */
export function nameFilter(q) {
    const words = q.split(" ").filter(Boolean).slice(0, 5);
    if (!words.length) return {};
    return {
        $and: words.map((word) => {
            const pattern = new RegExp(escapeRegex(word), "i");
            return { $or: [{ firstName: pattern }, { lastName: pattern }] };
        }),
    };
}

/** Same formula as the pipeline, for tests and documentation. */
export function weightedScore(average, count, siteAverage) {
    if (!count) return 0;
    return (average * count + siteAverage * PRIOR_REVIEWS) / (count + PRIOR_REVIEWS);
}

const scoreStage = (siteAverage) => ({
    $addFields: {
        hasReviews: { $cond: [{ $gt: ["$totalReviews", 0] }, 1, 0] },
        score: {
            $cond: [
                { $gt: ["$totalReviews", 0] },
                {
                    $divide: [
                        { $add: [{ $multiply: ["$average", "$totalReviews"] }, siteAverage * PRIOR_REVIEWS] },
                        { $add: ["$totalReviews", PRIOR_REVIEWS] },
                    ],
                },
                0,
            ],
        },
    },
});

const RANK_SORT = { hasReviews: -1, score: -1, totalReviews: -1, lastReviewAt: -1, _id: 1 };

const pageStages = ({ page, limit }) => [
    {
        $facet: {
            total: [{ $count: "count" }],
            items: [{ $sort: RANK_SORT }, { $skip: (page - 1) * limit }, { $limit: limit }],
        },
    },
];

const reviewStats = [
    { $sort: { createdAt: -1 } },
    {
        $group: {
            _id: "$reviewedUser",
            average: { $avg: "$rating" },
            totalReviews: { $sum: 1 },
            lastReviewAt: { $first: "$createdAt" },
            lastComment: { $first: "$comment" },
            five: { $sum: { $cond: [{ $gte: ["$rating", 5] }, 1, 0] } },
            low: { $sum: { $cond: [{ $lte: ["$rating", 2] }, 1, 0] } },
        },
    },
];

const USER_FIELDS = {
    firstName: 1,
    lastName: 1,
    profileImage: 1,
    emailVerified: 1,
    phoneVerified: 1,
    createdAt: 1,
};

/** Ranked list: starts from the reviews, keeps only visible users. */
export function buildRankedPipeline(criteria, siteAverage) {
    return [
        ...reviewStats,
        {
            $lookup: {
                from: User.collection.name,
                let: { userId: "$_id" },
                pipeline: [
                    { $match: { $expr: { $eq: ["$_id", "$$userId"] }, ...VISIBLE_USER } },
                    { $project: USER_FIELDS },
                ],
                as: "user",
            },
        },
        { $unwind: "$user" },
        scoreStage(siteAverage),
        ...pageStages(criteria),
    ];
}

/** Name search: starts from the users, so people without reviews are found too. */
export function buildSearchPipeline(criteria, siteAverage) {
    return [
        { $match: { ...VISIBLE_USER, ...nameFilter(criteria.q) } },
        { $project: USER_FIELDS },
        {
            $lookup: {
                from: Review.collection.name,
                let: { userId: "$_id" },
                pipeline: [{ $match: { $expr: { $eq: ["$reviewedUser", "$$userId"] } } }, ...reviewStats],
                as: "stats",
            },
        },
        {
            $project: {
                _id: 1,
                user: Object.fromEntries(Object.keys(USER_FIELDS).map((field) => [field, `$${field}`])),
                average: { $ifNull: [{ $arrayElemAt: ["$stats.average", 0] }, 0] },
                totalReviews: { $ifNull: [{ $arrayElemAt: ["$stats.totalReviews", 0] }, 0] },
                lastReviewAt: { $ifNull: [{ $arrayElemAt: ["$stats.lastReviewAt", 0] }, null] },
                lastComment: { $ifNull: [{ $arrayElemAt: ["$stats.lastComment", 0] }, ""] },
                five: { $ifNull: [{ $arrayElemAt: ["$stats.five", 0] }, 0] },
                low: { $ifNull: [{ $arrayElemAt: ["$stats.low", 0] }, 0] },
            },
        },
        scoreStage(siteAverage),
        ...pageStages(criteria),
    ];
}

export function normalizeRankedUser(doc, rank) {
    const user = doc.user || {};
    const comment = String(doc.lastComment || "");
    return {
        id: String(doc._id),
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        profileImage: user.profileImage || "",
        emailVerified: Boolean(user.emailVerified),
        phoneVerified: Boolean(user.phoneVerified),
        memberSince: user.createdAt || null,
        averageRating: doc.totalReviews ? Number(Number(doc.average).toFixed(1)) : 0,
        totalReviews: doc.totalReviews || 0,
        fiveStarReviews: doc.five || 0,
        lowReviews: doc.low || 0,
        lastReviewAt: doc.lastReviewAt || null,
        lastComment: comment.length > COMMENT_PREVIEW ? `${comment.slice(0, COMMENT_PREVIEW).trimEnd()}…` : comment,
        rank,
    };
}

async function siteSummary() {
    const [summary] = await Review.aggregate([
        { $group: { _id: null, average: { $avg: "$rating" }, totalReviews: { $sum: 1 } } },
    ]);
    return { average: summary?.average || 0, totalReviews: summary?.totalReviews || 0 };
}

export const getReviewRanking = async (req, res) => {
    try {
        const criteria = parseRankingQuery(req.query);
        const site = await siteSummary();

        const searching = Boolean(criteria.q);
        const [facet] = searching
            ? await User.aggregate(buildSearchPipeline(criteria, site.average))
            : await Review.aggregate(buildRankedPipeline(criteria, site.average));

        const total = facet?.total?.[0]?.count || 0;
        const start = (criteria.page - 1) * criteria.limit;

        const users = (facet?.items || []).map((doc, index) =>
            // Rank is a position in the full ranking; it is not shown for name searches.
            normalizeRankedUser(doc, searching ? null : start + index + 1)
        );

        return res.status(200).json({
            success: true,
            users,
            pagination: {
                page: criteria.page,
                limit: criteria.limit,
                total,
                totalPages: Math.max(1, Math.ceil(total / criteria.limit)),
            },
            summary: {
                averageRating: Number(site.average.toFixed(1)),
                totalReviews: site.totalReviews,
            },
        });
    } catch (error) {
        console.error("[Reviews ranking] Error:", error);
        return res.status(500).json({ success: false, message: "Unable to load reviews." });
    }
};
