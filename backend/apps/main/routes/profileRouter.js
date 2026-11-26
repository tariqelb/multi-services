
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
    getMyPublicVisibility,
    updateMyPublicVisibility,
    getMySocialLinks,
    updateMySocialLinks,
} from "../controllers/account/profileController.js";
import { getMyProfessionalProfile, updateMyProfessionalProfile } from "../controllers/account/professionalProfileController.js";

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

// What visitors see on my public profiles (email, phone, WhatsApp, address, requests)
router.get("/me/public-visibility", authMiddleware, getMyPublicVisibility);
router.put("/me/public-visibility", authMiddleware, updateMyPublicVisibility);

// Social media links, each one public or private (Settings > Social media)
router.get("/me/social-links", authMiddleware, getMySocialLinks);
router.put("/me/social-links", authMiddleware, updateMySocialLinks);

// Settings > Receive requests (requests themselves: /api/property/requests, /api/vehicles/requests)
router.get("/me/professional", authMiddleware, getMyProfessionalProfile);
router.put("/me/professional", authMiddleware, updateMyProfessionalProfile);

// Public profiles and user reviews are served by each service
// (property: /api/property/profiles/:userId).

export default router;
