import express from "express";

import {
    getAdminUsers,
    getAdminUserDetails,
    getAdminUserPublications,
    getAdminUserAlerts,
    getAdminUserSavedProperties,
    getAdminUserFeedback,
    getPropertyDemandAnalytics,
} from "../../controllers/dashboard/adminController.js";


import {
    createPropertyContact,
    getPropertyContactAnalytics,
} from "../../controllers/dashboard/propertyContactsController.js";

import authMiddleware from "../../middleware/authMiddleware.js";
import adminMiddleware from "../../middleware/adminMiddleware.js";
import optionalAuthMiddleware from "../../middleware/optionalAuthMiddleware.js";

import {
    trackVisit,
    endVisit,
    getVisitAnalytics,
} from "../../controllers/dashboard/visitsController.js";

import {
    getSavedPropertyDemandAnalytics,
} from "../../controllers/dashboard/savedPropertyDemandController.js";

const router = express.Router();

// Admin user management
router.get(
    "/users",
    authMiddleware,
    adminMiddleware,
    getAdminUsers
);

router.get(
    "/users/:userId",
    authMiddleware,
    adminMiddleware,
    getAdminUserDetails
);

router.get(
    "/users/:userId/publications",
    authMiddleware,
    adminMiddleware,
    getAdminUserPublications
);

router.get(
    "/users/:userId/alerts",
    authMiddleware,
    adminMiddleware,
    getAdminUserAlerts
);

router.get(
    "/users/:userId/saved-properties",
    authMiddleware,
    adminMiddleware,
    getAdminUserSavedProperties
);

router.get(
    "/users/:userId/feedback",
    authMiddleware,
    adminMiddleware,
    getAdminUserFeedback
);

// Visitor tracking.
router.post("/visits/heartbeat", optionalAuthMiddleware, trackVisit);
router.post("/visits/end", optionalAuthMiddleware, endVisit);

// Admin analytics.
router.get(
    "/visits",
    authMiddleware,
    adminMiddleware,
    getVisitAnalytics
);

// Property contact tracking.
router.post(
    "/property-contacts",
    authMiddleware,
    createPropertyContact
);

// Admin-only contact analytics.
router.get(
    "/property-contacts",
    authMiddleware,
    adminMiddleware,
    getPropertyContactAnalytics
);
router.get(
    "/property-demand",
    authMiddleware,
    adminMiddleware,
    getPropertyDemandAnalytics
);

router.get(
    "/saved-property-demand",
    authMiddleware,
    adminMiddleware,
    getSavedPropertyDemandAnalytics
);

export default router;