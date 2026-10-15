
import express from "express";

import authRouter from "./auth/AuthRoutes.js";
import profileRouter from "./profile/profileRouter.js";
import propertyRoutes from "./property/propertyRouter.js";

const router = express.Router();

router.use("/auth", authRouter);
router.use("/profile", profileRouter);
router.use("/property", propertyRoutes);
export default router;