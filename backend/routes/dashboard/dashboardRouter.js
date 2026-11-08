import express from "express";

import {
    getAdminUsers,
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

const router = express.Router();

router.get("/users", authMiddleware, getAdminUsers);

// Visitor tracking.
router.post("/visits/heartbeat", optionalAuthMiddleware, trackVisit);
router.post("/visits/end", optionalAuthMiddleware, endVisit);

// Admin analytics.
router.get("/visits", authMiddleware, getVisitAnalytics);

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

export default router;