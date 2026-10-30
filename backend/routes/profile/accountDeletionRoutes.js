///home/tariq/multi-services/app/backend/routes/profile/accountDeletionRoutes.js
import express from "express";
import {
    requestAccountDeletion,
    cancelAccountDeletion,
} from "../../controllers/profile/accountDeletionController.js";
import authMiddleware from "../../middleware/authMiddleware.js";

const router = express.Router();

router.delete(
    "/",
    authMiddleware,
    requestAccountDeletion
);

router.post(
    "/cancel",
    authMiddleware,
    cancelAccountDeletion
);

export default router;
