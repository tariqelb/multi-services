// backend/apps/vehicles/controllers/vehicleProfileController.js
//
// Vehicle publisher profiles and reviews (same as the property profiles):
//   GET  /api/vehicles/profiles/:userId              public profile + statistics
//   GET  /api/vehicles/profiles/:userId/vehicles     public publications (?category=car|moto, page, limit)
//   GET  /api/vehicles/profiles/:userId/reviews      reviews received (page, limit)
//   POST /api/vehicles/profiles/:userId/reviews      leave a review (logged in)
//   GET  /api/vehicles/reviews/users                 publishers ranked by their reviews (?q, page, limit)
//
// Only active accounts have a profile. A review can only be left to someone
// who has published at least one vehicle, moto or bike, never to oneself.

import mongoose from "mongoose";

import User from "../../main/models/User.js";
import Vehicle from "../models/Vehicle.js";
import VehicleDealer from "../models/VehicleDealer.js";
import VehicleReview from "../models/VehicleReview.js";
import SparePart from "../models/SparePart.js";

const VISIBLE_USER = { accountStatus: "active", deletionRequestedAt: null };
const PUBLIC_STATUSES = ["Available", "Sold", "Rented"];
const PUBLICATION_FIELDS =
    "category motoType engineCc rangeKm publisherType business.name listingType status condition make model version year mileage fuel transmission bodyType seats price rent.pricePerMonth rent.withDriver rent.insurance sale.negotiable title city neighborhood images createdAt";

export const PRIOR_REVIEWS = 3;
const COMMENT_PREVIEW = 160;

const isId = (value) => mongoose.isValidObjectId(String(value || ""));
const toObjectId = (id) => new mongoose.Types.ObjectId(String(id));
const intParam = (value, fallback, min, max) => Math.min(max, Math.max(min, Number.parseInt(value, 10) || fallback));
const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const findVisibleUser = (userId, fields = "_id") => User.findOne({ _id: userId, ...VISIBLE_USER }).select(fields).lean();

// -----------------------------------------------------------------------------
// Rating
// -----------------------------------------------------------------------------

/** { averageRating, totalReviews } of one publisher. */
export async function getVehicleRatingSummary(userId) {
    if (!isId(userId)) return { averageRating: 0, totalReviews: 0 };
    const [summary] = await VehicleReview.aggregate([
        { $match: { reviewedUser: toObjectId(userId) } },
        { $group: { _id: null, average: { $avg: "$rating" }, total: { $sum: 1 } } },
    ]);
    return {
        averageRating: summary ? Number(summary.average.toFixed(1)) : 0,
        totalReviews: summary?.total || 0,
    };
}

const publicReview = (review) => ({
    _id: review._id,
    rating: review.rating,
    comment: review.comment,
    createdAt: review.createdAt,
    updatedAt: review.updatedAt,
    reviewer: review.reviewer
        ? {
              _id: review.reviewer._id,
              firstName: review.reviewer.firstName,
              lastName: review.reviewer.lastName,
              profileImage: review.reviewer.profileImage || "",
          }
        : null,
});

// -----------------------------------------------------------------------------
// Profile
// -----------------------------------------------------------------------------

/** Counts per section (cars / motos), all and available. */
export async function getPublicationStatistics(userId, statuses = PUBLIC_STATUSES) {
    // Spare parts are counted too (Available / Sold: a part is never rented).
    const [parts] = await SparePart.aggregate([
        { $match: { userId: toObjectId(userId), status: { $in: statuses } } },
        { $group: { _id: null, total: { $sum: 1 }, available: { $sum: { $cond: [{ $eq: ["$status", "Available"] }, 1, 0] } } } },
    ]);
    const rows = await Vehicle.aggregate([
        { $match: { userId: toObjectId(userId), status: { $in: statuses } } },
        {
            $group: {
                _id: { $cond: [{ $eq: ["$category", "moto"] }, "moto", "car"] },
                total: { $sum: 1 },
                available: { $sum: { $cond: [{ $eq: ["$status", "Available"] }, 1, 0] } },
            },
        },
    ]);
    const of = (category) => rows.find((row) => row._id === category) || { total: 0, available: 0 };
    return {
        totalVehicles: of("car").total,
        availableVehicles: of("car").available,
        totalMotos: of("moto").total,
        availableMotos: of("moto").available,
        totalParts: parts?.total || 0,
        availableParts: parts?.available || 0,
    };
}

