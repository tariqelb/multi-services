// backend/apps/vehicles/routes/externalListingRouter.js
//
// /api/vehicles/external-listings — vehicles, motos and parts published on
// other Moroccan websites (Avito, Moteur.ma, Wandaloo...).
//
// Users:  GET /                      collected listings (filters, pages)
//         GET /search/websites       websites the live search covers
//         GET /search                live search on the websites (logged in)
//         POST /:id/click            a visitor opened a listing
//         GET /:id
// Admin (section "vehicleExternalListings"): websites, collection,
//         availability check, search settings of a website, refresh.

import express from "express";

import authMiddleware from "../../main/middleware/authMiddleware.js";
import adminAccess from "../../main/middleware/adminAccessMiddleware.js";
import { searchLimiter } from "../../main/middleware/rateLimit.js";
import {
    getSearchWebsites,
    getWebsiteSearchConfig,
    searchExternalListings,
    testWebsiteSearch,
    updateWebsiteSearchConfig,
} from "../controllers/externalListings/externalListingSearchController.js";
import {
    getExternalListingById,
    getExternalListings,
    refreshExternalListings,
    cleanupNonVehicleListings,
    trackExternalListingClick,
} from "../controllers/externalListings/externalListingController.js";
import {
    addCollectableWebsite,
    cancelWebsiteCollection,
    deleteCollectableWebsite,
    getCollectableWebsites,
    getWebsiteCollectionStatus,
    startWebsiteCollection,
} from "../controllers/externalListings/externalListingCollectionController.js";
import {
    cancelAvailabilityCheckController,
    getAvailabilityStatusController,
    removeReviewedListingsController,
    startAvailabilityCheckController,
} from "../controllers/externalListings/externalListingAvailabilityController.js";

const router = express.Router();
const admin = [authMiddleware, adminAccess("vehicleExternalListings")];

// Collected listings (public, like the vehicles themselves).
router.get("/", getExternalListings);

// Find a vehicle on other websites (logged-in users).
router.get("/search/websites", authMiddleware, getSearchWebsites);
router.get("/search", authMiddleware, searchLimiter, searchExternalListings);
router.get("/search/websites/:hostname/config", ...admin, getWebsiteSearchConfig);
router.put("/search/websites/:hostname/config", ...admin, updateWebsiteSearchConfig);
router.post("/search/websites/:hostname/test", ...admin, testWebsiteSearch);

// Admin: collect new listings from a whole website.
router.get("/websites", ...admin, getCollectableWebsites);
router.post("/websites", ...admin, addCollectableWebsite);
router.delete("/websites/:hostname", ...admin, deleteCollectableWebsite);
router.post("/collect-site", ...admin, startWebsiteCollection);
router.get("/collect-site/status", ...admin, getWebsiteCollectionStatus);
router.post("/collect-site/cancel", ...admin, cancelWebsiteCollection);

// Admin: check that listings still exist on their websites.
router.post("/availability/check", ...admin, startAvailabilityCheckController);
router.get("/availability/status", ...admin, getAvailabilityStatusController);
router.post("/availability/cancel", ...admin, cancelAvailabilityCheckController);
router.post("/availability/remove", ...admin, removeReviewedListingsController);

// Admin: re-read the listings checked the longest time ago.
router.post("/refresh", ...admin, refreshExternalListings);
router.post("/cleanup", ...admin, cleanupNonVehicleListings);

router.post("/:id/click", trackExternalListingClick);
// Keep the dynamic route last.
router.get("/:id", getExternalListingById);

export default router;
