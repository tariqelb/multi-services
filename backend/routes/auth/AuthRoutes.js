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

import {
    forgotPassword,
    resetPassword,
} from "../../controllers/auth/PasswordResetController.js";

const router = express.Router();

router.post("/login", login);
router.post("/signup", signup);
router.get("/me", authMiddleware, getMe);
router.post("/logout", logout);
router.post("/verify-email", verifyEmail);
router.post("/resend-code", resendVerificationCode);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);


export default router;