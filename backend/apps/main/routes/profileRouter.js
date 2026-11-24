
// backend/apps/main/routes/profileRouter.js
import { Router } from "express";

import authMiddleware from "../middleware/authMiddleware.js";

import {
    updateMyProfile,
    getMyProfile,
    updateMyPassword,
    getMyNotificationPreferences,
    updateMyNotificationPreferences,
    updateMyLanguage,
} from "../controllers/account/profileController.js";

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

// Public profiles and user reviews are served by each service
// (property: /api/property/profiles/:userId).

export default router;
