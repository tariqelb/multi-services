// backend/apps/main/utils/statsKit.js
//
// Small building blocks for the admin statistics pages of every service
// (property, vehicles...), on top of utils/analytics.js:
//
//   const window = getRangeWindow(req.query.range);
//   await countPair(Model, window, "createdAt", { status: "Available" })
//       -> { value, previous, change }
//   await trendRows(Model, currentMatch(window, "createdAt"), "createdAt", window.unit, "listings")
//   mergeTrends([rowsA, rowsB], window, { listings: 0, saves: 0 })
//   await saveStats(SavedVehicle, window.start, null)  -> { saves, unsaves, uniqueUsers }

import {
    buildDateFilter,
    bucketExpression,
    changeFor,
    currentMatch,
    fillSeries,
    groupCount,
    previousMatch,
    uniqueCountStages,
} from "./analytics.js";

export const countPair = async (Model, window, field, base = {}) => {
    const [value, previous] = await Promise.all([
        Model.countDocuments(currentMatch(window, field, base)),
        window.start ? Model.countDocuments(previousMatch(window, field, base)) : Promise.resolve(0),
    ]);
    return { value, previous, change: changeFor(window, value, previous) };
};

export const countUnique = async (Model, match, keyField) => {
    const [row] = await Model.aggregate([{ $match: match }, ...uniqueCountStages(keyField)]);
    return row?.count || 0;
};

export const uniquePair = async (Model, window, field, keyField, base = {}) => {
    const [value, previous] = await Promise.all([
        countUnique(Model, currentMatch(window, field, base), keyField),
        window.start ? countUnique(Model, previousMatch(window, field, base), keyField) : Promise.resolve(0),
    ]);
    return { value, previous, change: changeFor(window, value, previous) };
};

export const trendRows = (Model, match, dateField, unit, valueKey) =>
    Model.aggregate([
        { $match: match },
        { $group: { _id: bucketExpression(`$${dateField}`, unit), [valueKey]: { $sum: 1 } } },
        { $project: { _id: 0, date: "$_id", [valueKey]: 1 } },
    ]);

/** One row per date with every series ({ date, listings, saves, ... }), no gaps. */
export const mergeTrends = (rowsList, window, defaults = {}) => {
    const merged = new Map();
    for (const rows of rowsList) {
        for (const row of rows || []) {
            const entry = merged.get(row.date) || { date: row.date };
            for (const [key, value] of Object.entries(row)) {
                if (key !== "date") entry[key] = (entry[key] || 0) + value;
            }
            merged.set(row.date, entry);
        }
    }
    return fillSeries(Array.from(merged.values()), window, defaults);
};

/** [{ name, count }] of a text field in the matching documents. */
export const topValues = (Model, match, field, limit = 8, valueKey = "count") =>
    Model.aggregate([{ $match: match }, ...groupCount(`$${field}`, { valueKey, limit })]);

/** [{ name, count }] of the values of an array field (alert cities, makes...). */
export const topArrayValues = (Model, match, field, limit = 8, valueKey = "count") =>
    Model.aggregate([{ $match: match }, { $unwind: `$${field}` }, ...groupCount(`$${field}`, { valueKey, limit })]);

/**
 * Save / unsave events of a "saved" collection that keeps activityHistory
 * ([{ action: "saved" | "unsaved", at }]). Older documents without history
 * count as one "saved" event at savedAt.
 */
export const saveEventStages = (start, end, base = {}) => {
    const dateFilter = buildDateFilter(start, end);
    return [
        ...(Object.keys(base).length ? [{ $match: base }] : []),
        {
            $project: {
                doc: "$$ROOT",
                events: {
                    $cond: [
                        { $gt: [{ $size: { $ifNull: ["$activityHistory", []] } }, 0] },
                        "$activityHistory",
                        {
                            $cond: [
                                { $ne: ["$isSaved", false] },
                                [{ action: "saved", at: { $ifNull: ["$savedAt", "$createdAt"] } }],
                                [],
                            ],
                        },
                    ],
                },
            },
        },
        { $unwind: "$events" },
        { $match: { "events.at": dateFilter || { $ne: null } } },
    ];
};

export const saveStats = async (Model, start, end, base = {}) => {
    const [row] = await Model.aggregate([
        ...saveEventStages(start, end, base),
        {
            $group: {
                _id: null,
                saves: { $sum: { $cond: [{ $eq: ["$events.action", "saved"] }, 1, 0] } },
                unsaves: { $sum: { $cond: [{ $eq: ["$events.action", "unsaved"] }, 1, 0] } },
                users: { $addToSet: { $cond: [{ $eq: ["$events.action", "saved"] }, "$doc.userId", null] } },
            },
        },
        {
            $project: {
                _id: 0,
                saves: 1,
                unsaves: 1,
                uniqueUsers: { $size: { $setDifference: ["$users", [null]] } },
            },
        },
    ]);
    return row || { saves: 0, unsaves: 0, uniqueUsers: 0 };
};

export const saveTrend = (Model, start, unit, valueKey = "saves", base = {}) =>
    Model.aggregate([
        ...saveEventStages(start, null, base),
        { $match: { "events.action": "saved" } },
        { $group: { _id: bucketExpression("$events.at", unit), [valueKey]: { $sum: 1 } } },
        { $project: { _id: 0, date: "$_id", [valueKey]: 1 } },
    ]);

/** Most saved items in the window: [{ id, saves }] (join titles yourself). */
export const topSaved = (Model, start, idField, limit = 8, base = {}) =>
    Model.aggregate([
        ...saveEventStages(start, null, base),
        { $match: { "events.action": "saved" } },
        { $group: { _id: `$doc.${idField}`, saves: { $sum: 1 } } },
        { $sort: { saves: -1 } },
        { $limit: limit },
        { $project: { _id: 0, id: "$_id", saves: 1 } },
    ]);
