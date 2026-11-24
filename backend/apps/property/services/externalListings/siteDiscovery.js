// backend/apps/property/services/externalListings/siteDiscovery.js
//
// Finds listing URLs on a registered website, newest first, without any
// per-website code:
//
//   1. robots.txt   -> pages we are not allowed to visit + sitemap locations
//   2. sitemaps     -> every listing URL the website declares (best source)
//   3. list pages   -> the listing section / home page, following the
//                      "next page" links and ?page=N pagination
//
// A URL is a listing when its path starts with the website "pathPrefix"
// (e.g. "/listing/") or matches its optional "linkPattern" regular
// expression. For a newly added website (pathPrefix "/"), the prefix is
// detected from the links found on the website.
//
// discoverListingUrls() is an async generator that yields batches of
// candidate URLs so the collector can stop as soon as it has enough.

import axios from "axios";

import { validateExternalUrl } from "./externalListingAccess.js";

const USER_AGENT =
    "Mozilla/5.0 (compatible; MultiServicesListingCollector/1.0)";

const REQUEST_TIMEOUT = 15000;
const MAX_TEXT_BYTES = 5 * 1024 * 1024;
const MAX_REDIRECTS = 4;

// Enough list pages to find 200 new listings on most websites.
const DEFAULT_MAX_PAGES = 40;
const MAX_SITEMAP_FILES = 12;
const BATCH_SIZE = 20;

// Words that usually name the listing section of a real-estate website.
export const LISTING_KEYWORDS = [
    "property",
    "properties",
    "propriete",
    "proprietes",
    "listing",
    "listings",
    "annonce",
    "annonces",
    "ad",
    "ads",
    "bien",
    "biens",
    "immobilier",
    "immo",
    "offre",
    "offres",
    "logement",
    "logements",
    "appartement",
    "appartements",
    "maison",
    "villa",
    "terrain",
    "location",
    "vente",
    "real-estate",
    "realestate",
    "estate",
    "detail",
    "details",
    "item",
    "items",
    "post",
    "عقار",
    "عقارات",
    "اعلان",
    "إعلان",
];

const ASSET_EXTENSION =
    /\.(jpe?g|png|gif|webp|svg|ico|css|js|mjs|json|xml|pdf|zip|rar|mp4|mp3|woff2?|ttf|eot|txt)$/i;

// Paths that are never listings (account, legal, static pages...).
const NON_LISTING_SEGMENTS = new Set([
    "login",
    "logout",
    "register",
    "signup",
    "signin",
    "password",
    "account",
    "profile",
    "dashboard",
    "admin",
    "cart",
    "contact",
    "about",
    "terms",
    "privacy",
    "faq",
    "blog",
    "help",
    "search",
    "page",
    "category",
    "categories",
    "tag",
    "tags",
    "create",
    "new",
    "add",
    "publish",
    "edit",
]);

