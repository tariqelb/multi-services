// backend/apps/property/routes/dashboardRouter.js
//
// /api/property/dashboard — property analytics and admin tools.

import express from "express";

import {
    getAdminUserPublications,
    getAdminUserAlerts,
    getAdminUserSavedProperties,
    getAdminUserFeedback,
} from "../controllers/dashboard/adminUserListingsController.js";

import { getPropertyDemandAnalytics } from "../controllers/dashboard/propertyDemandController.js";


import {
    createPropertyContact,
    getPropertyContactAnalytics,
} from "../controllers/dashboard/propertyContactsController.js";

import authMiddleware from "../../main/middleware/authMiddleware.js";
import adminAccess from "../../main/middleware/adminAccessMiddleware.js";
import optionalAuthMiddleware from "../../main/middleware/optionalAuthMiddleware.js";

import {
    trackVisit,
    endVisit,
    getVisitAnalytics,
} from "../controllers/dashboard/visitsController.js";

import {
    getSavedPropertyDemandAnalytics,
} from "../controllers/dashboard/savedPropertyDemandController.js";

import { getDashboardOverview } from "../controllers/dashboard/dashboardOverviewController.js";

import {
    getAdminPublications,
    deleteAdminPublication,
} from "../controllers/dashboard/publicationReviewController.js";

import {
    createListingContact,
    getListingContactAnalytics,
} from "../controllers/dashboard/listingContactsController.js";
import { portfolio } from "../controllers/portfolio/portfolioController.js";

const router = express.Router();


// Public contact tracking: anonymous visitors count, logged-in users are recognised.
router.post("/listing-contacts", optionalAuthMiddleware, createListingContact);

// Admin-only contact analytics.
router.get(
    "/listing-contacts",
    authMiddleware,
    adminAccess("propertyStatistics"),
    getListingContactAnalytics
);

router.get("/overview", authMiddleware, adminAccess("propertyStatistics"), getDashboardOverview);

// Admin user page, property tabs (the account itself is in main: /api/property/dashboard/users).


router.get(
    "/users/:userId/publications",
    authMiddleware,
    adminAccess("users"),
    getAdminUserPublications
);

router.get(
    "/users/:userId/alerts",
    authMiddleware,
    adminAccess("users"),
    getAdminUserAlerts
);

router.get(
    "/users/:userId/saved-properties",
    authMiddleware,
    adminAccess("users"),
    getAdminUserSavedProperties
);

router.get(
    "/users/:userId/feedback",
    authMiddleware,
    adminAccess("users"),
    getAdminUserFeedback
);

// Visitor tracking.
router.post("/visits/heartbeat", optionalAuthMiddleware, trackVisit);
router.post("/visits/end", optionalAuthMiddleware, endVisit);

// Admin analytics.
router.get(
    "/visits",
    authMiddleware,
    adminAccess("visits"),
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
    adminAccess("propertyStatistics"),
    getPropertyContactAnalytics
);
router.get(
    "/property-demand",
    authMiddleware,
    adminAccess("propertyStatistics"),
    getPropertyDemandAnalytics
);

router.get(
    "/saved-property-demand",
    authMiddleware,
    adminAccess("propertyStatistics"),
    getSavedPropertyDemandAnalytics
);

// Publication reviews: properties, establishments and roommate announcements.
router.get(
    "/publications",
    authMiddleware,
    adminAccess("propertyPublications"),
    getAdminPublications
);

router.delete(
    "/publications/:kind/:id",
    authMiddleware,
    adminAccess("propertyPublications"),
    deleteAdminPublication
);


// Portfolio review: articles and videos of profiles (same reviewers as publications).
router.get("/portfolio", authMiddleware, adminAccess("propertyPublications"), portfolio.adminList);
router.delete("/portfolio/:id", authMiddleware, adminAccess("propertyPublications"), portfolio.adminDelete);

export default router;
