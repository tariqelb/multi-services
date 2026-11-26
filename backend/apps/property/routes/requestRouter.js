// backend/apps/property/routes/requestRouter.js
//
// /api/property/requests — "I am looking for..." property requests.
// See controllers/requests/requestController.js for every route.

import { Router } from "express";

import authMiddleware from "../../main/middleware/authMiddleware.js";
import adminAccess from "../../main/middleware/adminAccessMiddleware.js";
import { createRateLimiter } from "../../main/middleware/rateLimit.js";
import {
    adminDeleteRequest,
    adminListRequests,
    closeRequest,
    createRequest,
    deleteRequest,
    getBoard,
    getMyReplies,
    getMyRequests,
    getRequest,
    getUserPublicRequests,
    renewRequest,
    respondToRequest,
    shareContact,
} from "../controllers/requests/requestController.js";

const router = Router();

// Per account: posting requests and replying.
const byUser = (req) => String(req.user?.userId || req.ip);
const postLimiter = createRateLimiter({ name: "property-request-post", windowMs: 60 * 60 * 1000, max: 10, key: byUser, message: "Too many requests posted. Please try again later." });
const replyLimiter = createRateLimiter({ name: "property-request-reply", windowMs: 60 * 60 * 1000, max: 60, key: byUser, message: "Too many replies. Please try again later." });

router.get("/mine", authMiddleware, getMyRequests);
router.get("/board", authMiddleware, getBoard);
router.get("/replies", authMiddleware, getMyReplies);

// Public profile (no login needed, like the profiles themselves).
router.get("/user/:userId", getUserPublicRequests);

// Admin panel: section "propertyRequests".
router.get("/admin", authMiddleware, adminAccess("propertyRequests"), adminListRequests);
router.delete("/admin/:id", authMiddleware, adminAccess("propertyRequests"), adminDeleteRequest);

router.post("/", authMiddleware, postLimiter, createRequest);
router.get("/:id", authMiddleware, getRequest);
router.patch("/:id", authMiddleware, closeRequest);
router.post("/:id/renew", authMiddleware, renewRequest);
router.delete("/:id", authMiddleware, deleteRequest);
router.post("/:id/responses", authMiddleware, replyLimiter, respondToRequest);
router.post("/:id/responses/:responseId/share", authMiddleware, shareContact);

export default router;
