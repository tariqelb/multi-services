import { Router } from "express";
import authMiddleware from "../../middleware/authMiddleware.js";
import { testPropertyAlertEmail, } from "../../controllers/tests/emailTestController.js";

const router = Router();

// router.post("/test-email", authMiddleware, testPropertyAlertEmail);
router.post("/", authMiddleware, testPropertyAlertEmail);
export default router;