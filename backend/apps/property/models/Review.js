
import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema(
    {
        reviewer: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },

        reviewedUser: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },

        rating: {
            type: Number,
            required: true,
            min: 1,
            max: 5,
            validate: {
                validator: Number.isInteger,
                message: "Rating must be a whole number between 1 and 5.",
            },
        },

        comment: {
            type: String,
            required: true,
            trim: true,
            minlength: 3,
            maxlength: 1000,
        },
    },
    {
        timestamps: true,
    }
);

// A user can review a publisher only once.
reviewSchema.index(
    { reviewer: 1, reviewedUser: 1 },
    { unique: true }
);

reviewSchema.index({ reviewedUser: 1, createdAt: -1 });

const Review = mongoose.model("Review", reviewSchema);

export default Review;
