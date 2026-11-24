// backend/apps/property/routes/reviewsRouter.js
import { Router } from "express";

import { searchLimiter } from "../../main/middleware/rateLimit.js";
import { getReviewRanking } from "../controllers/reviews/reviewRankingController.js";

const router = Router();

// Public: users ranked by their reviews, with name search.
router.get("/users", searchLimiter, getReviewRanking);

export default router;
