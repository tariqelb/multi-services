// backend/apps/vehicles/routes/vehicleRouter.js

import { Router } from "express";

import authMiddleware from "../../main/middleware/authMiddleware.js";
import optionalAuthMiddleware from "../../main/middleware/optionalAuthMiddleware.js";
import { searchLimiter } from "../../main/middleware/rateLimit.js";

import {
    vehicleImages,
    createVehicle,
    deleteVehicle,
    getVehicleById,
    getVehiclesMap,
    getMyVehicles,
    getSimilarVehicles,
    getMyDealerProfile,
    listVehicles,
    updateVehicle,
    updateVehicleStatus,
} from "../controllers/vehicleController.js";

import {
    archiveVehicleAlert,
    createVehicleAlert,
    getMyVehicleAlerts,
    restoreVehicleAlert,
} from "../controllers/vehicleAlertController.js";

import {
    createVehicleUserReview,
    getVehiclePublicProfile,
    getVehicleProfilePublications,
    getVehicleReviewRanking,
    getVehicleUserReviews,
} from "../controllers/vehicleProfileController.js";

import { getSavedVehicleIds, getSavedVehicles, saveVehicle, unsaveVehicle } from "../controllers/savedVehicleController.js";

const router = Router();

// Fixed paths before /:id.
router.get("/", searchLimiter, listVehicles);
router.get("/map", searchLimiter, getVehiclesMap);
router.get("/mine", authMiddleware, getMyVehicles);

// Alerts (same behaviour as the property alerts).
router.post("/alerts", authMiddleware, createVehicleAlert);
router.get("/alerts", authMiddleware, getMyVehicleAlerts);
router.delete("/alerts/:id", authMiddleware, archiveVehicleAlert);
router.patch("/alerts/:id/restore", authMiddleware, restoreVehicleAlert);
router.get("/dealers/me", authMiddleware, getMyDealerProfile);

// Saved vehicles.
router.get("/saved", authMiddleware, getSavedVehicles);
router.get("/saved/ids", authMiddleware, getSavedVehicleIds);
router.post("/:id/save", authMiddleware, saveVehicle);
router.delete("/:id/save", authMiddleware, unsaveVehicle);

// Publisher profiles and reviews.
router.get("/reviews/users", searchLimiter, getVehicleReviewRanking);
router.get("/profiles/:userId", getVehiclePublicProfile);
router.get("/profiles/:userId/vehicles", getVehicleProfilePublications);
router.get("/profiles/:userId/reviews", getVehicleUserReviews);
router.post("/profiles/:userId/reviews", authMiddleware, createVehicleUserReview);

router.post("/", authMiddleware, vehicleImages.middleware, createVehicle);

router.get("/:id/similar", searchLimiter, getSimilarVehicles);
router.get("/:id", optionalAuthMiddleware, getVehicleById);
router.put("/:id", authMiddleware, vehicleImages.middleware, updateVehicle);
router.patch("/:id/status", authMiddleware, updateVehicleStatus);
router.delete("/:id", authMiddleware, deleteVehicle);

export default router;
