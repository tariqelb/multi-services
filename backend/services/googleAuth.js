// services/googleAuth.js
//
// Checks a Google ID token ("credential" from the Sign in with Google
// button) without extra packages:
//   - RS256 signature against Google's public keys (cached)
//   - issuer, audience (our client ID), expiry
//   - verified email
//
// Env: GOOGLE_CLIENT_ID (comma-separated if you use several client IDs).

import { createPublicKey, createVerify } from "crypto";

const CERTS_URL = "https://www.googleapis.com/oauth2/v3/certs";
const ISSUERS = ["accounts.google.com", "https://accounts.google.com"];
const CLOCK_SKEW_MS = 5 * 60 * 1000;
const DEFAULT_KEYS_TTL_MS = 60 * 60 * 1000;

let keyCache = { keys: new Map(), expiresAt: 0 };

export class GoogleTokenError extends Error {
    constructor(message) {
        super(message);
        this.name = "GoogleTokenError";
    }
}

export const getGoogleClientIds = () =>
    String(process.env.GOOGLE_CLIENT_ID || "")
        .split(",")
        .map((id) => id.trim())
        .filter(Boolean);

export const isGoogleLoginConfigured = () => getGoogleClientIds().length > 0;

const decodePart = (part) => {
    try {
        return JSON.parse(Buffer.from(part, "base64url").toString("utf8"));
    } catch {
        throw new GoogleTokenError("Malformed Google token.");
    }
};

const maxAgeFrom = (cacheControl) => {
    const match = /max-age=(\d+)/i.exec(cacheControl || "");
    return match ? Number(match[1]) * 1000 : DEFAULT_KEYS_TTL_MS;
};

async function loadKeys({ fetchImpl, now, force = false }) {
    if (!force && keyCache.keys.size && keyCache.expiresAt > now) {
        return keyCache.keys;
    }

    const response = await fetchImpl(CERTS_URL);

    if (!response.ok) {
        throw new Error(`Unable to load Google keys (${response.status}).`);
    }

    const body = await response.json();
    const keys = new Map();

    for (const jwk of body.keys || []) {
        if (jwk.kid && jwk.kty === "RSA") {
            keys.set(jwk.kid, createPublicKey({ key: jwk, format: "jwk" }));
        }
    }

    keyCache = {
        keys,
        expiresAt: now + maxAgeFrom(response.headers?.get?.("cache-control")),
    };

    return keys;
}

/** For tests. */
export const resetGoogleKeyCache = () => {
    keyCache = { keys: new Map(), expiresAt: 0 };
};

/**
 * Returns the token's profile:
 * { googleId, email, emailVerified, firstName, lastName, name, picture, locale }
 * Throws GoogleTokenError when the token is not valid for this app.
 */
export async function verifyGoogleIdToken(
    idToken,
    {
        audience = getGoogleClientIds(),
        fetchImpl = globalThis.fetch,
        now = Date.now(),
    } = {}
) {
    if (typeof idToken !== "string" || idToken.split(".").length !== 3) {
        throw new GoogleTokenError("Missing or malformed Google token.");
    }

    if (!audience.length) {
        throw new Error("GOOGLE_CLIENT_ID is not configured.");
    }

    const [headerPart, payloadPart, signaturePart] = idToken.split(".");
    const header = decodePart(headerPart);
    const payload = decodePart(payloadPart);

    if (header.alg !== "RS256" || !header.kid) {
        throw new GoogleTokenError("Unsupported Google token.");
    }

    // Google rotates its keys: reload once if the key is unknown.
    let keys = await loadKeys({ fetchImpl, now });
    let key = keys.get(header.kid);

    if (!key) {
        keys = await loadKeys({ fetchImpl, now, force: true });
        key = keys.get(header.kid);
    }

    if (!key) throw new GoogleTokenError("Unknown Google signing key.");

    const verifier = createVerify("RSA-SHA256");
    verifier.update(`${headerPart}.${payloadPart}`);
    verifier.end();

    if (!verifier.verify(key, Buffer.from(signaturePart, "base64url"))) {
        throw new GoogleTokenError("Invalid Google token signature.");
    }

    if (!ISSUERS.includes(payload.iss)) {
        throw new GoogleTokenError("Invalid Google token issuer.");
    }

    const audiences = Array.isArray(payload.aud) ? payload.aud : [payload.aud];

    if (!audiences.some((aud) => audience.includes(aud))) {
        throw new GoogleTokenError("This Google token was not issued for this application.");
    }

    if (!payload.exp || payload.exp * 1000 < now - CLOCK_SKEW_MS) {
        throw new GoogleTokenError("Google token expired. Please try again.");
    }

    if (payload.iat && payload.iat * 1000 > now + CLOCK_SKEW_MS) {
        throw new GoogleTokenError("Google token issued in the future.");
    }

    const emailVerified = payload.email_verified === true || payload.email_verified === "true";

    if (!payload.sub || !payload.email) {
        throw new GoogleTokenError("Google did not share an email address.");
    }

    if (!emailVerified) {
        throw new GoogleTokenError("Your Google email address is not verified.");
    }

    const name = String(payload.name || "").trim();
    const [firstFromName, ...restFromName] = name.split(/\s+/);

    return {
        googleId: String(payload.sub),
        email: String(payload.email).trim().toLowerCase(),
        emailVerified,
        firstName: String(payload.given_name || firstFromName || "").trim(),
        lastName: String(payload.family_name || restFromName.join(" ") || "").trim(),
        name,
        picture: payload.picture || "",
        locale: payload.locale || "",
    };
}
