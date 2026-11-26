// backend/apps/vehicles/controllers/admin/vehicleStatisticsController.js
//
// Vehicles › Statistics (admin), one endpoint per tab, all with ?range=7d|30d|90d|...|all:
//   GET /api/vehicles/admin/statistics/overview
//   GET /api/vehicles/admin/statistics/activity        publications & community
//   GET /api/vehicles/admin/statistics/views           ?type=all|vehicle|moto|part
//   GET /api/vehicles/admin/statistics/external-clicks
//   GET /api/vehicles/admin/statistics/alert-demand
//   GET /api/vehicles/admin/statistics/saved-demand    ?type=vehicle|part
//   GET /api/vehicles/admin/statistics/contacts
// Views, contacts and external clicks come from VehicleStatEvent; the rest
// from the listings, alerts, saves, requests, portfolio and reviews.

import User from "../../../main/models/User.js";
import Vehicle from "../../models/Vehicle.js";
import SparePart from "../../models/SparePart.js";
import VehicleAlert from "../../models/VehicleAlert.js";
import SavedVehicle from "../../models/SavedVehicle.js";
import SavedSparePart from "../../models/SavedSparePart.js";
import VehicleRequest from "../../models/VehicleRequest.js";
import VehicleRequestResponse from "../../models/VehicleRequestResponse.js";
import VehiclePortfolioItem from "../../models/VehiclePortfolioItem.js";
import VehicleReview from "../../models/VehicleReview.js";
import VehicleExternalListing from "../../models/VehicleExternalListing.js";
import VehicleStatEvent from "../../models/VehicleStatEvent.js";

import {
    bucketExpression,
    changeFor,
    currentMatch,
    fillHours,
    getRangeWindow,
    hourExpression,
    rate,
    round,
} from "../../../main/utils/analytics.js";
import {
    countPair,
    countUnique,
    mergeTrends,
    saveStats,
    saveTrend,
    topArrayValues,
    topSaved,
    topValues,
    trendRows,
    uniquePair,
} from "../../../main/utils/statsKit.js";

const sumPairs = (window, ...pairs) => {
    const value = pairs.reduce((sum, pair) => sum + (pair.value || 0), 0);
    const previous = pairs.reduce((sum, pair) => sum + (pair.previous || 0), 0);
    return { value, previous, change: changeFor(window, value, previous) };
};

const handle = (name, compute) => async (req, res) => {
    try {
        const window = getRangeWindow(req.query.range);
        const data = await compute(window, req.query);
        if (data?.error) return res.status(400).json({ success: false, message: data.error });
        return res.status(200).json({ success: true, range: window.range, ...data });
    } catch (error) {
        console.error(`[VehicleStatistics] ${name}`, error);
        return res.status(500).json({ success: false, message: "Failed to retrieve the vehicle statistics." });
    }
};

const eventMatch = (window, kind, extra = {}) => currentMatch(window, "createdAt", { kind, ...extra });

/** Most viewed / contacted / clicked items: [{ id, title, itemType, city, count, unique }] */
const topItems = (match, limit = 8) =>
    VehicleStatEvent.aggregate([
        { $match: match },
        {
            $group: {
                _id: "$itemId",
                title: { $last: "$title" },
                itemType: { $last: "$itemType" },
                city: { $last: "$city" },
                sourceDomain: { $last: "$sourceDomain" },
                count: { $sum: 1 },
                visitors: { $addToSet: "$visitorKey" },
            },
        },
        { $sort: { count: -1 } },
        { $limit: limit },
        { $project: { _id: 0, id: "$_id", title: 1, itemType: 1, city: 1, sourceDomain: 1, count: 1, unique: { $size: "$visitors" } } },
    ]);

const hourly = (match) =>
    VehicleStatEvent.aggregate([
        { $match: match },
        { $group: { _id: hourExpression("$createdAt"), count: { $sum: 1 } } },
        { $project: { _id: 0, hour: "$_id", count: 1 } },
    ]);

const linkOf = (row) =>
    row.itemType === "part" ? `/vehicles/parts/${row.id}` : row.itemType === "external" ? "" : `/vehicles/${row.id}`;

/* ---------------------------------------------------------------- overview */

