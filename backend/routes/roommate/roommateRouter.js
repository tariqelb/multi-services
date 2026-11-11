
import express from "express";

import {
    createRoommateListing,
    getRoommateListings,
    getRoommateListingById,
    getMyRoommateListings,
    updateRoommateListing,
    deleteRoommateListing,
    updateRoommateListingStatus,
} from "../../controllers/Roommate/roommateController.js";

import authMiddleware from "../../middleware/authMiddleware.js";

import {
    uploadRoommateImages,
} from "../../middleware/propertyUpload.js";

const router = express.Router();

// Public routes
router.get("/", getRoommateListings);

// Authenticated routes
router.get("/my-listings", authMiddleware, getMyRoommateListings);

// Create roommate listing with images
router.post(
    "/",
    authMiddleware,
    uploadRoommateImages,
    createRoommateListing
);

// Owner management routes
router.patch(
    "/:id/status",
    authMiddleware,
    updateRoommateListingStatus
);

router.put(
    "/:id",
    authMiddleware,
    updateRoommateListing
);

router.delete(
    "/:id",
    authMiddleware,
    deleteRoommateListing
);

// Public details route — keep last
router.get("/:id", getRoommateListingById);

export default router;
