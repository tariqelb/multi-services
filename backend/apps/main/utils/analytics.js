// backend/apps/main/utils/analytics.js
// Shared helpers for every dashboard analytics controller.

import crypto from "crypto";

export const ANALYTICS_TIMEZONE = "Africa/Casablanca";
export const DAY_MS = 24 * 60 * 60 * 1000;

export const RANGE_DAYS = {
    "7d": 7,
    "30d": 30,
    "90d": 90,
    "365d": 365,
};

export const ALLOWED_RANGES = [...Object.keys(RANGE_DAYS), "all"];

const BOT_PATTERN =
    /bot|crawler|spider|crawling|headless|lighthouse|preview|facebookexternalhit|slurp|bingpreview/i;

const dateKeyFormatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: ANALYTICS_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
});

const partsFormatter = new Intl.DateTimeFormat("en-US", {
    timeZone: ANALYTICS_TIMEZONE,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
});

// -----------------------------------------------------------------------------
// Dates and ranges
// -----------------------------------------------------------------------------

export const parseRange = (value, fallback = "30d") =>
    ALLOWED_RANGES.includes(value) ? value : fallback;

// YYYY-MM-DD in the analytics time zone.
export const getDateKey = (date = new Date()) =>
    dateKeyFormatter.format(new Date(date));

const getTimeZoneOffsetMs = (date) => {
    const values = {};

    for (const part of partsFormatter.formatToParts(date)) {
        values[part.type] = Number(part.value);
    }

    const asUtc = Date.UTC(
        values.year,
        values.month - 1,
        values.day,
        values.hour,
        values.minute,
        values.second
    );

    return asUtc - Math.floor(date.getTime() / 1000) * 1000;
};

// Local midnight (Africa/Casablanca) for the given instant.
export const startOfDay = (date = new Date()) => {
    const [year, month, day] = getDateKey(date).split("-").map(Number);
    const utcMidnight = Date.UTC(year, month - 1, day);

    return new Date(
        utcMidnight - getTimeZoneOffsetMs(new Date(utcMidnight))
    );
};

/**
 * Current and previous periods for a range.
 * "30d" = today plus the 29 previous local days.
 */
export const getRangeWindow = (value, now = new Date()) => {
    const range = parseRange(value);

    if (range === "all") {
        return {
            range,
            days: null,
            start: null,
            end: now,
            previousStart: null,
            previousEnd: null,
            unit: "month",
        };
    }

    const days = RANGE_DAYS[range];

    const start = startOfDay(
        new Date(now.getTime() - (days - 1) * DAY_MS)
    );

    const previousStart = startOfDay(
        new Date(start.getTime() - days * DAY_MS + DAY_MS / 2)
    );

    return {
        range,
        days,
        start,
        end: now,
        previousStart,
        previousEnd: start,
        unit: days <= 90 ? "day" : "month",
    };
};

export const buildDateFilter = (start, end) => {
    const filter = {};

    if (start) filter.$gte = start;
    if (end) filter.$lt = end;

    return Object.keys(filter).length ? filter : null;
};

export const withDate = (field, start, end, base = {}) => {
    const filter = buildDateFilter(start, end);

    return filter ? { ...base, [field]: filter } : { ...base };
};

export const currentMatch = (window, field, base = {}) =>
    withDate(field, window.start, null, base);

export const previousMatch = (window, field, base = {}) =>
    window.start
        ? withDate(field, window.previousStart, window.previousEnd, base)
        : null;

// -----------------------------------------------------------------------------
// Aggregation building blocks
// -----------------------------------------------------------------------------

export const bucketExpression = (field, unit = "day") => ({
    $dateToString: {
        format: unit === "day" ? "%Y-%m-%d" : "%Y-%m",
        date: field,
        timezone: ANALYTICS_TIMEZONE,
    },
});

export const hourExpression = (field) => ({
    $hour: {
        date: field,
        timezone: ANALYTICS_TIMEZONE,
    },
});

const cleanText = (field) => ({
    $trim: {
        input: { $toString: { $ifNull: [field, ""] } },
    },
});

/**
 * Count documents by a text field, case-insensitively.
 * Output: [{ name, [valueKey] }]
 */
