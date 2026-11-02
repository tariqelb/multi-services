//app/backend/routes/auth/AuthRoutes.js
import express from "express";
import authMiddleware from "../../middleware/authMiddleware.js";
import {
    login,
    signup,
    getMe,
    logout,
    verifyEmail,
    resendVerificationCode,
} from "../../controllers/auth/authController.js";

const router = express.Router();

router.post("/login", login);
router.post("/signup", signup);
router.get("/me", authMiddleware, getMe);
router.post("/logout", logout);
router.post("/verify-email", verifyEmail);
router.post("/resend-code", resendVerificationCode);
export default router;