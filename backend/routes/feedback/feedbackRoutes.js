
import express from "express";

import {
    createFeedback,
    getMyFeedback,
    getAdminFeedback,
} from "../../controllers/Feedback/feedbackController.js";
import {
    updateFeedbackStatus,
} from "../../controllers/Feedback/feedbackController.js";
import authMiddleware from "../../middleware/authMiddleware.js";
import adminMiddleware from "../../middleware/adminMiddleware.js";
import { uploadFeedbackAttachments } from "../../middleware/feedbackUpload.js";

const router = express.Router();

// Authenticated users
router.post(
    "/",
    authMiddleware,
    uploadFeedbackAttachments,
    createFeedback
);

router.get("/mine", authMiddleware, getMyFeedback);

// Administrators only
router.get(
    "/admin-list",
    authMiddleware,
    adminMiddleware,
    getAdminFeedback
);

router.patch(
    "/:feedbackId/status",
    authMiddleware,
    adminMiddleware,
    updateFeedbackStatus
);

export default router;

