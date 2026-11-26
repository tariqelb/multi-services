// backend/apps/main/routes/requestRouter.js
//
// /api/requests — "I am looking for..." requests (property and vehicles).
// See controllers/requests/requestController.js for every route.

import { Router } from "express";

import authMiddleware from "../middleware/authMiddleware.js";
import adminAccess from "../middleware/adminAccessMiddleware.js";
import { createRateLimiter } from "../middleware/rateLimit.js";
import {
    adminDeleteRequest,
    adminListRequests,
    closeRequest,
    createRequest,
    deleteRequest,
    getBoard,
    getMyProfessionalProfile,
    getMyReplies,
    getMyRequests,
    getRequest,
    getUserPublicRequests,
    renewRequest,
    respondToRequest,
    shareContact,
    updateMyProfessionalProfile,
} from "../controllers/requests/requestController.js";

const router = Router();

// Per account: posting requests and replying.
const byUser = (req) => String(req.user?.userId || req.ip);
const postLimiter = createRateLimiter({ name: "request-post", windowMs: 60 * 60 * 1000, max: 10, key: byUser, message: "Too many requests posted. Please try again later." });
const replyLimiter = createRateLimiter({ name: "request-reply", windowMs: 60 * 60 * 1000, max: 60, key: byUser, message: "Too many replies. Please try again later." });

// Admin: property requests -> "propertyRequests", vehicle requests -> "vehicleRequests".
const adminForService = (req, res, next) => {
    const section = { property: "propertyRequests", vehicle: "vehicleRequests" }[req.params.service];
    if (!section) return res.status(400).json({ success: false, message: "Invalid service." });
    return adminAccess(section)(req, res, next);
};

router.get("/profile", authMiddleware, getMyProfessionalProfile);
router.put("/profile", authMiddleware, updateMyProfessionalProfile);

router.get("/mine", authMiddleware, getMyRequests);
router.get("/board", authMiddleware, getBoard);
router.get("/replies", authMiddleware, getMyReplies);

// Public profile (no login needed, like the profiles themselves).
router.get("/user/:userId", getUserPublicRequests);

router.get("/admin/:service", authMiddleware, adminForService, adminListRequests);
router.delete("/admin/:service/:id", authMiddleware, adminForService, adminDeleteRequest);

router.post("/", authMiddleware, postLimiter, createRequest);
router.get("/:id", authMiddleware, getRequest);
router.patch("/:id", authMiddleware, closeRequest);
router.post("/:id/renew", authMiddleware, renewRequest);
router.delete("/:id", authMiddleware, deleteRequest);
router.post("/:id/responses", authMiddleware, replyLimiter, respondToRequest);
router.post("/:id/responses/:responseId/share", authMiddleware, shareContact);

export default router;
