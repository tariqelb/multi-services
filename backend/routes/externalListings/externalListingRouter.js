
import express from "express";

import authMiddleware from "../../middleware/authMiddleware.js";
import adminMiddleware from "../../middleware/adminMiddleware.js";

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
} from "../../controllers/externalListings/externalListingController.js";

import {
    getCollectableWebsites,
    addCollectableWebsite,
    deleteCollectableWebsite,
    startWebsiteCollection,
    getWebsiteCollectionStatus,
    cancelWebsiteCollection,
} from "../../controllers/externalListings/externalListingCollectionController.js";

import {
    startAvailabilityCheckController,
    getAvailabilityStatusController,
    cancelAvailabilityCheckController,
    removeReviewedListingsController,
} from "../../controllers/externalListings/externalListingAvailabilityController.js";

const router = express.Router();

// Public reading endpoint.
router.get("/", getExternalListings);

// Administrator-only: collect new listings from a whole website.
router.get(
    "/websites",
    authMiddleware,
    adminMiddleware,
    getCollectableWebsites
);

router.post(
    "/websites",
    authMiddleware,
    adminMiddleware,
    addCollectableWebsite
);

router.delete(
    "/websites/:hostname",
    authMiddleware,
    adminMiddleware,
    deleteCollectableWebsite
);

router.post(
    "/collect-site",
    authMiddleware,
    adminMiddleware,
    startWebsiteCollection
);

router.get(
    "/collect-site/status",
    authMiddleware,
    adminMiddleware,
    getWebsiteCollectionStatus
);

router.post(
    "/collect-site/cancel",
    authMiddleware,
    adminMiddleware,
    cancelWebsiteCollection
);

// Administrator-only: check that listings are still available on their
// websites and remove the ones that are not.
router.post(
    "/availability/check",
    authMiddleware,
    adminMiddleware,
    startAvailabilityCheckController
);

router.get(
    "/availability/status",
    authMiddleware,
    adminMiddleware,
    getAvailabilityStatusController
);

router.post(
    "/availability/cancel",
    authMiddleware,
    adminMiddleware,
    cancelAvailabilityCheckController
);

router.post(
    "/availability/remove",
    authMiddleware,
    adminMiddleware,
    removeReviewedListingsController
);

// Administrator-only source management endpoints (single listing URLs).
router.get(
    "/sources",
    authMiddleware,
    adminMiddleware,
    getExternalListingSources
);

router.post(
    "/sources",
    authMiddleware,
    adminMiddleware,
    addExternalListingSource
);

router.delete(
    "/sources",
    authMiddleware,
    adminMiddleware,
    deleteExternalListingSource
);

// Administrator-only collection and import endpoints.
router.post(
    "/import",
    authMiddleware,
    adminMiddleware,
    importNewExternalListings
);

router.post(
    "/refresh",
    authMiddleware,
    adminMiddleware,
    refreshExternalListings
);

router.post(
    "/preview",
    authMiddleware,
    adminMiddleware,
    previewExternalListing
);

router.post(
    "/collect",
    authMiddleware,
    adminMiddleware,
    collectExternalListings
);

router.post(
    "/collect-aqari",
    authMiddleware,
    adminMiddleware,
    collectAqariListingsController
);

router.post(
    "/",
    authMiddleware,
    adminMiddleware,
    createExternalListing
);

router.patch(
    "/:id/refresh",
    authMiddleware,
    adminMiddleware,
    refreshExternalListing
);

// Keep dynamic GET route last.
router.get("/:id", getExternalListingById);

export default router;
