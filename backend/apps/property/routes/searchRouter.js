// backend/apps/property/routes/searchRouter.js
// GET /api/property/search — search across properties, roommates, hotels & riads.
import express from "express";

import { searchListings } from "../controllers/search/searchController.js";
import { searchLimiter } from "../../main/middleware/rateLimit.js";

const router = express.Router();

router.get("/", searchLimiter, searchListings);

export default router;
