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

import { googleConfig, googleLogin } from "../../controllers/auth/googleAuthController.js";

import {
    forgotPassword,
    resetPassword,
} from "../../controllers/auth/PasswordResetController.js";

import {
    loginLimiter,
    signupLimiter,
    emailSendLimiter,
    codeCheckLimiter,
} from "../../middleware/rateLimit.js";

const router = express.Router();

router.post("/login", loginLimiter, login);
router.post("/signup", signupLimiter, signup);
router.post("/google", loginLimiter, (req, res) => googleLogin(req, res));
router.get("/google/config", googleConfig);
router.get("/me", authMiddleware, getMe);
router.post("/logout", logout);
router.post("/verify-email", codeCheckLimiter, verifyEmail);
router.post("/resend-code", emailSendLimiter, resendVerificationCode);
router.post("/forgot-password", emailSendLimiter, forgotPassword);
router.post("/reset-password", codeCheckLimiter, resetPassword);


export default router;