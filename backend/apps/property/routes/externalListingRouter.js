
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
    previewExternalListing,
    createExternalListing,
    getExternalListings,
    getExternalListingById,
    refreshExternalListing,
    collectExternalListings,
    collectAqariListingsController,
    getExternalListingSources,
    addExternalListingSource,
    deleteExternalListingSource,
    refreshExternalListings,
    importNewExternalListings,
} from "../controllers/externalListings/externalListingController.js";

import {
    getCollectableWebsites,
    addCollectableWebsite,
    deleteCollectableWebsite,
    startWebsiteCollection,
    getWebsiteCollectionStatus,
    cancelWebsiteCollection,
} from "../controllers/externalListings/externalListingCollectionController.js";

import {
    startAvailabilityCheckController,
    getAvailabilityStatusController,
    cancelAvailabilityCheckController,
    removeReviewedListingsController,
} from "../controllers/externalListings/externalListingAvailabilityController.js";

const router = express.Router();

// Public reading endpoint.
router.get("/", getExternalListings);

// Find a property from external websites (logged-in users).
router.get("/search/websites", authMiddleware, getSearchWebsites);
router.get("/search", authMiddleware, searchLimiter, searchExternalListings);
router.get("/search/websites/:hostname/config", authMiddleware, adminAccess("externalListings"), getWebsiteSearchConfig);
router.put("/search/websites/:hostname/config", authMiddleware, adminAccess("externalListings"), updateWebsiteSearchConfig);
router.post("/search/websites/:hostname/test", authMiddleware, adminAccess("externalListings"), testWebsiteSearch);

// Administrator-only: collect new listings from a whole website.
router.get(
    "/websites",
    authMiddleware,
    adminAccess("externalListings"),
    getCollectableWebsites
);

router.post(
    "/websites",
    authMiddleware,
    adminAccess("externalListings"),
    addCollectableWebsite
);

router.delete(
    "/websites/:hostname",
    authMiddleware,
    adminAccess("externalListings"),
    deleteCollectableWebsite
);

router.post(
    "/collect-site",
    authMiddleware,
    adminAccess("externalListings"),
    startWebsiteCollection
);

router.get(
    "/collect-site/status",
    authMiddleware,
    adminAccess("externalListings"),
    getWebsiteCollectionStatus
);

router.post(
    "/collect-site/cancel",
    authMiddleware,
    adminAccess("externalListings"),
    cancelWebsiteCollection
);

// Administrator-only: check that listings are still available on their
// websites and remove the ones that are not.
router.post(
    "/availability/check",
    authMiddleware,
    adminAccess("externalListings"),
    startAvailabilityCheckController
);

router.get(
    "/availability/status",
    authMiddleware,
    adminAccess("externalListings"),
    getAvailabilityStatusController
);

router.post(
    "/availability/cancel",
    authMiddleware,
    adminAccess("externalListings"),
    cancelAvailabilityCheckController
);

router.post(
    "/availability/remove",
    authMiddleware,
    adminAccess("externalListings"),
    removeReviewedListingsController
);

// Administrator-only source management endpoints (single listing URLs).
router.get(
    "/sources",
    authMiddleware,
    adminAccess("externalListings"),
    getExternalListingSources
);

router.post(
    "/sources",
    authMiddleware,
    adminAccess("externalListings"),
    addExternalListingSource
);

router.delete(
    "/sources",
    authMiddleware,
    adminAccess("externalListings"),
    deleteExternalListingSource
);

// Administrator-only collection and import endpoints.
router.post(
    "/import",
    authMiddleware,
    adminAccess("externalListings"),
    importNewExternalListings
);

router.post(
    "/refresh",
    authMiddleware,
    adminAccess("externalListings"),
    refreshExternalListings
);

router.post(
    "/preview",
    authMiddleware,
    adminAccess("externalListings"),
    previewExternalListing
);

router.post(
    "/collect",
    authMiddleware,
    adminAccess("externalListings"),
    collectExternalListings
);

router.post(
    "/collect-aqari",
    authMiddleware,
    adminAccess("externalListings"),
    collectAqariListingsController
);

router.post(
    "/",
    authMiddleware,
    adminAccess("externalListings"),
    createExternalListing
);

router.patch(
    "/:id/refresh",
    authMiddleware,
    adminAccess("externalListings"),
    refreshExternalListing
);

// Keep dynamic GET route last.
router.get("/:id", getExternalListingById);

export default router;