export const groupCount = (
    field,
    { valueKey = "count", limit = 0, unknown = "Unknown" } = {}
) => {
    const stages = [
        {
            $group: {
                _id: { $toLower: cleanText(field) },
                name: { $first: cleanText(field) },
                [valueKey]: { $sum: 1 },
            },
        },
        { $sort: { [valueKey]: -1, name: 1 } },
    ];

    if (limit) stages.push({ $limit: limit });

    stages.push({
        $project: {
            _id: 0,
            name: {
                $cond: [{ $eq: ["$name", ""] }, unknown, "$name"],
            },
            [valueKey]: 1,
        },
    });

    return stages;
};

// Memory-friendly distinct count: [{ count }]
export const uniqueCountStages = (field) => [
    { $match: { [field.replace(/^\$/, "")]: { $ne: null } } },
    { $group: { _id: field } },
    { $count: "count" },
];

// -----------------------------------------------------------------------------
// Series helpers
// -----------------------------------------------------------------------------

/**
 * Add zero rows for missing days/months so charts have no gaps.
 * Rows must contain a "date" key produced by bucketExpression().
 */
export const fillSeries = (rows = [], window, defaults = {}) => {
    const byKey = new Map(rows.map((row) => [row.date, row]));

    if (!window.start) {
        return [...rows]
            .sort((a, b) => String(a.date).localeCompare(String(b.date)))
            .map((row) => ({ ...defaults, ...row }));
    }

    const keys = [];
    const seen = new Set();

    for (
        let time = window.start.getTime() + DAY_MS / 2;
        time < window.end.getTime() + DAY_MS / 2;
        time += DAY_MS
    ) {
        const dayKey = getDateKey(new Date(time));
        const key = window.unit === "day" ? dayKey : dayKey.slice(0, 7);

        if (!seen.has(key)) {
            seen.add(key);
            keys.push(key);
        }
    }

    return keys.map((date) => ({
        ...defaults,
        ...(byKey.get(date) || {}),
        date,
    }));
};

export const fillHours = (rows = [], valueKey = "count") => {
    const byHour = new Map(rows.map((row) => [row.hour, row[valueKey]]));

    return Array.from({ length: 24 }, (_, hour) => ({
        hour,
        [valueKey]: byHour.get(hour) || 0,
    }));
};

// -----------------------------------------------------------------------------
// Numbers
// -----------------------------------------------------------------------------

// null = "new" (previous period was zero but current is not).
export const percentChange = (current, previous) => {
    const now = Number(current) || 0;
    const before = Number(previous) || 0;

    if (!before) return now ? null : 0;

    return Math.round(((now - before) / before) * 1000) / 10;
};

// Adds { change } only when the range has a previous period.
export const changeFor = (window, current, previous) =>
    window.start ? percentChange(current, previous) : undefined;

export const rate = (numerator, denominator) =>
    denominator
        ? Math.round((Number(numerator) / Number(denominator)) * 1000) / 10
        : 0;

export const round = (value, digits = 1) => {
    const factor = 10 ** digits;

    return Math.round((Number(value) || 0) * factor) / factor;
};

// -----------------------------------------------------------------------------
// Requests
// -----------------------------------------------------------------------------

export const getPagination = (
    query = {},
    { defaultLimit = 10, maxLimit = 50 } = {}
) => {
    const page = Math.max(1, Number.parseInt(query.page, 10) || 1);

    const limit = Math.min(
        maxLimit,
        Math.max(1, Number.parseInt(query.limit, 10) || defaultLimit)
    );

    return { page, limit, skip: (page - 1) * limit };
};

export const buildPagination = (page, limit, total) => ({
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
});

export const isBotRequest = (req) =>
    BOT_PATTERN.test(req.get("user-agent") || "");

/**
 * Stable, privacy-friendly key used to count unique visitors.
 * Priority: logged-in user, then the frontend visitor ID header,
 * then a hash of IP + user agent (raw IP is never stored).
 */
export const getVisitorKey = (req) => {
    if (req.user?.userId) return `u:${req.user.userId}`;

    const visitorId = req.get("x-visitor-id");

    if (
        typeof visitorId === "string" &&
        visitorId.length >= 10 &&
        visitorId.length <= 100
    ) {
        return `v:${visitorId}`;
    }

    const fingerprint = `${req.ip || ""}|${req.get("user-agent") || ""}`;

    return `h:${crypto
        .createHash("sha256")
        .update(fingerprint)
        .digest("hex")
        .slice(0, 32)}`;
};

export const getReferrer = (req) =>
    String(req.get("referer") || "").slice(0, 500);
