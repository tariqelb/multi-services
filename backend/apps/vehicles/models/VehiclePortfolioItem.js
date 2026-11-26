// backend/apps/vehicles/models/VehiclePortfolioItem.js
//
// Articles and YouTube videos of a user's vehicles profile ("Portfolio" tab).
// Same shape as the property portfolio, own collection (see main/services/portfolio.js).

import mongoose from "mongoose";

import { buildPortfolioSchema } from "../../main/services/portfolio.js";

const VehiclePortfolioItem =
    mongoose.models.VehiclePortfolioItem ||
    mongoose.model("VehiclePortfolioItem", buildPortfolioSchema(), "vehicle_portfolio_items");

export default VehiclePortfolioItem;
