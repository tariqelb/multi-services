// backend/apps/property/controllers/dashboard/propertyActivityController.js
//
// Property › Statistics, "Publications & community" tab and "Saved demand" for
// roommate announcements and hotels & riads.
//
//   GET /api/property/dashboard/activity?range=30d
//       new listings per type (properties, roommates, hotels & riads),
//       requests and replies, portfolio articles and videos, reviews,
//       most active publishers.
//   GET /api/property/dashboard/saved-listing-demand?range=30d&type=roommate|establishment
//       saves of roommate announcements or hotels & riads.

import User from "../../../main/models/User.js";
import Property from "../../models/Property.js";
import RoommateListing from "../../models/RoommateListing.js";
import Establishment from "../../models/Establishment.js";
import SavedListing from "../../models/SavedListing.js";
import PropertyRequest from "../../models/PropertyRequest.js";
import PropertyRequestResponse from "../../models/PropertyRequestResponse.js";
import PropertyPortfolioItem from "../../models/PropertyPortfolioItem.js";
import Review from "../../models/Review.js";

import { currentMatch, getRangeWindow, rate } from "../../../main/utils/analytics.js";
import {
    countPair,
    countUnique,
    mergeTrends,
    saveStats,
    saveTrend,
    topSaved,
    topValues,
    trendRows,
} from "../../../main/utils/statsKit.js";

const nameOf = (user) => [user?.firstName, user?.lastName].filter(Boolean).join(" ") || user?.email || "—";

/** Most active publishers in the window: [{ id, name, email, listings }] */
async function topPublishers(window, limit = 8) {
    const match = currentMatch(window, "createdAt");
    const stages = [{ $match: match }, { $group: { _id: "$userId", listings: { $sum: 1 } } }];
    const rows = (
        await Promise.all([Property, RoommateListing, Establishment].map((Model) => Model.aggregate(stages)))
    ).flat();

    const totals = new Map();
    for (const row of rows) {
        if (!row._id) continue;
        totals.set(String(row._id), (totals.get(String(row._id)) || 0) + row.listings);
    }
    const top = [...totals.entries()].sort((a, b) => b[1] - a[1]).slice(0, limit);
    const users = await User.find({ _id: { $in: top.map(([id]) => id) } }).select("firstName lastName email").lean();
    const byId = new Map(users.map((user) => [String(user._id), user]));
    return top.map(([id, listings]) => ({ id, name: nameOf(byId.get(id)), email: byId.get(id)?.email || "", listings }));
}

// GET /api/property/dashboard/activity?range=30d
export const getPropertyActivityAnalytics = async (req, res) => {
    try {
        const window = getRangeWindow(req.query.range);
        const current = (field = "createdAt", base = {}) => currentMatch(window, field, base);

        const [
            newProperties,
            newRoommates,
            newEstablishments,
            requests,
            replies,
            articles,
            videos,
            reviews,
            requestsWithReply,
            requestsInWindow,
            portfolioAuthors,
            ratingRow,
            requestCities,
            requestTransactions,
            roommateCities,
            establishmentTypes,
            publishers,
            inventory,
            trendProperties,
            trendRoommates,
            trendEstablishments,
            trendRequests,
            trendReplies,
            trendPortfolio,
        ] = await Promise.all([
            countPair(Property, window, "createdAt"),
            countPair(RoommateListing, window, "createdAt"),
            countPair(Establishment, window, "createdAt"),
            countPair(PropertyRequest, window, "createdAt"),
            countPair(PropertyRequestResponse, window, "createdAt"),
            countPair(PropertyPortfolioItem, window, "createdAt", { type: "article" }),
            countPair(PropertyPortfolioItem, window, "createdAt", { type: "video" }),
            countPair(Review, window, "createdAt"),
            countUnique(PropertyRequestResponse, current(), "$requestId"),
            PropertyRequest.countDocuments(current()),
            countUnique(PropertyPortfolioItem, current(), "$userId"),
            Review.aggregate([{ $match: current() }, { $group: { _id: null, average: { $avg: "$rating" } } }]),
            topValues(PropertyRequest, current(), "city"),
            topValues(PropertyRequest, current(), "transaction"),
            topValues(RoommateListing, current(), "city"),
            topValues(Establishment, current(), "accommodationType"),
            topPublishers(window),
            Promise.all([
                Property.countDocuments({ status: "Available" }),
                RoommateListing.countDocuments({ status: "Open" }),
                Establishment.countDocuments({}),
                PropertyRequest.countDocuments({ status: "active" }),
                PropertyPortfolioItem.countDocuments({}),
            ]),
            trendRows(Property, current(), "createdAt", window.unit, "properties"),
            trendRows(RoommateListing, current(), "createdAt", window.unit, "roommates"),
            trendRows(Establishment, current(), "createdAt", window.unit, "establishments"),
            trendRows(PropertyRequest, current(), "createdAt", window.unit, "requests"),
            trendRows(PropertyRequestResponse, current(), "createdAt", window.unit, "replies"),
            trendRows(PropertyPortfolioItem, current(), "createdAt", window.unit, "portfolio"),
        ]);

        const [availableProperties, openRoommates, establishments, activeRequests, portfolioTotal] = inventory;

        return res.status(200).json({
            success: true,
            range: window.range,
            kpis: { newProperties, newRoommates, newEstablishments, requests, replies, articles, videos, reviews },
            ratios: {
                // Requests of the window that received at least one reply.
                answeredRequestRate: rate(requestsWithReply, requestsInWindow),
                repliesPerRequest: requestsInWindow ? Math.round((replies.value / requestsInWindow) * 10) / 10 : 0,
                averageRating: ratingRow[0] ? Math.round(ratingRow[0].average * 10) / 10 : 0,
                portfolioAuthors,
            },
            inventory: [
                { name: "properties", value: availableProperties },
                { name: "roommates", value: openRoommates },
                { name: "establishments", value: establishments },
            ],
            totals: { activeRequests, portfolioTotal },
            listingsByType: [
                { name: "properties", value: newProperties.value },
                { name: "roommates", value: newRoommates.value },
                { name: "establishments", value: newEstablishments.value },
            ],
            requestCities,
            requestTransactions,
            roommateCities,
            establishmentTypes,
            publishers,
            extra: [
                { key: "roommateCities", title: "New roommate announcements by city", rows: roommateCities },
                { key: "establishmentTypes", title: "New hotels & riads by type", rows: establishmentTypes },
            ],
            listingTrend: mergeTrends([trendProperties, trendRoommates, trendEstablishments], window, {
                properties: 0,
                roommates: 0,
                establishments: 0,
            }),
            communityTrend: mergeTrends([trendRequests, trendReplies, trendPortfolio], window, {
                requests: 0,
                replies: 0,
                portfolio: 0,
            }),
        });
    } catch (error) {
        console.error("Property activity analytics error:", error);
        return res.status(500).json({ success: false, message: "Failed to retrieve the activity statistics." });
    }
};

