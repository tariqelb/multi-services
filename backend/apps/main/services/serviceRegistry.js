// backend/apps/main/services/serviceRegistry.js
//
// The main service never imports a service (property, cars...).
// Each service registers what main needs to know about its users instead:
//
//   registerService("property", {
//       userListDefaults: { publishedProperties: 0, ... },  // counters for the admin users list
//       getUserListStats: async (userIds) => Map(userId -> { publishedProperties, ... }),
//       getUserDetailStats: async (userId) => ({ totalPublications, ... }),
//       onUserDeleted: async (userId) => { ... },          // remove the user's data in this service
//   });

const services = new Map();

export function registerService(name, hooks = {}) {
    services.set(name, hooks);
}

export function getRegisteredServices() {
    return [...services.keys()];
}

const hooksWith = (key) => [...services.entries()].filter(([, hooks]) => typeof hooks[key] === "function");

/** Counters per user for the admin users list, merged from every service. */
export async function getUserListStats(userIds) {
    const defaults = {};
    const byUser = new Map();

    for (const hooks of services.values()) Object.assign(defaults, hooks.userListDefaults);

    const results = await Promise.all(hooksWith("getUserListStats").map(([, hooks]) => hooks.getUserListStats(userIds)));

    for (const result of results) {
        for (const [userId, stats] of result || []) {
            byUser.set(String(userId), { ...byUser.get(String(userId)), ...stats });
        }
    }

    return { defaults, byUser };
}

/** Statistics for the admin user page, merged from every service. */
export async function getUserDetailStats(userId) {
    const results = await Promise.all(hooksWith("getUserDetailStats").map(([, hooks]) => hooks.getUserDetailStats(userId)));
    return Object.assign({}, ...results);
}

/** Called before an account is permanently deleted. A failing service stops the deletion. */
export async function deleteUserData(userId) {
    for (const [name, hooks] of hooksWith("onUserDeleted")) {
        try {
            await hooks.onUserDeleted(userId);
        } catch (error) {
            error.message = `[${name}] ${error.message}`;
            throw error;
        }
    }
}

/**
 * What a user already publishes, to prefill "Receive requests" in Settings.
 * Each service may return { property: {...} } or { vehicle: {...} } with
 * { cities, transactions, types | categories, count }.
 */
export async function getPublishingActivity(userId) {
    const results = await Promise.all(
        hooksWith("getPublishingActivity").map(([, hooks]) => hooks.getPublishingActivity(userId).catch(() => ({})))
    );
    return Object.assign({}, ...results);
}

/**
 * Summary of a listing linked in a reply to a request (only the owner's own
 * listings): { kind, id, title, image, price, priceUnit, city, link } or null.
 */
export async function getListingSummary({ kind, id, ownerId }) {
    for (const [, hooks] of hooksWith("getListingSummary")) {
        const summary = await hooks.getListingSummary({ kind, id, ownerId });
        if (summary) return summary;
    }
    return null;
}
