// backend/apps/workers/models/WorkerPortfolioItem.js
//
// Articles (with photos of the work) and YouTube videos of a daily worker.
// Same shape as the property and vehicles portfolios, own collection
// (see main/services/portfolio.js).

import mongoose from "mongoose";

import { buildPortfolioSchema } from "../../main/services/portfolio.js";

const WorkerPortfolioItem =
    mongoose.models.WorkerPortfolioItem ||
    mongoose.model("WorkerPortfolioItem", buildPortfolioSchema(), "worker_portfolio_items");

export default WorkerPortfolioItem;