const SAVED_TYPES = {
    roommate: { Model: RoommateListing, title: (item) => item.title, city: (item) => item.city, link: (id) => `/roommates/${id}` },
    establishment: {
        Model: Establishment,
        title: (item) => item.name,
        city: (item) => item.location?.city,
        link: (id) => `/establishments/${id}`,
    },
};

// GET /api/property/dashboard/saved-listing-demand?range=30d&type=roommate|establishment
export const getSavedListingDemandAnalytics = async (req, res) => {
    try {
        const type = String(req.query.type || "roommate");
        const config = SAVED_TYPES[type];
        if (!config) return res.status(400).json({ success: false, message: "Invalid type." });

        const window = getRangeWindow(req.query.range);
        const base = { listingType: type };

        const [current, previous, activeSaved, trend, top] = await Promise.all([
            saveStats(SavedListing, window.start, null, base),
            window.start ? saveStats(SavedListing, window.previousStart, window.previousEnd, base) : Promise.resolve({ saves: 0 }),
            SavedListing.countDocuments({ ...base, isSaved: true }),
            saveTrend(SavedListing, window.start, window.unit, "saves", base),
            topSaved(SavedListing, window.start, "listingId", 8, base),
        ]);

        const listings = await config.Model.find({ _id: { $in: top.map((row) => row.id) } }).lean();
        const byId = new Map(listings.map((item) => [String(item._id), item]));

        // Cities of the saved listings.
        const cityCounts = new Map();
        for (const row of top) {
            const city = config.city(byId.get(String(row.id)) || {});
            if (city) cityCounts.set(city, (cityCounts.get(city) || 0) + row.saves);
        }

        return res.status(200).json({
            success: true,
            type,
            range: window.range,
            summary: {
                saves: current.saves,
                unsaves: current.unsaves,
                uniqueUsers: current.uniqueUsers,
                activeSaved,
                savesChange: window.start ? (previous.saves ? Math.round(((current.saves - previous.saves) / previous.saves) * 1000) / 10 : null) : null,
                keepRate: rate(Math.max(current.saves - current.unsaves, 0), current.saves),
            },
            trend: mergeTrends([trend], window, { saves: 0 }),
            topListings: top
                .filter((row) => byId.has(String(row.id)))
                .map((row) => {
                    const item = byId.get(String(row.id));
                    return { id: String(row.id), title: config.title(item) || "—", city: config.city(item) || "", saves: row.saves, link: config.link(row.id) };
                }),
            cities: [...cityCounts.entries()].map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count),
        });
    } catch (error) {
        console.error("Saved listing demand error:", error);
        return res.status(500).json({ success: false, message: "Failed to retrieve the saved listings statistics." });
    }
};