export const getVehicleOverview = handle("overview", async (window) => {
    const current = (field = "createdAt", base = {}) => currentMatch(window, field, base);

    const [
        visitors,
        views,
        contacts,
        externalClicks,
        newCars,
        newMotos,
        newParts,
        alerts,
        requests,
        replies,
        portfolioItems,
        savesVehicles,
        savesParts,
        savesVehiclesBefore,
        savesPartsBefore,
        viewers,
        contactingVisitors,
        inventory,
        trendViews,
        trendContacts,
        trendExternal,
        trendSavesVehicles,
        trendSavesParts,
        contactChannels,
    ] = await Promise.all([
        uniquePair(VehicleStatEvent, window, "createdAt", "$visitorKey"),
        countPair(VehicleStatEvent, window, "createdAt", { kind: "view" }),
        countPair(VehicleStatEvent, window, "createdAt", { kind: "contact" }),
        countPair(VehicleStatEvent, window, "createdAt", { kind: "external" }),
        countPair(Vehicle, window, "createdAt", { category: { $ne: "moto" } }),
        countPair(Vehicle, window, "createdAt", { category: "moto" }),
        countPair(SparePart, window, "createdAt"),
        countPair(VehicleAlert, window, "createdAt"),
        countPair(VehicleRequest, window, "createdAt"),
        countPair(VehicleRequestResponse, window, "createdAt"),
        countPair(VehiclePortfolioItem, window, "createdAt"),
        saveStats(SavedVehicle, window.start, null),
        saveStats(SavedSparePart, window.start, null),
        window.start ? saveStats(SavedVehicle, window.previousStart, window.previousEnd) : { saves: 0 },
        window.start ? saveStats(SavedSparePart, window.previousStart, window.previousEnd) : { saves: 0 },
        countUnique(VehicleStatEvent, eventMatch(window, "view"), "$visitorKey"),
        countUnique(VehicleStatEvent, eventMatch(window, "contact"), "$visitorKey"),
        Promise.all([
            Vehicle.countDocuments({ status: "Available", category: { $ne: "moto" } }),
            Vehicle.countDocuments({ status: "Available", category: "moto" }),
            SparePart.countDocuments({ status: "Available" }),
            VehicleExternalListing.countDocuments({ status: "active" }),
        ]),
        trendRows(VehicleStatEvent, eventMatch(window, "view"), "createdAt", window.unit, "views"),
        trendRows(VehicleStatEvent, eventMatch(window, "contact"), "createdAt", window.unit, "contacts"),
        trendRows(VehicleStatEvent, eventMatch(window, "external"), "createdAt", window.unit, "externalClicks"),
        saveTrend(SavedVehicle, window.start, window.unit, "saves"),
        saveTrend(SavedSparePart, window.start, window.unit, "saves"),
        topValues(VehicleStatEvent, eventMatch(window, "contact"), "channel"),
    ]);

    const saves = {
        value: savesVehicles.saves + savesParts.saves,
        previous: (savesVehiclesBefore.saves || 0) + (savesPartsBefore.saves || 0),
    };
    saves.change = changeFor(window, saves.value, saves.previous);
    const savers = (savesVehicles.uniqueUsers || 0) + (savesParts.uniqueUsers || 0);

    const funnelSteps = [
        { key: "visitors", value: visitors.value },
        { key: "viewers", value: viewers },
        { key: "savers", value: savers },
        { key: "contacters", value: contactingVisitors },
    ];

    const [cars, motos, parts, external] = inventory;

    return {
        kpis: {
            uniqueVisitors: visitors,
            views,
            contacts,
            externalClicks,
            newListings: sumPairs(window, newCars, newMotos, newParts),
            saves,
            newAlerts: alerts,
            newRequests: requests,
            newReplies: replies,
            newPortfolio: portfolioItems,
        },
        ratios: {
            contactRate: rate(contacts.value, views.value),
            saveRate: rate(saves.value, views.value),
            viewsPerVisitor: viewers ? round(views.value / viewers, 2) : 0,
        },
        listingsByType: [
            { name: "cars", value: newCars.value },
            { name: "motos", value: newMotos.value },
            { name: "parts", value: newParts.value },
        ],
        availableByType: [
            { name: "cars", value: cars },
            { name: "motos", value: motos },
            { name: "parts", value: parts },
            { name: "external", value: external },
        ],
        contactChannels,
        funnel: funnelSteps.map((step, index) => ({
            ...step,
            rateFromTop: rate(step.value, funnelSteps[0].value),
            rateFromPrevious: index ? rate(step.value, funnelSteps[index - 1].value) : 100,
        })),
        trend: mergeTrends([trendViews, trendContacts, trendExternal, trendSavesVehicles, trendSavesParts], window, {
            views: 0,
            contacts: 0,
            externalClicks: 0,
            saves: 0,
        }),
    };
});

