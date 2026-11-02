
import express from "express";
import {
    getExternalListingAnalytics,
} from "./../../controllers/externalListings/externalListingAnalyticsController.js";

const router = express.Router();

router.get("/", getExternalListingAnalytics);

export default router;
