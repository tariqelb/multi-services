// backend/apps/main/utils/socialLinks.js
//
// Social media links of a user (Settings > Social media).
//
// Each link: { platform, url, public }
//   - platform  one of SOCIAL_PLATFORMS ("instagram", "tiktok"..., "website")
//   - url       always a clean https:// address on the platform's own domain
//               ("@tariq" typed for Instagram becomes https://instagram.com/tariq)
//   - public    shown on the public profiles (property and vehicles) or not
//
// Pure functions (no database).

export const MAX_SOCIAL_LINKS = 10;
const MAX_URL_LENGTH = 300;
const HANDLE = /^[A-Za-z0-9._-]{1,60}$/;

// domains: accepted hosts (subdomains included: m.facebook.com, fr.linkedin.com).
// fromHandle: address built from a user name typed alone ("@name" or "name").
export const SOCIAL_PLATFORMS = {
    instagram: { domains: ["instagram.com", "instagr.am"], fromHandle: (h) => `https://www.instagram.com/${h}` },
    facebook: { domains: ["facebook.com", "fb.com", "fb.me"], fromHandle: (h) => `https://www.facebook.com/${h}` },
    tiktok: { domains: ["tiktok.com"], fromHandle: (h) => `https://www.tiktok.com/@${h}` },
    youtube: { domains: ["youtube.com", "youtu.be"], fromHandle: (h) => `https://www.youtube.com/@${h}` },
    linkedin: { domains: ["linkedin.com"], fromHandle: (h) => `https://www.linkedin.com/in/${h}` },
    x: { domains: ["x.com", "twitter.com"], fromHandle: (h) => `https://x.com/${h}` },
    snapchat: { domains: ["snapchat.com"], fromHandle: (h) => `https://www.snapchat.com/add/${h}` },
    telegram: { domains: ["t.me", "telegram.me"], fromHandle: (h) => `https://t.me/${h}` },
    threads: { domains: ["threads.net", "threads.com"], fromHandle: (h) => `https://www.threads.net/@${h}` },
    website: { domains: null, fromHandle: null },
};
export const PLATFORM_IDS = Object.keys(SOCIAL_PLATFORMS);

// Query parameters that only track the click.
const TRACKING_PARAM = /^(utm_[a-z]+|igsh|igshid|si|fbclid|gclid|mibextid|ref|ref_src|_t|_r|is_from_webapp|sender_device)$/i;

const PRIVATE_HOST =
    /^(localhost|.*\.local|.*\.internal|0\.0\.0\.0|127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|169\.254\.|\[?::1\]?|\[?f[cd][0-9a-f]{2}:)/i;

function hostMatches(hostname, domains) {
    const host = hostname.toLowerCase().replace(/\.$/, "");
    return domains.some((domain) => host === domain || host.endsWith(`.${domain}`));
}

/**
 * Turn what the user typed into a clean address.
 * Returns { url } or { error } (error: "platform" | "empty" | "invalid" | "domain").
 */
export function normalizeSocialLink(platform, input) {
    const config = SOCIAL_PLATFORMS[platform];
    if (!config) return { error: "platform" };

    let value = String(input || "").trim();
    if (!value) return { error: "empty" };
    if (value.length > MAX_URL_LENGTH) return { error: "invalid" };

    // A user name alone: "@tariq", "tariq.dev" (not "instagram.com" typed alone).
    const handle = value.replace(/^@/, "");
    if (config.fromHandle && HANDLE.test(handle) && !hostMatches(handle, config.domains)) {
        return { url: config.fromHandle(handle) };
    }

    if (!/^[a-z][a-z0-9+.-]*:/i.test(value)) value = `https://${value.replace(/^\/+/, "")}`;

    let url;
    try {
        url = new URL(value);
    } catch {
        return { error: "invalid" };
    }

    if (!["http:", "https:"].includes(url.protocol)) return { error: "invalid" };
    if (url.username || url.password) return { error: "invalid" };
    if (!url.hostname.includes(".") || PRIVATE_HOST.test(url.hostname) || /^\d+(\.\d+){3}$/.test(url.hostname)) {
        return { error: "invalid" };
    }
    if (config.domains && !hostMatches(url.hostname, config.domains)) return { error: "domain" };

    url.protocol = "https:";
    url.hash = "";
    for (const key of [...url.searchParams.keys()]) {
        if (TRACKING_PARAM.test(key)) url.searchParams.delete(key);
    }

    // A profile address needs a path ("instagram.com" alone is not a profile).
    if (config.domains && url.pathname.replace(/\/+$/, "") === "" && !url.search) return { error: "invalid" };

    const clean = url.toString().replace(/\/$/, "");
    if (clean.length > MAX_URL_LENGTH) return { error: "invalid" };
    return { url: clean };
}

/**
 * Read the Settings form: [{ platform, url, public }].
 * Returns { links, errors } where errors is [{ index, platform, error }].
 * Duplicates are dropped; at most MAX_SOCIAL_LINKS links are kept.
 */
export function cleanSocialLinks(input) {
    const items = Array.isArray(input) ? input : [];
    const links = [];
    const errors = [];
    const seen = new Set();

    items.forEach((item, index) => {
        const platform = String(item?.platform || "").toLowerCase();
        const result = normalizeSocialLink(platform, item?.url);
        if (result.error) {
            if (result.error !== "empty") errors.push({ index, platform, error: result.error });
            return;
        }
        const key = result.url.toLowerCase();
        if (seen.has(key)) return;
        seen.add(key);
        links.push({ platform, url: result.url, public: item?.public === true || item?.public === "true" });
    });

    if (links.length > MAX_SOCIAL_LINKS) {
        errors.push({ index: MAX_SOCIAL_LINKS, platform: "", error: "tooMany" });
    }

    return { links: links.slice(0, MAX_SOCIAL_LINKS), errors };
}

/** All links of the user (their own profile and Settings). */
export function socialLinksOf(user) {
    return (user?.socialLinks || [])
        .filter((link) => link?.url && SOCIAL_PLATFORMS[link.platform])
        .map((link) => ({ platform: link.platform, url: link.url, public: link.public === true }));
}

/** Links shown to visitors: only the public ones. */
export function publicSocialLinksOf(user) {
    return socialLinksOf(user)
        .filter((link) => link.public)
        .map(({ platform, url }) => ({ platform, url }));
}
