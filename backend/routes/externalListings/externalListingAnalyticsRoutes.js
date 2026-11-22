
import express from "express";
import {
    getExternalListingAnalytics,
} from "./../../controllers/externalListings/externalListingAnalyticsController.js";

import authMiddleware from "../../middleware/authMiddleware.js";
import adminMiddleware from "../../middleware/adminMiddleware.js";

const router = express.Router();

// Admin statistics (include who clicked).
router.get("/", authMiddleware, adminMiddleware, getExternalListingAnalytics);

export default router;
