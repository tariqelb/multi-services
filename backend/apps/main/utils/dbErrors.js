// backend/apps/main/utils/dbErrors.js
//
// MongoDB connection problems (Atlas unreachable, network down, IP not
// allowed in Atlas "Network Access"...). Requests that only record
// statistics (visit heartbeats every few seconds) must not flood the logs
// with the same stack trace: one short line per minute is enough.
//
//   if (!isDatabaseReady()) return res.status(503).json(...)
//   catch (error) { if (isDatabaseConnectionError(error)) logDatabaseErrorOnce("Track visit", error); }

import mongoose from "mongoose";

const CONNECTION_ERRORS = new Set([
    "MongoServerSelectionError",
    "MongoNetworkError",
    "MongoNetworkTimeoutError",
    "MongoNotConnectedError",
    "MongoTopologyClosedError",
    "MongooseServerSelectionError",
]);

/** true while Mongoose is connected. */
export const isDatabaseReady = () => mongoose.connection.readyState === 1;

export function isDatabaseConnectionError(error) {
    let current = error;
    for (let depth = 0; current && depth < 4; depth += 1) {
        if (CONNECTION_ERRORS.has(current.name)) return true;
        current = current.cause;
    }
    return false;
}

/** Short reason: "tlsv1 alert internal error", "connect ETIMEDOUT ..." */
export function databaseErrorReason(error) {
    let current = error;
    let reason = error?.message || String(error);
    for (let depth = 0; current && depth < 4; depth += 1) {
        if (current.reason && typeof current.reason === "string") reason = current.reason;
        else if (current.message) reason = current.message;
        current = current.cause;
    }
    return String(reason).replace(/^[0-9A-F]+:error:[0-9A-F]+:/i, "").split("\n")[0].slice(0, 200);
}

const lastLogged = new Map();
const LOG_EVERY_MS = 60 * 1000;

/** One short line per label and per minute, with how many were skipped. */
export function logDatabaseErrorOnce(label, error, { now = Date.now(), log = console.warn } = {}) {
    const entry = lastLogged.get(label) || { at: -Infinity, skipped: 0 };
    if (now - entry.at < LOG_EVERY_MS) {
        entry.skipped += 1;
        lastLogged.set(label, entry);
        return false;
    }
    const skipped = entry.skipped ? ` (${entry.skipped} similar errors hidden)` : "";
    log(`[Database] ${label}: database unreachable - ${databaseErrorReason(error)}${skipped}`);
    lastLogged.set(label, { at: now, skipped: 0 });
    return true;
}
