// backend/apps/vehicles/controllers/portfolio/portfolioController.js
//
// Portfolio of the vehicles profile: articles (with photos) and YouTube videos,
// up to 20 per user. The shared logic is in main/services/portfolio.js.

import VehiclePortfolioItem from "../../models/VehiclePortfolioItem.js";
import User from "../../../main/models/User.js";
import { createImageUpload } from "../../../main/middleware/imageUpload.js";
import { PORTFOLIO_MAX_IMAGES, createPortfolio } from "../../../main/services/portfolio.js";

export const portfolioImages = createImageUpload({
    folder: "multi-services/vehicle-portfolio",
    maxFiles: PORTFOLIO_MAX_IMAGES,
});

export const portfolio = createPortfolio({
    Model: VehiclePortfolioItem,
    images: portfolioImages,
    service: "vehicles",
    UserModel: User,
});
