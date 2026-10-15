//app/backend/routes/auth/AuthRoutes.js
import express from "express";
import authMiddleware from "../../middleware/authMiddleware.js";
import {
    login,
    signup,
    getMe,
    logout,
} from "../../controllers/auth/authController.js";

const router = express.Router();

router.post("/login", login);
router.post("/signup", signup);
router.get("/me", authMiddleware, getMe);
router.post("/logout", logout);
export default router;