// backend/apps/main/services/accountStatus.js
//
// Account suspension helpers.
//
//   await getAccountStatus(userId)  -> { exists, status, reason }  (cached 30 s)
//   await getSuspendedUserIds()     -> [ObjectId]                   (cached 60 s)
//   await hideSuspended(filter)     -> filter that excludes suspended publishers
//   forgetAccountStatus(userId)     -> clear caches after a change

import User from "../models/User.js";

const STATUS_TTL_MS = 30 * 1000;
const LIST_TTL_MS = 60 * 1000;

const statusCache = new Map(); // userId -> { value, expiresAt }
let suspendedCache = { ids: null, expiresAt: 0 };

export async function getAccountStatus(userId, { UserModel = User } = {}) {
    const key = String(userId || "");
    if (!key) return { exists: false, status: "active", reason: "" };

    const cached = statusCache.get(key);
    if (cached && cached.expiresAt > Date.now()) return cached.value;

    const user = await UserModel.findById(key)
        .select("accountStatus suspendedReason")
        .lean();

    const value = user
        ? {
              exists: true,
              status: user.accountStatus === "suspended" ? "suspended" : "active",
              reason: user.suspendedReason || "",
          }
        : { exists: false, status: "active", reason: "" };

    statusCache.set(key, { value, expiresAt: Date.now() + STATUS_TTL_MS });

    if (statusCache.size > 5000) {
        // Keep memory bounded.
        statusCache.delete(statusCache.keys().next().value);
    }

    return value;
}

export async function getSuspendedUserIds({ UserModel = User } = {}) {
    if (suspendedCache.ids && suspendedCache.expiresAt > Date.now()) {
        return suspendedCache.ids;
    }

    const users = await UserModel.find({ accountStatus: "suspended" })
        .select("_id")
        .lean();

    suspendedCache = {
        ids: users.map((user) => user._id),
        expiresAt: Date.now() + LIST_TTL_MS,
    };

    return suspendedCache.ids;
}

/**
 * Add "publisher is not suspended" to a MongoDB filter.
 * field: the owner field of the collection ("userId" everywhere here).
 */
export async function hideSuspended(filter = {}, field = "userId", options) {
    const ids = await getSuspendedUserIds(options);

    if (!ids.length) return filter;

    const condition = { [field]: { $nin: ids } };

    // Keep an existing condition on the same field.
    if (filter[field] !== undefined) {
        return { $and: [filter, condition] };
    }

    return { ...filter, ...condition };
}

/** True when this owner is suspended (for single publication pages). */
export async function isPublisherSuspended(ownerId, options) {
    if (!ownerId) return false;

    const id = typeof ownerId === "object" && ownerId._id ? ownerId._id : ownerId;
    const { status } = await getAccountStatus(id, options);

    return status === "suspended";
}

export function forgetAccountStatus(userId) {
    if (userId) statusCache.delete(String(userId));
    suspendedCache = { ids: null, expiresAt: 0 };
}

/** True when the logged-in requester (optional auth) is an administrator. */
export async function isRequesterAdmin(req, { UserModel = User } = {}) {
    if (!req?.user?.userId) return false;

    const user = await UserModel.findById(req.user.userId).select("role").lean();

    return user?.role === "admin";
}

/**
 * Single publication pages: hidden when the publisher is suspended,
 * except for administrators (so reviews and reports can still be checked).
 */
export async function isHiddenForRequester(ownerId, req, options) {
    if (!(await isPublisherSuspended(ownerId, options))) return false;

    return !(await isRequesterAdmin(req, options));
}
