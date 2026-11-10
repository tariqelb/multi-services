
import mongoose from "mongoose";

import Review from "../../DatabaseModels/Schema/Review.js";
import User from "../../DatabaseModels/Schema/User.js";

const getRatingSummary = async (userId) => {
    const [summary] = await Review.aggregate([
        {
            $match: {
                reviewedUser: new mongoose.Types.ObjectId(userId),
            },
        },
        {
            $group: {
                _id: null,
                averageRating: { $avg: "$rating" },
                totalReviews: { $sum: 1 },
            },
        },
    ]);

    return {
        averageRating: summary
            ? Number(summary.averageRating.toFixed(1))
            : 0,
        totalReviews: summary?.totalReviews || 0,
    };
};

export const getUserReviews = async (req, res) => {
    try {
        const { userId } = req.params;

        if (!mongoose.isValidObjectId(userId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid user ID.",
            });
        }

        const user = await User.findOne({
            _id: userId,
            accountStatus: "active",
            deletionRequestedAt: null,
        }).select("_id");

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "Publisher not found.",
            });
        }

        const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
        const limit = Math.min(
            50,
            Math.max(1, Number.parseInt(req.query.limit, 10) || 20)
        );

        const skip = (page - 1) * limit;

        const [reviews, totalReviews, rating] = await Promise.all([
            Review.find({ reviewedUser: userId })
                .populate("reviewer", "firstName lastName profileImage")
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),

            Review.countDocuments({ reviewedUser: userId }),

            getRatingSummary(userId),
        ]);

        return res.status(200).json({
            success: true,
            reviews: reviews.map((review) => ({
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
            })),
            rating,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(totalReviews / limit),
                totalItems: totalReviews,
                hasMore: skip + reviews.length < totalReviews,
            },
        });
    } catch (error) {
        console.error("Get user reviews error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to load reviews.",
        });
    }
};

export const createUserReview = async (req, res) => {
    try {
        const { userId } = req.params;
        const reviewerId = req.user?.userId;
        const { rating, comment } = req.body;

        if (!mongoose.isValidObjectId(userId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid publisher ID.",
            });
        }

        if (!reviewerId || !mongoose.isValidObjectId(reviewerId)) {
            return res.status(401).json({
                success: false,
                message: "Authentication required.",
            });
        }

        if (String(reviewerId) === String(userId)) {
            return res.status(403).json({
                success: false,
                message: "You cannot review your own profile.",
            });
        }

        const numericRating = Number(rating);
        const cleanComment =
            typeof comment === "string" ? comment.trim() : "";

        if (
            !Number.isInteger(numericRating) ||
            numericRating < 1 ||
            numericRating > 5
        ) {
            return res.status(400).json({
                success: false,
                message: "Rating must be between 1 and 5.",
            });
        }

        if (cleanComment.length < 3 || cleanComment.length > 1000) {
            return res.status(400).json({
                success: false,
                message: "The review must contain between 3 and 1000 characters.",
            });
        }

        const [publisher, reviewer] = await Promise.all([
            User.findOne({
                _id: userId,
                accountStatus: "active",
                deletionRequestedAt: null,
            }).select("_id"),

            User.findOne({
                _id: reviewerId,
                accountStatus: "active",
                deletionRequestedAt: null,
            }).select("_id"),
        ]);

        if (!publisher) {
            return res.status(404).json({
                success: false,
                message: "Publisher not found.",
            });
        }

        if (!reviewer) {
            return res.status(403).json({
                success: false,
                message: "Your account cannot submit a review.",
            });
        }

        const review = await Review.create({
            reviewer: reviewerId,
            reviewedUser: userId,
            rating: numericRating,
            comment: cleanComment,
        });

        await review.populate(
            "reviewer",
            "firstName lastName profileImage"
        );

        const ratingSummary = await getRatingSummary(userId);

        return res.status(201).json({
            success: true,
            message: "Review submitted successfully.",
            review: {
                _id: review._id,
                rating: review.rating,
                comment: review.comment,
                createdAt: review.createdAt,
                reviewer: {
                    _id: review.reviewer._id,
                    firstName: review.reviewer.firstName,
                    lastName: review.reviewer.lastName,
                    profileImage: review.reviewer.profileImage || "",
                },
            },
            rating: ratingSummary,
        });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({
                success: false,
                message: "You have already reviewed this publisher.",
            });
        }

        console.error("Create user review error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to submit your review.",
        });
    }
};
