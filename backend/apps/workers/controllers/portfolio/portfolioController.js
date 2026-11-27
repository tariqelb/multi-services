// backend/apps/workers/controllers/portfolio/portfolioController.js
//
// Portfolio of a daily worker: articles with photos of his work and YouTube
// videos, up to 20. Shared logic: main/services/portfolio.js.

import WorkerPortfolioItem from "../../models/WorkerPortfolioItem.js";
import User from "../../../main/models/User.js";
import { createImageUpload } from "../../../main/middleware/imageUpload.js";
import { PORTFOLIO_MAX_IMAGES, createPortfolio } from "../../../main/services/portfolio.js";

export const portfolioImages = createImageUpload({
    folder: "multi-services/worker-portfolio",
    maxFiles: PORTFOLIO_MAX_IMAGES,
});

export const portfolio = createPortfolio({
    Model: WorkerPortfolioItem,
    images: portfolioImages,
    service: "workers",
    UserModel: User,
});
