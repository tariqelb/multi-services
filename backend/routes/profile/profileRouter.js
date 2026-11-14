
// app/backend/routes/profile/profileRouter.js

import { Router } from "express";

import authMiddleware from "../../middleware/authMiddleware.js";

import {
    updateMyProfile,
    getMyProfile,
    updateMyPassword,
    getMyNotificationPreferences,
    updateMyNotificationPreferences,
    updateMyLanguage,
} from "../../controllers/profile/profileController.js";

import {
    getPublicProfile,
} from "../../controllers/profile/publicProfileController.js";

import {
    getUserReviews,
    createUserReview,
} from "../../controllers/profile/reviewController.js";

const router = Router();

/*
|--------------------------------------------------------------------------
| Private profile routes
|--------------------------------------------------------------------------
| Keep these BEFORE /:userId to prevent "me" from being treated as a user ID.
*/

// Get my profile
router.get("/me", authMiddleware, getMyProfile);

// Update my profile
router.put("/me", authMiddleware, updateMyProfile);

// Update password
router.patch("/me/password", authMiddleware, updateMyPassword);

// Notification preferences
router.get(
    "/me/notification-preferences",
    authMiddleware,
    getMyNotificationPreferences
);

router.patch(
    "/me/notification-preferences",
    authMiddleware,
    updateMyNotificationPreferences
);

// Language preference
router.patch(
    "/me/language",
    authMiddleware,
    updateMyLanguage
);

/*
|--------------------------------------------------------------------------
| Public profile routes
|--------------------------------------------------------------------------
*/

// Public user profile
router.get("/:userId", getPublicProfile);

// User reviews
router.get("/:userId/reviews", getUserReviews);

// Create a review
router.post(
    "/:userId/reviews",
    authMiddleware,
    createUserReview
);

export default router;
