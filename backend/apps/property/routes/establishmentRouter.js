
import express from "express";

import {
    createEstablishment,
    getAllEstablishments,
    getMyEstablishments,
    getEstablishmentById,
    updateEstablishment,
    deleteEstablishment,
    getEstablishmentsByUser,
} from "../controllers/establishments/establishmentController.js";

import authMiddleware from "../../main/middleware/authMiddleware.js";
import optionalAuthMiddleware from "../../main/middleware/optionalAuthMiddleware.js";
import {
    uploadEstablishmentFiles,
} from "../middleware/establishmentUpload.js";

const router = express.Router();

router.get("/", getAllEstablishments);

// Static route MUST be before /:id
router.get(
    "/my-establishments",
    authMiddleware,
    getMyEstablishments
);

router.post(
    "/",
    authMiddleware,
    uploadEstablishmentFiles,
    createEstablishment
);

router.put(
    "/:id",
    authMiddleware,
    uploadEstablishmentFiles,
    updateEstablishment
);

router.delete(
    "/:id",
    authMiddleware,
    deleteEstablishment
);
router.get("/user/:userId", getEstablishmentsByUser);
router.get("/:id", optionalAuthMiddleware, getEstablishmentById);

export default router;
