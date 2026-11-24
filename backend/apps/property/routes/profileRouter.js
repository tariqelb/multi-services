// backend/apps/property/routes/profileRouter.js
//
// /api/property/profiles — public profile of a publisher and their reviews.

import { Router } from "express";

import authMiddleware from "../../main/middleware/authMiddleware.js";

import { getPublicProfile } from "../controllers/profiles/publicProfileController.js";
import { getUserReviews, createUserReview } from "../controllers/reviews/userReviewController.js";

const router = Router();

// Public user profile
router.get("/:userId", getPublicProfile);

// User reviews
router.get("/:userId/reviews", getUserReviews);

// Create a review
router.post("/:userId/reviews", authMiddleware, createUserReview);

export default router;