/* ---------------------------------------------------------------- activity */

const nameOf = (user) => [user?.firstName, user?.lastName].filter(Boolean).join(" ") || user?.email || "—";

async function topPublishers(window, limit = 8) {
    const stages = [{ $match: currentMatch(window, "createdAt") }, { $group: { _id: "$userId", listings: { $sum: 1 } } }];
    const rows = (await Promise.all([Vehicle.aggregate(stages), SparePart.aggregate(stages)])).flat();
    const totals = new Map();
    for (const row of rows) if (row._id) totals.set(String(row._id), (totals.get(String(row._id)) || 0) + row.listings);
    const top = [...totals.entries()].sort((a, b) => b[1] - a[1]).slice(0, limit);
    const users = await User.find({ _id: { $in: top.map(([id]) => id) } }).select("firstName lastName email").lean();
    const byId = new Map(users.map((user) => [String(user._id), user]));
    return top.map(([id, listings]) => ({ id, name: nameOf(byId.get(id)), email: byId.get(id)?.email || "", listings }));
}

export const getVehicleActivity = handle("activity", async (window) => {
    const current = (base = {}) => currentMatch(window, "createdAt", base);
    const [
        newCars,
        newMotos,
        newParts,
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
        makes,
        partMakes,
        publishers,
        inventory,
        trendCars,
        trendMotos,
        trendParts,
        trendRequests,
        trendReplies,
        trendPortfolio,
    ] = await Promise.all([
        countPair(Vehicle, window, "createdAt", { category: { $ne: "moto" } }),
        countPair(Vehicle, window, "createdAt", { category: "moto" }),
        countPair(SparePart, window, "createdAt"),
        countPair(VehicleRequest, window, "createdAt"),
        countPair(VehicleRequestResponse, window, "createdAt"),
        countPair(VehiclePortfolioItem, window, "createdAt", { type: "article" }),
        countPair(VehiclePortfolioItem, window, "createdAt", { type: "video" }),
        countPair(VehicleReview, window, "createdAt"),
        countUnique(VehicleRequestResponse, current(), "$requestId"),
        VehicleRequest.countDocuments(current()),
        countUnique(VehiclePortfolioItem, current(), "$userId"),
        VehicleReview.aggregate([{ $match: current() }, { $group: { _id: null, average: { $avg: "$rating" } } }]),
        topValues(VehicleRequest, current(), "city"),
        topValues(VehicleRequest, current(), "transaction"),
        topValues(Vehicle, current(), "make"),
        topValues(SparePart, current(), "compatibility.make"),
        topPublishers(window),
        Promise.all([
            Vehicle.countDocuments({ status: "Available", category: { $ne: "moto" } }),
            Vehicle.countDocuments({ status: "Available", category: "moto" }),
            SparePart.countDocuments({ status: "Available" }),
        ]),
        trendRows(Vehicle, current({ category: { $ne: "moto" } }), "createdAt", window.unit, "cars"),
        trendRows(Vehicle, current({ category: "moto" }), "createdAt", window.unit, "motos"),
        trendRows(SparePart, current(), "createdAt", window.unit, "parts"),
        trendRows(VehicleRequest, current(), "createdAt", window.unit, "requests"),
        trendRows(VehicleRequestResponse, current(), "createdAt", window.unit, "replies"),
        trendRows(VehiclePortfolioItem, current(), "createdAt", window.unit, "portfolio"),
    ]);

    const [cars, motos, parts] = inventory;
    return {
        kpis: { newCars, newMotos, newParts, requests, replies, articles, videos, reviews },
        ratios: {
            answeredRequestRate: rate(requestsWithReply, requestsInWindow),
            repliesPerRequest: requestsInWindow ? round(replies.value / requestsInWindow, 1) : 0,
            averageRating: ratingRow[0] ? round(ratingRow[0].average, 1) : 0,
            portfolioAuthors,
        },
        inventory: [
            { name: "cars", value: cars },
            { name: "motos", value: motos },
            { name: "parts", value: parts },
        ],
        requestCities,
        requestTransactions,
        publishers,
        extra: [
            { key: "vehicleMakes", title: "New vehicles by make", rows: makes },
            { key: "partMakes", title: "New spare parts by make", rows: partMakes },
        ],
        listingTrend: mergeTrends([trendCars, trendMotos, trendParts], window, { cars: 0, motos: 0, parts: 0 }),
        communityTrend: mergeTrends([trendRequests, trendReplies, trendPortfolio], window, { requests: 0, replies: 0, portfolio: 0 }),
    };
});

