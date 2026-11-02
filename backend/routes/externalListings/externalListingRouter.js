
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

const router = express.Router();

// Public reading endpoint.
router.get("/", getExternalListings);

// Administrator-only source management endpoints.
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
