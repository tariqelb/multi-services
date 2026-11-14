
import express from "express";
import authMiddleware from "../../middleware/authMiddleware.js";

import {
    createRoommateAlert,
    getMyRoommateAlerts,
    archiveRoommateAlert,
    restoreRoommateAlert,
} from "../../controllers/Roommate/roommateAlertController.js";

const router = express.Router();

// Create a roommate alert
router.post("/", authMiddleware, createRoommateAlert);

// Get the authenticated user's roommate alerts
router.get("/", authMiddleware, getMyRoommateAlerts);

// Archive a roommate alert
router.delete("/:id", authMiddleware, archiveRoommateAlert);

// Restore an archived roommate alert
router.patch("/:id/restore", authMiddleware, restoreRoommateAlert);

export default router;