/* --------------------------------------------------
   Small helpers
-------------------------------------------------- */

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function decodeEntities(value) {
    return String(value || "")
        .replace(/&amp;/gi, "&")
        .replace(/&#x2F;/gi, "/")
        .replace(/&#47;/g, "/")
        .replace(/&quot;/gi, '"')
        .replace(/&#39;|&apos;/gi, "'")
        .replace(/\\\//g, "/")
        .trim();
}

function stripWww(hostname) {
    return String(hostname || "").toLowerCase().replace(/^www\./, "");
}

/** Absolute URL without hash; null for other websites or invalid values. */
export function toSiteUrl(value, baseUrl, siteHosts) {
    const raw = decodeEntities(value);

    if (
        !raw ||
        raw.startsWith("#") ||
        /^(mailto|tel|javascript|data|whatsapp|sms):/i.test(raw)
    ) {
        return null;
    }

    try {
        const url = new URL(raw, baseUrl);

        if (!["http:", "https:"].includes(url.protocol)) return null;

        const bare = stripWww(url.hostname);

        if (!siteHosts.some((host) => stripWww(host) === bare)) return null;

        url.protocol = "https:";
        url.hash = "";

        return url.href;
    } catch {
        return null;
    }
}

/** URL variants used to compare with what is already stored. */
export function urlVariants(href) {
    const variants = new Set([href]);

    try {
        const url = new URL(href);
        const withSlash = url.pathname.endsWith("/")
            ? url.pathname
            : `${url.pathname}/`;
        const withoutSlash =
            url.pathname.length > 1 ? url.pathname.replace(/\/+$/, "") : "/";

        const hosts = new Set([
            url.hostname,
            stripWww(url.hostname),
            `www.${stripWww(url.hostname)}`,
        ]);

        for (const host of hosts) {
            for (const pathname of [withSlash, withoutSlash]) {
                variants.add(`https://${host}${pathname}${url.search}`);
            }
        }
    } catch {
        // keep the original value only
    }

    return [...variants];
}

/* --------------------------------------------------
   HTML / XML / robots parsing (no external dependency)
-------------------------------------------------- */

/** All <a> elements: { href, rel, text }. */
export function extractAnchors(html) {
    const anchors = [];
    const regex = /<a\b([^>]*)>([\s\S]*?)<\/a>/gi;
    let match;

    while ((match = regex.exec(html))) {
        const attributes = match[1];
        const href =
            /\bhref\s*=\s*"([^"]*)"/i.exec(attributes)?.[1] ??
            /\bhref\s*=\s*'([^']*)'/i.exec(attributes)?.[1] ??
            /\bhref\s*=\s*([^\s"'>]+)/i.exec(attributes)?.[1];

        if (!href) continue;

        const rel = (/\brel\s*=\s*["']([^"']*)["']/i.exec(attributes)?.[1] || "")
            .toLowerCase();

        const ariaLabel =
            /\baria-label\s*=\s*["']([^"']*)["']/i.exec(attributes)?.[1] || "";

        const text = (match[2].replace(/<[^>]+>/g, " ") + " " + ariaLabel)
            .replace(/\s+/g, " ")
            .trim();

        anchors.push({ href, rel, text });
    }

    // <link rel="next" href="...">
    const linkRegex = /<link\b([^>]*)>/gi;

    while ((match = linkRegex.exec(html))) {
        const attributes = match[1];
        const rel = (/\brel\s*=\s*["']([^"']*)["']/i.exec(attributes)?.[1] || "")
            .toLowerCase();

        if (rel !== "next") continue;

        const href = /\bhref\s*=\s*["']([^"']*)["']/i.exec(attributes)?.[1];

        if (href) anchors.push({ href, rel, text: "" });
    }

    return anchors;
}

/**
 * Site paths written anywhere in the HTML (JSON data, scripts...).
 * Helps with websites that render their lists with JavaScript but embed
 * the data in the page.
 */
export function extractEmbeddedPaths(html, pathPrefix) {
    if (!pathPrefix || pathPrefix === "/") return [];

    const escaped = pathPrefix.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(
        `["'(\\s](?:https?:\\\\?/\\\\?/[^"'\\s/]+)?(${escaped.replace(/\//g, "\\\\?/")}[^"'\\s<>)]+)`,
        "gi"
    );

    const paths = new Set();
    let match;

    while ((match = regex.exec(html))) {
        paths.add(decodeEntities(match[1]));
    }

    return [...paths];
}

/** <loc> entries of a sitemap or sitemap index. */
export function parseSitemap(xml) {
    const isIndex = /<sitemapindex\b/i.test(xml);
    const entries = [];
    const blockRegex = isIndex
        ? /<sitemap\b[^>]*>([\s\S]*?)<\/sitemap>/gi
        : /<url\b[^>]*>([\s\S]*?)<\/url>/gi;

    let match;

    while ((match = blockRegex.exec(xml))) {
        const block = match[1];
        const loc = /<loc>\s*(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?\s*<\/loc>/i.exec(block)?.[1];
        const lastmod = /<lastmod>\s*([\s\S]*?)\s*<\/lastmod>/i.exec(block)?.[1];

        if (loc) {
            entries.push({
                loc: decodeEntities(loc),
                lastmod: lastmod ? Date.parse(lastmod) || 0 : 0,
            });
        }
    }

    // Plain-text sitemaps (one URL per line).
    if (!entries.length && !/<\w/.test(xml)) {
        for (const line of xml.split(/\r?\n/)) {
            if (/^https?:\/\//i.test(line.trim())) {
                entries.push({ loc: line.trim(), lastmod: 0 });
            }
        }
    }

    return { isIndex, entries };
}

/** robots.txt rules for every crawler ("*") + declared sitemaps. */
export function parseRobots(text) {
    const disallow = [];
    const allow = [];
    const sitemaps = [];

    let groupAgents = [];
    let readingAgents = false;

    for (const rawLine of String(text || "").split(/\r?\n/)) {
        const line = rawLine.replace(/#.*$/, "").trim();
        if (!line) continue;

        const separator = line.indexOf(":");
        if (separator === -1) continue;

        const key = line.slice(0, separator).trim().toLowerCase();
        const value = line.slice(separator + 1).trim();

        if (key === "sitemap") {
            if (value) sitemaps.push(value);
            continue;
        }

        if (key === "user-agent") {
            if (!readingAgents) groupAgents = [];
            groupAgents.push(value.toLowerCase());
            readingAgents = true;
            continue;
        }

        readingAgents = false;

        const appliesToUs =
            groupAgents.includes("*") ||
            groupAgents.some((agent) => agent && USER_AGENT.toLowerCase().includes(agent));

        if (!appliesToUs) continue;

        if (key === "disallow" && value) disallow.push(value);
        if (key === "allow" && value) allow.push(value);
    }

    const toRegex = (rule) =>
        new RegExp(
            "^" +
                rule
                    .replace(/[.+?^${}()|[\]\\]/g, "\\$&")
                    .replace(/\*/g, ".*")
                    .replace(/\\\$$/, "$")
        );

    const disallowRules = disallow.map((rule) => ({ rule, regex: toRegex(rule) }));
    const allowRules = allow.map((rule) => ({ rule, regex: toRegex(rule) }));

    return {
        sitemaps,
        isAllowed(pathWithQuery) {
            const target = pathWithQuery || "/";
            const longest = (rules) =>
                rules
                    .filter(({ regex }) => regex.test(target))
                    .reduce((max, { rule }) => Math.max(max, rule.length), -1);

            const blocked = longest(disallowRules);
            if (blocked === -1) return true;

            return longest(allowRules) >= blocked;
        },
    };
}

/* --------------------------------------------------
   Listing URL detection
-------------------------------------------------- */

function pathSegments(href) {
    try {
        return new URL(href).pathname.split("/").filter(Boolean);
    } catch {
        return [];
    }
}

function isKeyword(segment) {
    const value = decodeURIComponent(String(segment || "")).toLowerCase();
    return LISTING_KEYWORDS.includes(value);
}

/**
 * Build the function that decides whether a URL is a listing page.
 */
export function createListingMatcher({ pathPrefix = "/", linkPattern = "" } = {}) {
    let patternRegex = null;

    if (linkPattern) {
        try {
            patternRegex = new RegExp(linkPattern, "i");
        } catch {
            patternRegex = null;
        }
    }

    const prefix = String(pathPrefix || "/").toLowerCase();

    return (href) => {
        let url;

        try {
            url = new URL(href);
        } catch {
            return false;
        }

        const pathname = url.pathname;

        if (ASSET_EXTENSION.test(pathname)) return false;

        if (patternRegex) {
            return patternRegex.test(pathname + url.search);
        }

        if (prefix === "/") return false; // unknown until detected

        if (!pathname.toLowerCase().startsWith(prefix)) return false;

        const rest = pathname.slice(prefix.length).split("/").filter(Boolean);

        if (!rest.length) return false;

        // "/listing/page/2" or "/listing/category/..." are list pages.
        if (NON_LISTING_SEGMENTS.has(rest[0].toLowerCase())) return false;
        if (/^page=\d+/i.test(url.search.slice(1)) && rest.length === 0) return false;

        return true;
    };
}

/**
 * Guess the listing path prefix ("/annonce/") of a website from its links.
 * Looks for a path section, named like a listing section, holding many
 * different detail pages.
 */
export function detectListingPrefix(hrefs) {
    const groups = new Map();

    for (const href of hrefs) {
        let url;

        try {
            url = new URL(href);
        } catch {
            continue;
        }

        if (ASSET_EXTENSION.test(url.pathname)) continue;

        const segments = url.pathname.split("/").filter(Boolean);

        // Try "/a/" and "/xx/a/" (language prefix) as listing sections.
        for (let depth = 1; depth <= 2; depth += 1) {
            if (segments.length <= depth) continue;

            const sectionSegments = segments.slice(0, depth);
            const last = sectionSegments[sectionSegments.length - 1];

            if (!isKeyword(last)) continue;
            if (depth === 2 && !/^[a-z]{2}(-[a-z]{2})?$/i.test(sectionSegments[0])) continue;

            const detail = segments[depth];

            if (!detail || NON_LISTING_SEGMENTS.has(detail.toLowerCase())) continue;

            const prefix = `/${sectionSegments.join("/")}/`;

            if (!groups.has(prefix)) {
                groups.set(prefix, { details: new Set(), withId: 0 });
            }

            const group = groups.get(prefix);

            if (!group.details.has(detail)) {
                group.details.add(detail);

                // Detail pages usually carry an id or a long slug.
                if (/\d/.test(detail) || detail.length > 15) group.withId += 1;
            }
        }
    }

    let best = null;

    for (const [prefix, group] of groups) {
        const score = group.details.size + group.withId;

        if (group.details.size < 3) continue;

        if (!best || score > best.score) {
            best = { prefix, score, count: group.details.size };
        }
    }

    return best ? best.prefix : null;
}

/** Last number of a URL path, used to sort listings newest first. */
function trailingNumber(href) {
    const segments = pathSegments(href);
    const last = segments[segments.length - 1] || "";
    const match = last.match(/(\d+)(?!.*\d)/);

    return match ? Number(match[1]) : -1;
}

function isNextLink(anchor) {
    if (anchor.rel.split(/\s+/).includes("next")) return true;

    const text = anchor.text.toLowerCase();

    return /^(next|suivant|suivante|page suivante|التالي|التالية|»|›|>|→)$/.test(text);
}

function isPaginationLink(href) {
    try {
        const url = new URL(href);

        return (
            /(^|&)(page|p|pg|o|offset|start)=\d+/i.test(url.search.slice(1)) ||
            /\/page\/\d+\/?$/i.test(url.pathname)
        );
    } catch {
        return false;
    }
}

function withPageNumber(href, page) {
    const url = new URL(href);

    if (/\/page\/\d+\/?$/i.test(url.pathname)) {
        url.pathname = url.pathname.replace(/\/page\/\d+(\/?)$/i, `/page/${page}$1`);
        return url.href;
    }

    const param =
        [...url.searchParams.keys()].find((key) => /^(page|p|pg)$/i.test(key)) ||
        "page";

    url.searchParams.set(param, String(page));

    return url.href;
}

/* --------------------------------------------------
   Network
-------------------------------------------------- */

/**
 * Fetch a text resource from an allowed host. Every redirect target is
 * validated again (public address, same website).
 */
export async function fetchText(inputUrl, { allowedHosts = [], accept } = {}) {
    let current = (await validateExternalUrl(inputUrl, allowedHosts)).href;

    for (let hop = 0; hop <= MAX_REDIRECTS; hop += 1) {
        const response = await axios.get(current, {
            timeout: REQUEST_TIMEOUT,
            maxRedirects: 0,
            responseType: "text",
            transformResponse: (data) => data,
            maxContentLength: MAX_TEXT_BYTES,
            maxBodyLength: MAX_TEXT_BYTES,
            decompress: true,
            validateStatus: (status) => status >= 200 && status < 400,
            headers: {
                Accept:
                    accept ||
                    "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
                "Accept-Language": "fr,en;q=0.8,ar;q=0.6",
                "User-Agent": USER_AGENT,
            },
        });

        if (response.status >= 300) {
            const location = response.headers.location;

            if (!location) {
                throw new Error(`Redirect without location (${current}).`);
            }

            const next = new URL(location, current).href;
            current = (await validateExternalUrl(next, allowedHosts)).href;
            continue;
        }

        return {
            url: current,
            text: typeof response.data === "string" ? response.data : String(response.data ?? ""),
            contentType: String(response.headers["content-type"] || ""),
        };
    }

    throw new Error("Too many redirects.");
}

/* --------------------------------------------------
   robots.txt permission for a whole website
-------------------------------------------------- */

/**
 * Does the website allow us to visit it? A website is skipped when its
 * robots.txt forbids its home page ("Disallow: /") or its listing section
 * for every crawler or for ours.
 *
 * Returns { allowed, reason, checkedAt }. A missing or unreadable robots.txt
 * means no rule: allowed.
 */
export async function checkRobotsAccess(source, { fetchImpl = fetchText } = {}) {
    const hosts = [...new Set([...(source.hostnames || []), ...(source.hostnames || []).map(stripWww)])];
    const origin = `https://${source.hostnames?.[0] || hosts[0]}`;
    const checkedAt = new Date().toISOString();

    let response = null;
    try {
        response = await fetchImpl(`${origin}/robots.txt`, { allowedHosts: hosts, accept: "text/plain,*/*;q=0.5" });
    } catch {
        return { allowed: true, reason: "no-robots", checkedAt };
    }
    if (!response || /<html/i.test(String(response.text || "").slice(0, 500))) {
        return { allowed: true, reason: "no-robots", checkedAt };
    }

    const robots = parseRobots(response.text);
    if (!robots.isAllowed("/")) {
        return { allowed: false, reason: "robots-disallow-all", checkedAt };
    }
    const prefix = source.pathPrefix || "/";
    if (prefix !== "/" && !robots.isAllowed(prefix)) {
        return { allowed: false, reason: "robots-disallow-listings", checkedAt };
    }
    return { allowed: true, reason: "robots-allow", checkedAt };
}

/* --------------------------------------------------
   Discovery
-------------------------------------------------- */

/**
 * Async generator of candidate listing URLs for one website.
 *
 * @param {object} source   website entry from supportedSources.json
 * @param {object} options
 *   - fetchImpl(url, { allowedHosts, accept }) -> { url, text, contentType }
 *   - pageDelayMs   pause between page requests
 *   - maxPages      maximum list pages to visit
 *   - onEvent(evt)  progress callback
 *   - isCancelled() returns true to stop
 *
 * Yields { urls: string[], phase: "sitemap" | "pages", pathPrefix }.
 * The returned value (generator return) is a summary object.
 */
export async function* discoverListingUrls(source, options = {}) {
    const {
        fetchImpl = fetchText,
        pageDelayMs = 800,
        maxPages = Number(source.maxPages) || DEFAULT_MAX_PAGES,
        onEvent = () => {},
        isCancelled = () => false,
    } = options;

    const hosts = [...new Set([...(source.hostnames || []), ...(source.hostnames || []).map(stripWww)])];
    const primaryHost = source.hostnames?.[0] || hosts[0];
    const origin = `https://${primaryHost}`;

    let pathPrefix = source.pathPrefix || "/";
    let isListing = createListingMatcher({ pathPrefix, linkPattern: source.linkPattern });

    const yielded = new Set();
    const summary = {
        pagesScanned: 0,
        sitemapFiles: 0,
        candidates: 0,
        detectedPrefix: null,
        robotsBlocked: 0,
        errors: [],
    };

    const fetchSafe = async (url, accept) => {
        try {
            return await fetchImpl(url, { allowedHosts: hosts, accept });
        } catch (error) {
            summary.errors.push(`${url}: ${error.message}`);
            return null;
        }
    };

    const takeNew = (urls) => {
        const fresh = [];

        for (const url of urls) {
            if (!yielded.has(url) && isListing(url)) {
                yielded.add(url);
                fresh.push(url);
            }
        }

        summary.candidates += fresh.length;
        return fresh;
    };

    const learnPrefix = (urls) => {
        if (pathPrefix !== "/" || source.linkPattern) return;

        const detected = detectListingPrefix(urls);

        if (detected) {
            pathPrefix = detected;
            isListing = createListingMatcher({ pathPrefix });
            summary.detectedPrefix = detected;
            onEvent({ type: "prefix", pathPrefix: detected });
        }
    };

    /* ---------- 1. robots.txt ---------- */

    let robots = parseRobots("");
    const robotsResponse = await fetchSafe(`${origin}/robots.txt`, "text/plain,*/*;q=0.5");

    if (robotsResponse && !/<html/i.test(robotsResponse.text.slice(0, 500))) {
        robots = parseRobots(robotsResponse.text);
    }

    const allowedByRobots = (href) => {
        try {
            const url = new URL(href);
            const ok = robots.isAllowed(url.pathname + url.search);

            if (!ok) summary.robotsBlocked += 1;

            return ok;
        } catch {
            return false;
        }
    };

    /* ---------- 2. Sitemaps ---------- */

    const sitemapQueue = [
        ...(Array.isArray(source.sitemapUrls) ? source.sitemapUrls : []),
        ...robots.sitemaps,
        `${origin}/sitemap.xml`,
        `${origin}/sitemap_index.xml`,
    ];

    const seenSitemaps = new Set();
    const sitemapListings = [];
    const allSitemapUrls = [];

    while (sitemapQueue.length && summary.sitemapFiles < MAX_SITEMAP_FILES) {
        if (isCancelled()) return summary;

        const sitemapUrl = toSiteUrl(sitemapQueue.shift(), origin, hosts);

        if (!sitemapUrl || seenSitemaps.has(sitemapUrl)) continue;
        seenSitemaps.add(sitemapUrl);

        const response = await fetchSafe(
            sitemapUrl,
            "application/xml,text/xml,text/plain;q=0.9,*/*;q=0.5"
        );

        if (!response || /<html\b/i.test(response.text.slice(0, 1000))) continue;

        summary.sitemapFiles += 1;

        const { isIndex, entries } = parseSitemap(response.text);

        if (isIndex) {
            // Visit listing-related and most recent child sitemaps first.
            const children = entries
                .map((entry) => ({
                    ...entry,
                    weight:
                        (LISTING_KEYWORDS.some((word) =>
                            entry.loc.toLowerCase().includes(word)
                        )
                            ? 1e15
                            : 0) + entry.lastmod,
                }))
                .sort((a, b) => b.weight - a.weight)
                .map((entry) => entry.loc);

            sitemapQueue.unshift(...children);
            continue;
        }

        for (const entry of entries) {
            const href = toSiteUrl(entry.loc, origin, hosts);

            if (href) {
                allSitemapUrls.push(href);
                sitemapListings.push({ href, lastmod: entry.lastmod });
            }
        }

        onEvent({ type: "sitemap", url: sitemapUrl, entries: entries.length });
    }

    learnPrefix(allSitemapUrls);

    if (sitemapListings.length) {
        // Newest first: lastmod, then the listing number in the URL.
        const ordered = sitemapListings
            .filter(({ href }) => isListing(href) && allowedByRobots(href))
            .sort(
                (a, b) =>
                    b.lastmod - a.lastmod || trailingNumber(b.href) - trailingNumber(a.href)
            )
            .map(({ href }) => href);

        for (let index = 0; index < ordered.length; index += BATCH_SIZE) {
            if (isCancelled()) return summary;

            const fresh = takeNew(ordered.slice(index, index + BATCH_SIZE));

            if (fresh.length) {
                yield { urls: fresh, phase: "sitemap", pathPrefix };
            }
        }
    }

    /* ---------- 3. List pages ---------- */

    const expandTemplates = (templates) => {
        const urls = [];

        for (const template of templates) {
            if (template.includes("{page}")) {
                for (let page = 1; page <= maxPages; page += 1) {
                    urls.push(template.replace("{page}", String(page)));
                }
            } else {
                urls.push(template);
            }
        }

        return urls;
    };

    const configuredPages = Array.isArray(source.listPageUrls) ? source.listPageUrls : [];

    const startPages = configuredPages.length
        ? expandTemplates(configuredPages)
        : [
              ...(pathPrefix !== "/"
                  ? [`${origin}${pathPrefix}`, `${origin}${pathPrefix.replace(/\/$/, "")}`]
                  : []),
              `${origin}/`,
          ];

    const pageQueue = [];
    const queuedPages = new Set();

    const enqueuePage = (href, front = false) => {
        const url = toSiteUrl(href, origin, hosts);

        if (!url || queuedPages.has(url) || isListing(url)) return;
        if (!allowedByRobots(url)) return;

        queuedPages.add(url);

        if (front) pageQueue.unshift(url);
        else pageQueue.push(url);
    };

    startPages.forEach((page) => enqueuePage(page));

    // Pages for which the next "?page=N" was already queued.
    const guessedPagination = new Set();

    while (pageQueue.length && summary.pagesScanned < maxPages) {
        if (isCancelled()) return summary;

        const pageUrl = pageQueue.shift();

        if (summary.pagesScanned > 0 && pageDelayMs) {
            await sleep(pageDelayMs);
        }

        const response = await fetchSafe(pageUrl);
        summary.pagesScanned += 1;

        if (!response) continue;

        const anchors = extractAnchors(response.text);
        const pageLinks = anchors
            .map((anchor) => ({ ...anchor, url: toSiteUrl(anchor.href, response.url, hosts) }))
            .filter((anchor) => anchor.url);

        // A brand-new website: learn its listing section from the links.
        learnPrefix(pageLinks.map((anchor) => anchor.url));

        if (pathPrefix !== "/" && !configuredPages.length && summary.detectedPrefix) {
            // Visit the detected listing section right after the home page
            // (with and without the trailing slash: websites differ).
            enqueuePage(`${origin}${pathPrefix.replace(/\/$/, "")}`, true);
            enqueuePage(`${origin}${pathPrefix}`, true);
        }

        const embedded = extractEmbeddedPaths(response.text, pathPrefix)
            .map((path) => toSiteUrl(path, response.url, hosts))
            .filter(Boolean);

        const listingLinks = [
            ...pageLinks.map((anchor) => anchor.url),
            ...embedded,
        ].filter((url) => isListing(url) && allowedByRobots(url));

        // Newest first inside the page when listing URLs carry ids.
        listingLinks.sort((a, b) => trailingNumber(b) - trailingNumber(a));

        const fresh = takeNew(listingLinks);

        onEvent({ type: "page", url: pageUrl, found: fresh.length });

        if (fresh.length) {
            yield { urls: fresh, phase: "pages", pathPrefix };
        }

        if (configuredPages.length) continue; // configured pages only

        // Follow "next page" links first, then other pagination links.
        let foundNext = false;

        for (const anchor of pageLinks) {
            if (isNextLink(anchor)) {
                enqueuePage(anchor.url, true);
                foundNext = true;
            }
        }

        for (const anchor of pageLinks) {
            if (isPaginationLink(anchor.url)) enqueuePage(anchor.url);
        }

        // Listing section links (e.g. "/annonces?type=vente") on the home page.
        if (pageUrl === `${origin}/`) {
            for (const anchor of pageLinks) {
                const segments = pathSegments(anchor.url);

                const sectionLink =
                    (segments.length === 1 && isKeyword(segments[0])) ||
                    (segments.length === 2 &&
                        /^[a-z]{2}(-[a-z]{2})?$/i.test(segments[0]) &&
                        isKeyword(segments[1]));

                if (sectionLink) {
                    enqueuePage(anchor.url);
                }
            }
        }

        // No pagination link but listings found: try "?page=2", "?page=3"...
        if (!foundNext && fresh.length && !guessedPagination.has(pageUrl)) {
            guessedPagination.add(pageUrl);

            const base = new URL(pageUrl);
            const pathPage = /\/page\/(\d+)\/?$/i.exec(base.pathname)?.[1];
            const currentPage =
                Number(pathPage) ||
                Number(base.searchParams.get("page") || base.searchParams.get("p")) ||
                1;

            enqueuePage(withPageNumber(pageUrl, currentPage + 1), true);
        }
    }

    return summary;
}
