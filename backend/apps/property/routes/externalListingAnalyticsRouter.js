
import express from "express";
import {
    getExternalListingAnalytics,
} from "../controllers/externalListings/externalListingAnalyticsController.js";

import authMiddleware from "../../main/middleware/authMiddleware.js";
import adminAccess from "../../main/middleware/adminAccessMiddleware.js";

const router = express.Router();

// Admin statistics (include who clicked).
router.get("/", authMiddleware, adminAccess("propertyStatistics"), getExternalListingAnalytics);

export default router;
