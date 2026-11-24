// backend/apps/property/routes/savedListingRouter.js
// Saved roommate announcements and hotels / riads (all need login).
// Mounted at /api/property/saved-listings.

import { Router } from "express";

import authMiddleware from "../../main/middleware/authMiddleware.js";
import { getListingSavedStatus, getSavedListings, saveListing, unsaveListing } from "../controllers/listings/savedListingController.js";

const router = Router();

router.get("/", authMiddleware, getSavedListings);
router.get("/:type/:id", authMiddleware, getListingSavedStatus);
router.post("/:type/:id", authMiddleware, saveListing);
router.delete("/:type/:id", authMiddleware, unsaveListing);

export default router;