/* ---------------------------------------------- views / external / contacts */

const ITEM_FILTERS = {
    all: {},
    vehicle: { itemType: "vehicle" },
    moto: { itemType: "moto" },
    part: { itemType: "part" },
};

async function eventTab(window, kind, base = {}) {
    const match = eventMatch(window, kind, base);
    const [total, visitors, items, trend, hours, makes, cities, listingTypes, top, sources, channels, itemTypes] = await Promise.all([
        countPair(VehicleStatEvent, window, "createdAt", { kind, ...base }),
        uniquePair(VehicleStatEvent, window, "createdAt", "$visitorKey", { kind, ...base }),
        countUnique(VehicleStatEvent, match, "$itemId"),
        VehicleStatEvent.aggregate([
            { $match: match },
            {
                $group: {
                    _id: bucketExpression("$createdAt", window.unit),
                    count: { $sum: 1 },
                    visitors: { $addToSet: "$visitorKey" },
                },
            },
            { $project: { _id: 0, date: "$_id", count: 1, unique: { $size: "$visitors" } } },
        ]),
        hourly(match),
        topValues(VehicleStatEvent, { ...match, make: { $nin: [null, ""] } }, "make"),
        topValues(VehicleStatEvent, { ...match, city: { $nin: [null, ""] } }, "city"),
        topValues(VehicleStatEvent, { ...match, listingType: { $nin: [null, ""] } }, "listingType"),
        topItems(match),
        topValues(VehicleStatEvent, { ...match, sourceDomain: { $nin: [null, ""] } }, "sourceDomain"),
        topValues(VehicleStatEvent, { ...match, channel: { $nin: [null, ""] } }, "channel"),
        topValues(VehicleStatEvent, match, "itemType"),
    ]);

    return {
        summary: {
            total,
            uniqueVisitors: visitors,
            items,
            perVisitor: visitors.value ? round(total.value / visitors.value, 2) : 0,
        },
        trend: mergeTrends([trend], window, { count: 0, unique: 0 }),
        hourly: fillHours(hours, "count"),
        makes,
        cities,
        listingTypes,
        itemTypes,
        sources,
        channels,
        topItems: top.map((row) => ({ ...row, link: linkOf(row) })),
    };
}

export const getVehicleViews = handle("views", async (window, query) => {
    const filter = ITEM_FILTERS[query.type || "all"];
    if (!filter) return { error: "Invalid type." };
    const data = await eventTab(window, "view", filter);
    // Contacts and saves of the same items: how often a view turns into a lead.
    const contacts = await VehicleStatEvent.countDocuments(eventMatch(window, "contact", filter));
    return { ...data, contactRate: rate(contacts, data.summary.total.value) };
});

export const getVehicleExternalClicks = handle("external-clicks", (window) => eventTab(window, "external"));

export const getVehicleContacts = handle("contacts", async (window) => {
    const data = await eventTab(window, "contact");
    const [views, contacters] = await Promise.all([
        VehicleStatEvent.countDocuments(eventMatch(window, "view")),
        countUnique(VehicleStatEvent, { ...eventMatch(window, "contact"), userId: { $ne: null } }, "$userId"),
    ]);
    return { ...data, contactRate: rate(data.summary.total.value, views), signedInContacters: contacters };
});

/* ------------------------------------------------------------ alert demand */

