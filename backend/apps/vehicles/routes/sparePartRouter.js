// backend/apps/vehicles/routes/sparePartRouter.js
// Car and moto spare parts, mounted at /api/vehicles/parts (before the
// vehicle routes, so /parts is never read as a vehicle id).

import { Router } from "express";

import authMiddleware from "../../main/middleware/authMiddleware.js";
import optionalAuthMiddleware from "../../main/middleware/optionalAuthMiddleware.js";
import { searchLimiter } from "../../main/middleware/rateLimit.js";

import {
    createSparePart,
    deleteSparePart,
    getMySpareParts,
    getSavedSpareParts,
    getSimilarSpareParts,
    getSparePartById,
    getUserSpareParts,
    listSpareParts,
    partImages,
    saveSparePart,
    unsaveSparePart,
    updateSparePart,
    updateSparePartStatus,
} from "../controllers/sparePartController.js";

const router = Router();

// Fixed paths before /:id.
router.get("/", searchLimiter, listSpareParts);
router.get("/mine", authMiddleware, getMySpareParts);
router.get("/saved", authMiddleware, getSavedSpareParts);
router.get("/by-user/:userId", getUserSpareParts);

router.post("/", authMiddleware, partImages.middleware, createSparePart);

router.get("/:id/similar", searchLimiter, getSimilarSpareParts);
router.post("/:id/save", authMiddleware, saveSparePart);
router.delete("/:id/save", authMiddleware, unsaveSparePart);
router.get("/:id", optionalAuthMiddleware, getSparePartById);
router.put("/:id", authMiddleware, partImages.middleware, updateSparePart);
router.patch("/:id/status", authMiddleware, updateSparePartStatus);
router.delete("/:id", authMiddleware, deleteSparePart);

export default router;
