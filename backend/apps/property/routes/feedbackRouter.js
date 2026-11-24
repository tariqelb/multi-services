
import express from "express";

import {
    createFeedback,
    getMyFeedback,
    getAdminFeedback,
} from "../controllers/feedback/feedbackController.js";
import {
    updateFeedbackStatus,
    downloadFeedbackAttachment,
} from "../controllers/feedback/feedbackController.js";
import authMiddleware from "../../main/middleware/authMiddleware.js";
import adminAccess from "../../main/middleware/adminAccessMiddleware.js";
import { uploadFeedbackAttachments } from "../middleware/feedbackUpload.js";

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
    adminAccess("feedback"),
    getAdminFeedback
);

router.patch(
    "/:feedbackId/status",
    authMiddleware,
    adminAccess("feedback"),
    updateFeedbackStatus
);

router.get(
    "/:feedbackId/attachments/:attachmentId",
    authMiddleware,
    adminAccess("feedback"),
    downloadFeedbackAttachment
);

export default router;