export const getVehicleAlertDemand = handle("alert-demand", async (window) => {
    const match = currentMatch(window, "createdAt");
    const [created, active, archived, users, usersAll, cities, makes, categories, listingTypes, trend, priceBuckets, supplyRows] =
        await Promise.all([
            countPair(VehicleAlert, window, "createdAt"),
            VehicleAlert.countDocuments({ isArchived: false }),
            VehicleAlert.countDocuments({ isArchived: true }),
            uniquePair(VehicleAlert, window, "createdAt", "$user"),
            countUnique(VehicleAlert, { isArchived: false }, "$user"),
            topValues(VehicleAlert, { ...match, city: { $nin: [null, ""] } }, "city", 10, "alerts"),
            topArrayValues(VehicleAlert, match, "makes", 10, "alerts"),
            topArrayValues(VehicleAlert, match, "categories", 4, "alerts"),
            topArrayValues(VehicleAlert, match, "listingTypes", 4, "alerts"),
            trendRows(VehicleAlert, match, "createdAt", window.unit, "alerts"),
            VehicleAlert.aggregate([
                { $match: { ...match, maxPrice: { $gt: 0 } } },
                {
                    $bucket: {
                        groupBy: "$maxPrice",
                        boundaries: [0, 50000, 100000, 200000, 400000, 1000000],
                        default: "1000000+",
                        output: { alerts: { $sum: 1 } },
                    },
                },
            ]),
            Vehicle.aggregate([{ $match: { status: "Available" } }, { $group: { _id: { $toLower: "$city" }, listings: { $sum: 1 } } }]),
        ]);

    // Active alerts per city compared with the vehicles available there.
    const supply = new Map(supplyRows.map((row) => [row._id, row.listings]));
    const activeCities = await topValues(VehicleAlert, { isArchived: false, city: { $nin: [null, ""] } }, "city", 12, "alerts");
    const demandVsSupply = activeCities.map((row) => {
        const listings = supply.get(String(row.name).toLowerCase()) || 0;
        return { city: row.name, alerts: row.alerts, listings, demandPerListing: listings ? round(row.alerts / listings, 2) : null };
    });

    const PRICE_LABELS = { 0: "< 50k", 50000: "50k – 100k", 100000: "100k – 200k", 200000: "200k – 400k", 400000: "400k – 1M", "1000000+": "1M +" };

    return {
        summary: {
            created,
            active,
            archived,
            archiveRate: rate(archived, active + archived),
            uniqueUsers: users,
            activeUsers: usersAll,
            alertsPerUser: usersAll ? round(active / usersAll, 2) : 0,
            underservedCities: demandVsSupply.filter((row) => row.listings === 0 || row.demandPerListing >= 2).length,
        },
        cities,
        makes,
        categories,
        listingTypes,
        priceBuckets: priceBuckets.map((row) => ({ name: PRICE_LABELS[row._id] || String(row._id), alerts: row.alerts })),
        demandVsSupply,
        trend: mergeTrends([trend], window, { alerts: 0 }),
    };
});

/* ------------------------------------------------------------ saved demand */

const SAVED = {
    vehicle: {
        Model: SavedVehicle,
        idField: "vehicleId",
        Item: Vehicle,
        title: (item) => [item.make, item.model, item.year].filter(Boolean).join(" "),
        link: (id) => `/vehicles/${id}`,
    },
    part: { Model: SavedSparePart, idField: "partId", Item: SparePart, title: (item) => item.title, link: (id) => `/vehicles/parts/${id}` },
};

export const getVehicleSavedDemand = handle("saved-demand", async (window, query) => {
    const config = SAVED[query.type || "vehicle"];
    if (!config) return { error: "Invalid type." };

    const [current, previous, activeSaved, trend, top] = await Promise.all([
        saveStats(config.Model, window.start, null),
        window.start ? saveStats(config.Model, window.previousStart, window.previousEnd) : { saves: 0 },
        config.Model.countDocuments({ isSaved: true }),
        saveTrend(config.Model, window.start, window.unit, "saves"),
        topSaved(config.Model, window.start, config.idField, 8),
    ]);

    const items = await config.Item.find({ _id: { $in: top.map((row) => row.id) } }).lean();
    const byId = new Map(items.map((item) => [String(item._id), item]));
    const cityCounts = new Map();
    for (const row of top) {
        const city = byId.get(String(row.id))?.city;
        if (city) cityCounts.set(city, (cityCounts.get(city) || 0) + row.saves);
    }

    return {
        type: query.type || "vehicle",
        summary: {
            saves: current.saves,
            unsaves: current.unsaves,
            uniqueUsers: current.uniqueUsers,
            activeSaved,
            savesChange: changeFor(window, current.saves, previous.saves || 0),
            keepRate: rate(Math.max(current.saves - current.unsaves, 0), current.saves),
        },
        trend: mergeTrends([trend], window, { saves: 0 }),
        topListings: top
            .filter((row) => byId.has(String(row.id)))
            .map((row) => {
                const item = byId.get(String(row.id));
                return { id: String(row.id), title: config.title(item) || "—", city: item.city || "", saves: row.saves, link: config.link(row.id) };
            }),
        cities: [...cityCounts.entries()].map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count),
    };
});
