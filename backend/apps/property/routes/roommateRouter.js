import express from "express";

import { confirmStillAvailable } from "../controllers/listings/listingExpiryController.js";
import {
    createRoommateListing,
    getRoommateListings,
    getRoommateListingById,
    getMyRoommateListings,
    getUserRoommateListings,
    updateRoommateListing,
    deleteRoommateListing,
    updateRoommateListingStatus,
} from "../controllers/roommates/roommateController.js";

import authMiddleware from "../../main/middleware/authMiddleware.js";
import optionalAuthMiddleware from "../../main/middleware/optionalAuthMiddleware.js";

import {
    uploadRoommateImages,
} from "../middleware/propertyUpload.js";

const router = express.Router();

// Public routes
router.get("/", getRoommateListings);

// Public roommate announcements for a specific publisher
router.get("/user/:userId", getUserRoommateListings);

// Authenticated routes
router.get("/my-listings", authMiddleware, getMyRoommateListings);
router.post("/:id/still-available", authMiddleware, confirmStillAvailable("roommate"));

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
    uploadRoommateImages,
    updateRoommateListing
);

router.delete(
    "/:id",
    authMiddleware,
    deleteRoommateListing
);

// Public details route — keep last
router.get("/:id", optionalAuthMiddleware, getRoommateListingById);

export default router;