export const getVehiclePublicProfile = async (req, res) => {
    try {
        const { userId } = req.params;
        if (!isId(userId)) return res.status(400).json({ success: false, message: "Invalid user ID." });

        const user = await findVisibleUser(userId, "firstName lastName bio profileImage createdAt role emailVerified phoneVerified");
        if (!user) return res.status(404).json({ success: false, message: "Publisher not found." });

        const [statistics, rating, dealer] = await Promise.all([
            getPublicationStatistics(userId),
            getVehicleRatingSummary(userId),
            VehicleDealer.findOne({ userId }).select("type name city").lean(),
        ]);

        return res.status(200).json({
            success: true,
            user: {
                id: user._id,
                _id: user._id,
                firstName: user.firstName,
                lastName: user.lastName,
                bio: user.bio || "",
                profileImage: user.profileImage || "",
                role: user.role,
                createdAt: user.createdAt,
                emailVerified: Boolean(user.emailVerified),
                phoneVerified: Boolean(user.phoneVerified),
            },
            dealer: dealer ? { type: dealer.type, name: dealer.name, city: dealer.city || "" } : null,
            statistics: { ...statistics, totalReviews: rating.totalReviews },
            rating,
        });
    } catch (error) {
        console.error("[Vehicles] Public profile error:", error);
        return res.status(500).json({ success: false, message: "Unable to load this profile." });
    }
};

export const getVehicleProfilePublications = async (req, res) => {
    try {
        const { userId } = req.params;
        if (!isId(userId)) return res.status(400).json({ success: false, message: "Invalid user ID." });
        if (!(await findVisibleUser(userId))) return res.status(404).json({ success: false, message: "Publisher not found." });

        const page = intParam(req.query.page, 1, 1, 10000);
        const limit = intParam(req.query.limit, 12, 1, 48);
        const filter = { userId: toObjectId(userId), status: { $in: PUBLIC_STATUSES } };
        if (req.query.category === "moto") filter.category = "moto";
        else if (req.query.category === "car") filter.category = { $ne: "moto" };

        const [vehicles, total] = await Promise.all([
            Vehicle.find(filter)
                .sort({ createdAt: -1 })
                .skip((page - 1) * limit)
                .limit(limit)
                .select(PUBLICATION_FIELDS)
                .lean(),
            Vehicle.countDocuments(filter),
        ]);

        return res.status(200).json({
            success: true,
            vehicles: vehicles.map((vehicle) => ({ ...vehicle, images: (vehicle.images || []).slice(0, 1) })),
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.max(1, Math.ceil(total / limit)),
                hasMore: (page - 1) * limit + vehicles.length < total,
            },
        });
    } catch (error) {
        console.error("[Vehicles] Profile publications error:", error);
        return res.status(500).json({ success: false, message: "Unable to load the publications." });
    }
};

// -----------------------------------------------------------------------------
// Reviews of one publisher
// -----------------------------------------------------------------------------

export const getVehicleUserReviews = async (req, res) => {
    try {
        const { userId } = req.params;
        if (!isId(userId)) return res.status(400).json({ success: false, message: "Invalid user ID." });
        if (!(await findVisibleUser(userId))) return res.status(404).json({ success: false, message: "Publisher not found." });

        const page = intParam(req.query.page, 1, 1, 10000);
        const limit = intParam(req.query.limit, 20, 1, 50);
        const skip = (page - 1) * limit;

        const [reviews, rating] = await Promise.all([
            VehicleReview.find({ reviewedUser: userId })
                .populate("reviewer", "firstName lastName profileImage")
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            getVehicleRatingSummary(userId),
        ]);
        const total = rating.totalReviews;

        return res.status(200).json({
            success: true,
            reviews: reviews.map(publicReview),
            rating,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(total / limit),
                totalItems: total,
                hasMore: skip + reviews.length < total,
            },
        });
    } catch (error) {
        console.error("[Vehicles] Reviews error:", error);
        return res.status(500).json({ success: false, message: "Unable to load reviews." });
    }
};

/** Validates a review body: { data } or { error }. */
export function parseReviewInput(body = {}) {
    const rating = Number(body.rating);
    const comment = typeof body.comment === "string" ? body.comment.trim() : "";
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) return { error: "Rating must be between 1 and 5." };
    if (comment.length < 3 || comment.length > 1000) return { error: "The review must contain between 3 and 1000 characters." };
    return { data: { rating, comment } };
}

