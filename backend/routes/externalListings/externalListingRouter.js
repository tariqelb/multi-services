
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
} from "../../controllers/externalListings/externalListingController.js";

const router = express.Router();

// Public reading endpoints.
router.get("/", getExternalListings);

// Administrator-only source management endpoints.
// Keep these BEFORE the dynamic "/:id" route.
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

// Administrator-only listing management endpoints.
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

// Keep the dynamic route LAST among GET routes.
router.get("/:id", getExternalListingById);

export default router;
