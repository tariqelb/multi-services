// routes/search/searchRouter.js
// GET /api/search — search across properties, roommates, hotels & riads.
import express from "express";

import { searchListings } from "../../controllers/search/searchController.js";
import { searchLimiter } from "../../middleware/rateLimit.js";

const router = express.Router();

router.get("/", searchLimiter, searchListings);

export default router;