export const createVehicleUserReview = async (req, res) => {
    try {
        const { userId } = req.params;
        const reviewerId = req.user?.userId;

        if (!isId(userId)) return res.status(400).json({ success: false, message: "Invalid publisher ID." });
        if (!reviewerId || !isId(reviewerId)) return res.status(401).json({ success: false, message: "Authentication required." });
        if (String(reviewerId) === String(userId)) {
            return res.status(403).json({ success: false, message: "You cannot review your own profile." });
        }

        const { data, error } = parseReviewInput(req.body);
        if (error) return res.status(400).json({ success: false, message: error });

        const [publisher, reviewer, vehicles, parts] = await Promise.all([
            findVisibleUser(userId),
            findVisibleUser(reviewerId),
            Vehicle.countDocuments({ userId: toObjectId(userId) }),
            SparePart.countDocuments({ userId: toObjectId(userId) }),
        ]);
        const publications = vehicles + parts;
        if (!publisher) return res.status(404).json({ success: false, message: "Publisher not found." });
        if (!reviewer) return res.status(403).json({ success: false, message: "Your account cannot submit a review." });
        if (!publications) {
            return res.status(403).json({ success: false, message: "This person has not published any vehicle, moto, bike or spare part yet." });
        }

        const review = await VehicleReview.create({ reviewer: reviewerId, reviewedUser: userId, ...data });
        await review.populate("reviewer", "firstName lastName profileImage");

        return res.status(201).json({
            success: true,
            message: "Review submitted successfully.",
            review: publicReview(review.toObject()),
            rating: await getVehicleRatingSummary(userId),
        });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({ success: false, message: "You have already reviewed this publisher." });
        }
        console.error("[Vehicles] Create review error:", error);
        return res.status(500).json({ success: false, message: "Unable to submit your review." });
    }
};

// -----------------------------------------------------------------------------
// Ranking (same formula as the property reviews page)
// -----------------------------------------------------------------------------
//
// score = (average * reviews + siteAverage * PRIOR_REVIEWS) / (reviews + PRIOR_REVIEWS)
// so one 5-star review does not beat forty 4.8-star ones. The average shown
// is always the real one. Without q: publishers with at least one review.
// With q: vehicle publishers whose name matches, reviewed ones first.

export function parseRankingQuery(query = {}) {
    const q = String(query.q ?? "").trim().replace(/\s+/g, " ").slice(0, 80);
    return { q, page: intParam(query.page, 1, 1, 10000), limit: intParam(query.limit, 20, 1, 50) };
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
    { $facet: { total: [{ $count: "count" }], items: [{ $sort: RANK_SORT }, { $skip: (page - 1) * limit }, { $limit: limit }] } },
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

const USER_FIELDS = { firstName: 1, lastName: 1, profileImage: 1, emailVerified: 1, phoneVerified: 1, createdAt: 1 };

export function buildRankedPipeline(criteria, siteAverage) {
    return [
        ...reviewStats,
        {
            $lookup: {
                from: User.collection.name,
                let: { userId: "$_id" },
                pipeline: [{ $match: { $expr: { $eq: ["$_id", "$$userId"] }, ...VISIBLE_USER } }, { $project: USER_FIELDS }],
                as: "user",
            },
        },
        { $unwind: "$user" },
        scoreStage(siteAverage),
        ...pageStages(criteria),
    ];
}

export function buildSearchPipeline(criteria, siteAverage, publisherIds) {
    return [
        { $match: { _id: { $in: publisherIds }, ...VISIBLE_USER, ...nameFilter(criteria.q) } },
        { $project: USER_FIELDS },
        {
            $lookup: {
                from: VehicleReview.collection.name,
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

export const getVehicleReviewRanking = async (req, res) => {
    try {
        const criteria = parseRankingQuery(req.query);
        const [site] = await VehicleReview.aggregate([{ $group: { _id: null, average: { $avg: "$rating" }, totalReviews: { $sum: 1 } } }]);
        const siteAverage = site?.average || 0;

        const searching = Boolean(criteria.q);
        let facet;
        if (searching) {
            // Vehicle and spare part sellers.
            const [vehicleSellers, partSellers] = await Promise.all([Vehicle.distinct("userId"), SparePart.distinct("userId")]);
            const publisherIds = [...new Map([...vehicleSellers, ...partSellers].map((id) => [String(id), id])).values()];
            [facet] = await User.aggregate(buildSearchPipeline(criteria, siteAverage, publisherIds));
        } else {
            [facet] = await VehicleReview.aggregate(buildRankedPipeline(criteria, siteAverage));
        }

        const total = facet?.total?.[0]?.count || 0;
        const start = (criteria.page - 1) * criteria.limit;

        return res.status(200).json({
            success: true,
            // Rank is a position in the full ranking; not shown for name searches.
            users: (facet?.items || []).map((doc, index) => normalizeRankedUser(doc, searching ? null : start + index + 1)),
            pagination: {
                page: criteria.page,
                limit: criteria.limit,
                total,
                totalPages: Math.max(1, Math.ceil(total / criteria.limit)),
            },
            summary: { averageRating: Number(siteAverage.toFixed(1)), totalReviews: site?.totalReviews || 0 },
        });
    } catch (error) {
        console.error("[Vehicles] Reviews ranking error:", error);
        return res.status(500).json({ success: false, message: "Unable to load reviews." });
    }
};
