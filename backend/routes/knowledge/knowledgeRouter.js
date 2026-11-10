import express from "express";

import authMiddleware from "../../middleware/authMiddleware.js";
import adminMiddleware from "../../middleware/adminMiddleware.js";

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
} from "../../controllers/knowledge/knowledgeController.js";

const router = express.Router();

router.use(authMiddleware);

// --------------------------------------------------
// ADMIN ROUTES
// Keep these before /:id.
// --------------------------------------------------

router.get("/admin", adminMiddleware, getAdminKnowledge);

router.get("/admin/:id", adminMiddleware, getAdminKnowledgeById);

// --------------------------------------------------
// PUBLIC ROUTES
// --------------------------------------------------

router.get("/search", searchPublishedKnowledge);

router.get("/", getPublishedKnowledge);

router.get("/:id", getPublishedKnowledgeById);

// --------------------------------------------------
// ADMIN MUTATIONS
// --------------------------------------------------

router.post("/", adminMiddleware, createKnowledgeContent);

router.put("/:id", adminMiddleware, updateKnowledgeContent);

router.patch("/:id/status", adminMiddleware, updateKnowledgeStatus);

router.delete("/:id", adminMiddleware, deleteKnowledgeContent);

export default router;