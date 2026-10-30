
import { Router } from "express";
import authMiddleware from "../../middleware/authMiddleware.js";

import {
    sendEmailVerificationCode,
    confirmEmailVerificationCode,
    sendPhoneVerificationCode,
    confirmPhoneVerificationCode,
    resendPhoneVerificationCode,
    getMyWhatsAppPreferences,
    updateMyWhatsAppPreferences,
} from "../../controllers/profile/verificationController.js";

import {
    sendWhatsAppVerificationCode,
    confirmWhatsAppVerificationCode,
} from "../../controllers/profile/verificationController.js";

const router = Router();

// Email verification
router.post("/email/send", authMiddleware, sendEmailVerificationCode);
router.post("/email/confirm", authMiddleware, confirmEmailVerificationCode);

// Phone verification
router.post("/phone/send", authMiddleware, sendPhoneVerificationCode);
router.post("/phone/confirm", authMiddleware, confirmPhoneVerificationCode);
router.post("/phone/resend", authMiddleware, resendPhoneVerificationCode);

router.get("/whatsapp", authMiddleware, getMyWhatsAppPreferences);
router.put("/whatsapp", authMiddleware, updateMyWhatsAppPreferences);

router.post("/whatsapp/send", authMiddleware, sendWhatsAppVerificationCode);
router.post("/whatsapp/confirm", authMiddleware, confirmWhatsAppVerificationCode);

export default router;
