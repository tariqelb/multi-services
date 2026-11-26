// backend/apps/property/controllers/portfolio/portfolioController.js
//
// Portfolio of the property profile: articles (with photos) and YouTube videos,
// up to 20 per user. The shared logic is in main/services/portfolio.js.

import PropertyPortfolioItem from "../../models/PropertyPortfolioItem.js";
import User from "../../../main/models/User.js";
import { createImageUpload } from "../../../main/middleware/imageUpload.js";
import { PORTFOLIO_MAX_IMAGES, createPortfolio } from "../../../main/services/portfolio.js";

export const portfolioImages = createImageUpload({
    folder: "multi-services/property-portfolio",
    maxFiles: PORTFOLIO_MAX_IMAGES,
});

export const portfolio = createPortfolio({
    Model: PropertyPortfolioItem,
    images: portfolioImages,
    service: "property",
    UserModel: User,
});
