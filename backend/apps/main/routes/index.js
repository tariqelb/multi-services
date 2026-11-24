// backend/apps/main/routes/index.js
//
// Main service: what every service shares. Mounted at /api.
//   /api/auth                          login, signup, Google, password reset
//   /api/profile/me...                 my account and settings
//   /api/profile/me/verification       email / phone / WhatsApp verification
//   /api/profile/me/account-deletion   delete my account
//   /api/notifications                 my notifications
//   /api/dashboard/users...            admin: accounts (list, details, suspend)
//   /api/test-email                    email test (admin)

import { Router } from "express";

import authRouter from "./authRouter.js";
import profileRouter from "./profileRouter.js";
import verificationRouter from "./verificationRouter.js";
import accountDeletionRouter from "./accountDeletionRouter.js";
import notificationRouter from "./notificationRouter.js";
import adminRouter from "./adminRouter.js";
import emailTestRouter from "./emailTestRouter.js";

const router = Router();

router.use("/auth", authRouter);
router.use("/profile/me/verification", verificationRouter);
router.use("/profile/me/account-deletion", accountDeletionRouter);
router.use("/profile", profileRouter);
router.use("/notifications", notificationRouter);
router.use("/dashboard", adminRouter);
router.use("/test-email", emailTestRouter);

export default router;
