// backend/apps/vehicles/models/VehicleReview.js
//
// Review of a vehicle publisher (owner, agency or showroom), same rules as
// the property reviews: 1 to 5 stars, a comment, one review per person and
// publisher. Kept apart from the property reviews: a good landlord is not
// always a good car seller.

import mongoose from "mongoose";

const vehicleReviewSchema = new mongoose.Schema(
    {
        reviewer: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        reviewedUser: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        rating: {
            type: Number,
            required: true,
            min: 1,
            max: 5,
            validate: { validator: Number.isInteger, message: "Rating must be a whole number between 1 and 5." },
        },
        comment: { type: String, required: true, trim: true, minlength: 3, maxlength: 1000 },
    },
    { timestamps: true },
);

// One review per person and publisher.
vehicleReviewSchema.index({ reviewer: 1, reviewedUser: 1 }, { unique: true });
vehicleReviewSchema.index({ reviewedUser: 1, createdAt: -1 });

const VehicleReview = mongoose.models.VehicleReview || mongoose.model("VehicleReview", vehicleReviewSchema);

export default VehicleReview;
