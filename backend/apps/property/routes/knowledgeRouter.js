import express from "express";

import authMiddleware from "../../main/middleware/authMiddleware.js";
import adminAccess from "../../main/middleware/adminAccessMiddleware.js";

import {
    getPublishedKnowledge,
    searchPublishedKnowledge,
    getPublishedKnowledgeById,
    getAdminKnowledge,
    getAdminKnowledgeById,
    createKnowledgeContent,
    updateKnowledgeContent,
    updateKnowledgeStatus,
    deleteKnowledgeContent,
} from "../controllers/knowledge/knowledgeController.js";

const router = express.Router();

// Published articles and videos can be read without logging in.
// Managing content: admins, and members with the "knowledge" section
// (read: see drafts, write: create / edit / delete).
const adminOnly = [authMiddleware, adminAccess("knowledge")];

// --------------------------------------------------
// ADMIN ROUTES
// Keep these before /:id.
// --------------------------------------------------

router.get("/admin", adminOnly, getAdminKnowledge);

router.get("/admin/:id", adminOnly, getAdminKnowledgeById);

// --------------------------------------------------
// PUBLIC ROUTES
// --------------------------------------------------

router.get("/search", searchPublishedKnowledge);

router.get("/", getPublishedKnowledge);

router.get("/:id", getPublishedKnowledgeById);

// --------------------------------------------------
// ADMIN MUTATIONS
// --------------------------------------------------

router.post("/", adminOnly, createKnowledgeContent);

router.put("/:id", adminOnly, updateKnowledgeContent);

router.patch("/:id/status", adminOnly, updateKnowledgeStatus);

router.delete("/:id", adminOnly, deleteKnowledgeContent);

export default router;
