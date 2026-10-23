
import express from "express";

import authRouter from "./auth/AuthRoutes.js";
import profileRouter from "./profile/profileRouter.js";
import propertyRoutes from "./property/propertyRouter.js";
import notificationRouter from "./../Notification/notificationRouter.js"


const router = express.Router();

router.use("/auth", authRouter);
router.use("/profile", profileRouter);
router.use("/property", propertyRoutes);
router.use("/notifications", notificationRouter);
export default router;