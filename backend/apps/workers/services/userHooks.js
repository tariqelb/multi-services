// backend/apps/workers/services/userHooks.js
//
// What the daily worker service tells the main service about a user:
// admin counters, admin user page statistics, cleanup on account deletion.

import mongoose from "mongoose";

import WorkerProfile from "../models/WorkerProfile.js";
import WorkerPortfolioItem from "../models/WorkerPortfolioItem.js";
import { portfolio } from "../controllers/portfolio/portfolioController.js";
import { deleteWorkplaceImages } from "../controllers/workerController.js";

const toObjectId = (id) => new mongoose.Types.ObjectId(String(id));

export const userListDefaults = {
    workerOffers: 0,
    activeWorkerOffers: 0,
    workerPortfolio: 0,
};

// How the admin users list reads these counters (summary and filters).
export const userActivity = {
    publisher: ["workerOffers"],
    activePublisher: ["activeWorkerOffers"],
    portfolio: ["workerPortfolio"],
};

export async function getUserListStats(userIds) {
    const ids = userIds.map(toObjectId);
    const [profiles, portfolioRows] = await Promise.all([
        WorkerProfile.find({ userId: { $in: ids } }).select("userId status offers._id").lean(),
        WorkerPortfolioItem.aggregate([{ $match: { userId: { $in: ids } } }, { $group: { _id: "$userId", count: { $sum: 1 } } }]),
    ]);

    const byUser = new Map();
    for (const profile of profiles) {
        const offers = (profile.offers || []).length;
        byUser.set(String(profile.userId), {
            workerOffers: offers,
            activeWorkerOffers: profile.status === "active" ? offers : 0,
        });
    }
    for (const row of portfolioRows) {
        byUser.set(String(row._id), { ...byUser.get(String(row._id)), workerPortfolio: row.count });
    }
    return byUser;
}

export async function getUserDetailStats(userId) {
    if (!mongoose.Types.ObjectId.isValid(String(userId))) return {};
    const [profile, articles, videos] = await Promise.all([
        WorkerProfile.findOne({ userId: toObjectId(userId) }).select("status offers.trade offers.customTrade availability views").lean(),
        WorkerPortfolioItem.countDocuments({ userId: toObjectId(userId), type: "article" }),
        WorkerPortfolioItem.countDocuments({ userId: toObjectId(userId), type: "video" }),
    ]);
    return {
        workers: {
            hasProfile: Boolean(profile),
            profileId: profile ? String(profile._id) : "",
            status: profile?.status || "",
            offers: (profile?.offers || []).length,
            trades: (profile?.offers || []).map((offer) => (offer.trade === "other" ? offer.customTrade : offer.trade)),
            views: profile?.views || 0,
            portfolioArticles: articles,
            portfolioVideos: videos,
        },
    };
}

export async function onUserDeleted(userId) {
    await portfolio.deleteUserItems(userId);
    const profiles = await WorkerProfile.find({ userId }).select("workplace.images").lean();
    for (const profile of profiles) await deleteWorkplaceImages(profile);
    await WorkerProfile.deleteMany({ userId });
}
