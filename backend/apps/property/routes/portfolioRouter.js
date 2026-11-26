// backend/apps/property/routes/portfolioRouter.js
//
// /api/property/portfolio — articles and YouTube videos of property profiles.
//   GET    /mine            my items (+ limits)
//   GET    /user/:userId    items shown on a public profile
//   POST   /                publish (multipart: type, title, text, youtubeUrl, images[])
//   PUT    /:id             edit (multipart: + keepImages)
//   DELETE /:id             delete
// Admin review: /api/property/dashboard/portfolio (see dashboardRouter.js).

import { Router } from "express";

import authMiddleware from "../../main/middleware/authMiddleware.js";
import { portfolio, portfolioImages } from "../controllers/portfolio/portfolioController.js";

const router = Router();

// Upload errors (wrong file type, too big) answer 400 with a clear message.
const withImages = (req, res, next) =>
    portfolioImages.middleware(req, res, (error) =>
        error ? res.status(400).json({ success: false, message: error.code === "LIMIT_FILE_SIZE" ? "Each photo can be up to 5 MB." : error.code === "LIMIT_FILE_COUNT" || error.code === "LIMIT_UNEXPECTED_FILE" ? "An article can have up to 4 photos." : error.message }) : next()
    );

router.get("/mine", authMiddleware, portfolio.getMine);
router.get("/user/:userId", portfolio.getUserPortfolio);
router.post("/", authMiddleware, withImages, portfolio.create);
router.put("/:id", authMiddleware, withImages, portfolio.update);
router.delete("/:id", authMiddleware, portfolio.remove);

export default router;
