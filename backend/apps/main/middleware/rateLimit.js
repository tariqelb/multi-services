// backend/apps/main/middleware/rateLimit.js
//
// Small in-memory rate limiter (no dependency).
//
//   router.post("/login", loginLimiter, login);
//
// Counts requests per key (IP by default) in a fixed time window and answers
// 429 when the limit is reached. Memory is per server process: fine for one
// instance. With several instances, move to a shared store (Redis).

const stores = new Set();

function clientIp(req) {
    return req.ip || req.socket?.remoteAddress || "unknown";
}

/**
 * @param {object} options
 *   - name      label used in logs
 *   - windowMs  window length in ms
 *   - max       allowed requests per key and window
 *   - key       (req) => string, default: client IP
 *   - message   error message
 */
export function createRateLimiter({
    name = "requests",
    windowMs = 15 * 60 * 1000,
    max = 100,
    key = clientIp,
    message = "Too many requests. Please try again later.",
} = {}) {
    const hits = new Map(); // key -> { count, resetAt }
    stores.add(hits);

    return function rateLimit(req, res, next) {
        const now = Date.now();
        const id = `${name}:${key(req) || clientIp(req)}`;
        let entry = hits.get(id);

        if (!entry || entry.resetAt <= now) {
            entry = { count: 0, resetAt: now + windowMs };
            hits.set(id, entry);
        }

        entry.count += 1;

        const remaining = Math.max(0, max - entry.count);
        const retryAfter = Math.ceil((entry.resetAt - now) / 1000);

        res.setHeader("RateLimit-Limit", String(max));
        res.setHeader("RateLimit-Remaining", String(remaining));
        res.setHeader("RateLimit-Reset", String(retryAfter));

        if (entry.count > max) {
            res.setHeader("Retry-After", String(retryAfter));

            return res.status(429).json({
                success: false,
                code: "TOO_MANY_REQUESTS",
                message,
                retryAfter,
            });
        }

        return next();
    };
}

// Remove expired entries every 10 minutes.
const cleanup = setInterval(() => {
    const now = Date.now();

    for (const hits of stores) {
        for (const [id, entry] of hits) {
            if (entry.resetAt <= now) hits.delete(id);
        }
    }
}, 10 * 60 * 1000);

cleanup.unref?.();

const emailOf = (req) => String(req.body?.email || "").trim().toLowerCase();
const userOf = (req) => req.user?.userId || clientIp(req);

const MINUTE = 60 * 1000;

// Password guessing: per IP + email, and per IP overall.
export const loginLimiter = [
    createRateLimiter({
        name: "login-account",
        windowMs: 15 * MINUTE,
        max: 10,
        key: (req) => `${clientIp(req)}|${emailOf(req)}`,
        message: "Too many login attempts. Please wait 15 minutes and try again.",
    }),
    createRateLimiter({
        name: "login-ip",
        windowMs: 15 * MINUTE,
        max: 50,
        message: "Too many login attempts. Please wait 15 minutes and try again.",
    }),
];

export const signupLimiter = createRateLimiter({
    name: "signup",
    windowMs: 60 * MINUTE,
    max: 10,
    message: "Too many sign-up attempts. Please try again later.",
});

// Emails and SMS cost money and can be used to spam people.
export const emailSendLimiter = createRateLimiter({
    name: "email-send",
    windowMs: 60 * MINUTE,
    max: 5,
    key: (req) => `${clientIp(req)}|${emailOf(req)}`,
    message: "Too many emails requested. Please try again in an hour.",
});

export const codeCheckLimiter = createRateLimiter({
    name: "code-check",
    windowMs: 15 * MINUTE,
    max: 10,
    key: (req) => `${userOf(req)}|${emailOf(req)}`,
    message: "Too many attempts. Please wait 15 minutes and try again.",
});

export const verificationSendLimiter = createRateLimiter({
    name: "verification-send",
    windowMs: 60 * MINUTE,
    max: 5,
    key: userOf,
    message: "Too many codes requested. Please try again in an hour.",
});

export const verificationCheckLimiter = createRateLimiter({
    name: "verification-check",
    windowMs: 15 * MINUTE,
    max: 10,
    key: userOf,
    message: "Too many attempts. Please wait 15 minutes and try again.",
});

// Search: generous, only stops scripts hammering the database.
export const searchLimiter = createRateLimiter({
    name: "search",
    windowMs: MINUTE,
    max: 90,
    message: "Too many searches. Please wait a minute and try again.",
});
