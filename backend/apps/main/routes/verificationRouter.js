
import { Router } from "express";
import authMiddleware from "../middleware/authMiddleware.js";

import {
    sendEmailVerificationCode,
    confirmEmailVerificationCode,
    sendPhoneVerificationCode,
    confirmPhoneVerificationCode,
    resendPhoneVerificationCode,
    getMyWhatsAppPreferences,
    updateMyWhatsAppPreferences,
} from "../controllers/account/verificationController.js";

import {
    sendWhatsAppVerificationCode,
    confirmWhatsAppVerificationCode,
} from "../controllers/account/verificationController.js";

import {
    verificationSendLimiter,
    verificationCheckLimiter,
} from "../middleware/rateLimit.js";

const router = Router();

// Email verification
router.post("/email/send", authMiddleware, verificationSendLimiter, sendEmailVerificationCode);
router.post("/email/confirm", authMiddleware, verificationCheckLimiter, confirmEmailVerificationCode);

// Phone verification
router.post("/phone/send", authMiddleware, verificationSendLimiter, sendPhoneVerificationCode);
router.post("/phone/confirm", authMiddleware, verificationCheckLimiter, confirmPhoneVerificationCode);
router.post("/phone/resend", authMiddleware, verificationSendLimiter, resendPhoneVerificationCode);

router.get("/whatsapp", authMiddleware, getMyWhatsAppPreferences);
router.put("/whatsapp", authMiddleware, updateMyWhatsAppPreferences);

router.post("/whatsapp/send", authMiddleware, verificationSendLimiter, sendWhatsAppVerificationCode);
router.post("/whatsapp/confirm", authMiddleware, verificationCheckLimiter, confirmWhatsAppVerificationCode);

export default router;
