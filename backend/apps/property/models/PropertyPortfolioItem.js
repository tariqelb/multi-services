// backend/apps/property/models/PropertyPortfolioItem.js
//
// Articles and YouTube videos of a user's property profile ("Portfolio" tab).
// Same shape as the vehicles portfolio, own collection (see main/services/portfolio.js).

import mongoose from "mongoose";

import { buildPortfolioSchema } from "../../main/services/portfolio.js";

const PropertyPortfolioItem =
    mongoose.models.PropertyPortfolioItem ||
    mongoose.model("PropertyPortfolioItem", buildPortfolioSchema(), "property_portfolio_items");

export default PropertyPortfolioItem;
