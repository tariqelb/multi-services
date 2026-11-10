//app/backend/routes/profile/profileRouter.js
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

// Public publisher profile.
// This route is accessible without authentication.
router.get("/:userId", getPublicProfile);

// Private profile routes.
router.put("/me", authMiddleware, updateMyProfile);

router.get("/me", authMiddleware, getMyProfile);

router.patch(
    "/me/password",
    authMiddleware,
    updateMyPassword
);

// Notification preferences.
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

// Language preference.
router.patch(
    "/me/language",
    authMiddleware,
    updateMyLanguage
);


router.get("/:userId/reviews", getUserReviews);
router.post("/:userId/reviews", authMiddleware, createUserReview);


export default router;