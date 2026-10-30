///home/tariq/multi-services/app/backend/routes/dashboard/dashboardRouter.js
import express from "express";
import { getAdminUsers } from "../../controllers/dashboard/adminController.js";
import authMiddleware from "../../middleware/authMiddleware.js";
import optionalAuthMiddleware from "../../middleware/optionalAuthMiddleware.js";

import {
    trackVisit,
    endVisit,
    getVisitAnalytics,
} from "../../controllers/dashboard/visitsController.js";

const router = express.Router();

router.get("/users", authMiddleware, getAdminUsers);

// Visitor tracking: logged-in and anonymous visitors.
router.post("/visits/heartbeat", optionalAuthMiddleware, trackVisit);

router.post("/visits/end", optionalAuthMiddleware, endVisit);

// Admin-only analytics.
router.get("/visits", authMiddleware, getVisitAnalytics);

export default router;
