import express from "express";
import {
    createFeedback,
    getMyFeedback,
} from "../../controllers/Feedback/feedbackController.js";
import authMiddleware from "../../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", authMiddleware, createFeedback);
router.get("/mine", authMiddleware, getMyFeedback);

export default router;