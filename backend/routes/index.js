
import express from "express";

import authRouter from "./auth/AuthRoutes.js";
import profileRouter from "./profile/profileRouter.js";
import propertyRoutes from "./property/propertyRouter.js";
import notificationRouter from "./../Notification/notificationRouter.js";
import emailTestRouter from "./email/emailTestRouter.js";
import verificationRouter from "./verification/verificationRouter.js";
import accountDeletionRoutes from "./profile/accountDeletionRoutes.js";
import feedbackRoutes from "./feedback/feedbackRoutes.js";
import dashboardRouter from "./dashboard/dashboardRouter.js";
import externalListingRouter from "./externalListings/externalListingRouter.js";

const router = express.Router();

router.use("/auth", authRouter);
router.use("/profile", profileRouter);
router.use("/profile/me/verification", verificationRouter);
router.use("/profile/me/account-deletion", accountDeletionRoutes);
router.use("/property", propertyRoutes);
router.use("/notifications", notificationRouter);
router.use("/test-email", emailTestRouter);
router.use("/feedback", feedbackRoutes);
router.use("/dashboard", dashboardRouter);
router.use("/external-listings", externalListingRouter);
export default router;
