// backend/apps/vehicles/services/externalListings/live/liveSearch.js
//
// Real-time search on the vehicle listing websites (Avito, Moteur.ma...):
//
//   for every website of the search, at the same time:
//     1. robots.txt: a website (or its results page) that forbids visiting
//        it is skipped;
//     2. A - its own results page is opened, built from the search
//        (searchUrlBuilder), and its listing cards are read (resultPageReader);
//     3. B - when A gives nothing (no known search address, page loaded
//        with JavaScript, error), the Brave Search API is asked for pages of
//        that website (searchEngineFallback, needs BRAVE_SEARCH_API_KEY);
//   a website with fewer than 20 matching listings on its first results
//   page is read further (its next pages, up to 5 pages / 200 cards);
//   then every card is checked against the search (city, car / moto /
//   part, offer, make, model, max price). Listings without a picture get one from their own page
//   (up to 60 pages opened). Up to 200 are returned: listings with a
//   picture first, then the others, and in each group the websites take
//   turns (1st of each website, then 2nd of each...) so every website shows.
//
// Nothing is stored in the database. The same search is answered from
// memory for 10 minutes so the websites are not asked again and again.

import { fetchText, parseRobots } from "../siteDiscovery.js";
import { updateSupportedSource } from "../sources/externalListingSource.js";
import { classifyListing, mentionsCity } from "../listingClassifier.js";
import { buildSearchUrls } from "./searchUrlBuilder.js";
import { readResultPageWithNext } from "./resultPageReader.js";
import { extractPageMetadata } from "../metadataExtractor.js";
import { isSearchEngineEnabled, searchEngineMaxSites, searchWebsiteWithEngine } from "./searchEngineFallback.js";
import { checkVehicleListing } from "../vehicleCheck.js";

export const MAX_RESULTS = 200;
const PAGE_TIMEOUT = 12000;
// A website with fewer matching listings than this is read further.
export const MIN_PER_SITE = 20;
const MAX_PAGES_PER_SEARCH = 5;
const MAX_CARDS_PER_SITE = 200;
// Pictures taken from the listing's own page when the card has none.
const MAX_PICTURE_LOOKUPS = 60;
const PICTURE_CONCURRENCY = 8;
const PICTURE_TIMEOUT = 8000;
const ROBOTS_TTL = 6 * 60 * 60 * 1000;
const CACHE_TTL = 10 * 60 * 1000;
const CACHE_MAX = 100;

const stripWww = (host) => String(host || "").toLowerCase().replace(/^www\./, "");

const withTimeout = (promise, ms) =>
    Promise.race([promise, new Promise((_resolve, reject) => setTimeout(() => reject(new Error("timeout")), ms))]);

/* ---------- robots.txt (kept 6 hours per website) ---------- */

const robotsCache = new Map();

async function robotsFor(source, fetchImpl) {
    const host = stripWww(source.hostnames[0]);
    const cached = robotsCache.get(host);
    if (cached && cached.until > Date.now()) return cached.robots;

    let robots = { isAllowed: () => true };
    try {
        const hosts = [...new Set([...source.hostnames, ...source.hostnames.map(stripWww)])];
        const response = await withTimeout(fetchImpl(`https://${source.hostnames[0]}/robots.txt`, { allowedHosts: hosts, accept: "text/plain,*/*;q=0.5" }), 6000);
        if (response?.text && !/<html/i.test(response.text.slice(0, 500))) robots = parseRobots(response.text);
    } catch {
        // No robots.txt: no rule.
    }
    robotsCache.set(host, { robots, until: Date.now() + ROBOTS_TTL });
    return robots;
}

/* ---------- matching ---------- */

const words = (value) =>
    String(value || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .split(/[^a-z0-9]+/)
        .filter(Boolean);

/** Does the listing name the model the user typed ("Logan", "Classe C")? */
export function mentionsModel(listing, model) {
    const wanted = words(model);
    if (!wanted.length) return true;
    const text = ` ${words(`${listing.model || ""} ${listing.title || ""} ${listing.sourceUrl || ""}`).join(" ")} `;
    return wanted.every((word) => text.includes(` ${word} `) || text.includes(word));
}

/**
 * Does a listing answer the search? Score (higher is better) or -1.
 *
 * Strict on what the user chose: the city, the offer, the category (car /
 * moto / part), the make and the model must be stated by the listing itself
 * (its title, text or address), or by a results page that really filtered
 * them (see trustPageFilters). A listing that does not say, or says
 * something else, is left out. Only a missing price is accepted (lower
 * score) when a maximum is set.
 */
export function scoreListing(guessed, criteria) {
    let score = 0;

    if (criteria.city) {
        if (guessed.city !== criteria.city) return -1;
        score += 4;
    }
    if (criteria.listingType) {
        if (guessed.listingType !== criteria.listingType) return -1;
        score += 3;
    }
    if (criteria.category) {
        if (guessed.category !== criteria.category) return -1;
        score += 3;
    }
    if (criteria.make) {
        if (guessed.make !== criteria.make) return -1;
        score += 3;
    }
    if (criteria.model) {
        if (!guessed.modelMatches) return -1;
        score += 2;
    }
    if (criteria.maxPrice !== null && criteria.maxPrice !== undefined) {
        if (guessed.price === null) score -= 1;
        else if (guessed.price > criteria.maxPrice) return -1;
        else score += 2;
    } else if (guessed.price !== null) {
        score += 1;
    }
    if (guessed.hasImage) score += 1;
    return score;
}

/** What the card itself says (title, text, address of the listing). */
export const readCard = (card) =>
    classifyListing({ title: card.title, description: card.text, sourceUrl: card.sourceUrl, price: card.price });

/**
 * Card + what its results page filtered -> listing values.
 * The page's filter only fills a value the card does not state: a card
 * that names another city, type or offer keeps its own value (and is
 * then left out by scoreListing).
 */
/** A results card that is a real estate ad (not a vehicle). */
export function isPropertyCard(card = {}) {
    const check = checkVehicleListing({
        title: card.title,
        description: card.text,
        sourceUrl: card.sourceUrl,
        sourceName: "",
        sourceDomain: "",
    });
    return check.reason === "property";
}

export function classifyCard(card, filtered = {}, criteria = {}) {
    const guessed = readCard(card);
    // A card naming the city searched anywhere (title, text, address) is in
    // that city, even if it first names a neighbourhood like "Cité Dakhla".
    if (criteria.city && guessed.city !== criteria.city && mentionsCity({ title: card.title, description: card.text, sourceUrl: card.sourceUrl }, criteria.city)) {
        guessed.city = criteria.city;
    }
    if (filtered.city && criteria.city && !guessed.city) guessed.city = criteria.city;
    if (filtered.category && criteria.category && !guessed.category) guessed.category = criteria.category;
    if (filtered.make && criteria.make && !guessed.make) guessed.make = criteria.make;
    if (filtered.listingType && filtered.offer && (!guessed.listingType || guessed.listingType === "unknown")) {
        guessed.listingType = filtered.offer;
    }
    guessed.modelMatches = mentionsModel({ model: guessed.model, title: card.title, sourceUrl: card.sourceUrl }, criteria.model);
    guessed.hasImage = Boolean(card.imageUrl);
    return guessed;
}

/**
 * Did the results page really filter what its address asked for?
 * Websites often show other listings when they have nothing for a search
 * (all cities, "similar" listings, a redirect to their home page):
 *   - the page was redirected to another address -> nothing is trusted;
 *   - most cards that name a city name another one -> the city is not trusted;
 *   - same for the category, the make and the offer.
 */
export function trustPageFilters(filtered, cards, criteria, requestedUrl, finalUrl) {
    const trusted = { ...filtered };
    try {
        const asked = new URL(requestedUrl);
        const got = new URL(finalUrl || requestedUrl);
        const path = (url) => url.pathname.replace(/\/+$/, "").toLowerCase();
        if (path(asked) !== path(got)) return { city: false, category: false, make: false, listingType: false, offer: filtered.offer };
    } catch {
        // Keep the filters.
    }

    const read = cards.map(readCard);
    const agrees = (field, wanted) => {
        const stated = read.map((value) => value[field]).filter((value) => value && value !== "unknown");
        if (stated.length < 2) return true;
        return stated.filter((value) => value === wanted).length * 2 >= stated.length;
    };
    if (trusted.city && criteria.city && !agrees("city", criteria.city)) trusted.city = false;
    if (trusted.category && criteria.category && !agrees("category", criteria.category)) trusted.category = false;
    if (trusted.make && criteria.make && !agrees("make", criteria.make)) trusted.make = false;
    if (trusted.listingType && filtered.offer && !agrees("listingType", filtered.offer)) trusted.listingType = false;
    return trusted;
}

/* ---------- one website ---------- */

async function searchWebsite(source, criteria, deps) {
    const { fetchImpl, engineSlots, readImpl = readResultPageWithNext } = deps;
    const hostname = stripWww(source.hostnames[0]);
    const report = { hostname, sourceName: source.sourceName || hostname, method: "none", status: "no-results", count: 0, pages: [] };
    const cards = [];

    // 1. robots.txt
    const robots = await robotsFor(source, fetchImpl);
    if (!robots.isAllowed("/")) {
        report.status = "blocked";
        if (source.robots?.allowed !== false) {
            updateSupportedSource(source.hostnames[0], { robots: { allowed: false, reason: "robots-disallow-all", checkedAt: new Date().toISOString() } });
        }
        return { report, cards };
    }

    // The website does not list this offer (rentals only, new homes for sale only...).
    const offers = source.search?.offers;
    if (criteria.listingType && offers?.length && !offers.includes(criteria.listingType)) {
        report.status = "offer-not-listed";
        return { report, cards };
    }

    // 2. A - the website's own results page(s)
    const urls = buildSearchUrls(source, criteria);
    if (urls.length) report.method = "live";
    const hosts = [...new Set([...source.hostnames, ...source.hostnames.map(stripWww)])];
    let linkPattern = null;
    try {
        linkPattern = source.search?.resultLinkPattern ? new RegExp(source.search.resultLinkPattern, "i") : null;
    } catch {
        linkPattern = null;
    }

    // Matching listings found so far on this website.
    let matching = 0;
    const countMatching = (newCards) => {
        for (const card of newCards) {
            if (scoreListing(classifyCard(card, card.filtered, criteria), criteria) >= 0) matching += 1;
        }
    };

    // Each address: its first page, then its next pages while the website
    // has fewer than MIN_PER_SITE matching listings.
    await Promise.all(
        urls.map(async (built) => {
            let pageUrl = built.url;
            for (let pageNumber = 1; pageUrl && pageNumber <= MAX_PAGES_PER_SEARCH; pageNumber += 1) {
                if (pageNumber > 1 && (matching >= MIN_PER_SITE || cards.length >= MAX_CARDS_PER_SITE)) break;
                const target = new URL(pageUrl);
                if (!robots.isAllowed(target.pathname + target.search)) {
                    report.pages.push({ url: pageUrl, status: "blocked" });
                    return;
                }
                try {
                    const response = await withTimeout(fetchImpl(pageUrl, { allowedHosts: hosts }), PAGE_TIMEOUT);
                    const read = readImpl(response.text, response.url || pageUrl, { hosts, linkPattern });
                    const pageCards = Array.isArray(read) ? read : read.cards;
                    const known = new Set(cards.map((card) => card.sourceUrl));
                    // What this page really filtered (websites often show other listings instead).
                    const filtered = trustPageFilters({ ...built.filtered, offer: built.listingType }, pageCards, criteria, pageUrl, response.url);
                    const fresh = pageCards
                        .filter((card) => !known.has(card.sourceUrl))
                        .slice(0, MAX_CARDS_PER_SITE - cards.length)
                        .map((card) => ({ ...card, filtered }));
                    report.pages.push({ url: pageUrl, status: "ok", cards: pageCards.length });
                    cards.push(...fresh);
                    countMatching(fresh);
                    // No new listing on this page: the website repeats itself, stop.
                    if (!fresh.length) break;
                    pageUrl = Array.isArray(read) ? null : read.nextUrl;
                } catch (error) {
                    // 404 / 410: the website has no page for this search (unknown city...).
                    const status = error.response?.status;
                    report.pages.push({
                        url: pageUrl,
                        status: status === 404 || status === 410 ? "not-found" : "failed",
                        error: String(status || error.message || error).slice(0, 120),
                    });
                    return;
                }
            }
        }),
    );

    // 3. B - search engine when A gave nothing
    if (!cards.length && isSearchEngineEnabled() && engineSlots.take()) {
        report.method = urls.length ? "live+engine" : "engine";
        try {
            const found = await withTimeout(searchWebsiteWithEngine(hostname, criteria, deps), PAGE_TIMEOUT);
            for (const card of found) {
                const url = new URL(card.sourceUrl);
                if (robots.isAllowed(url.pathname + url.search)) cards.push({ ...card, filtered: {}, viaEngine: true });
            }
        } catch (error) {
            report.engineError = String(error.response?.status || error.message || error).slice(0, 120);
        }
    }

    if (!urls.length && !report.method.includes("engine")) report.status = "not-supported";
    else if (cards.length) report.status = "ok";
    else if (report.pages.length && report.pages.every((page) => page.status === "failed") && !report.method.includes("engine")) report.status = "failed";
    else if (report.pages.length && report.pages.every((page) => page.status === "not-found" || page.status === "failed")) report.status = "no-results";
    else if (report.pages.length && report.pages.every((page) => page.status === "blocked")) report.status = "blocked";

    report.robots = robots;
    return { report, cards };
}

/* ---------- pictures from the listing's own page ---------- */

async function addMissingPictures(matches, { enrichImpl, robotsByHost }) {
    // Spread the lookups between websites (1st without picture of each website, then 2nd...).
    const queues = matches.map((list) => list.filter((match) => !match.card.imageUrl));
    const todo = [];
    for (let round = 0; todo.length < MAX_PICTURE_LOOKUPS; round += 1) {
        let added = false;
        for (const queue of queues) {
            if (queue[round] && todo.length < MAX_PICTURE_LOOKUPS) {
                todo.push(queue[round]);
                added = true;
            }
        }
        if (!added) break;
    }

    let next = 0;
    const worker = async () => {
        while (next < todo.length) {
            const match = todo[next];
            next += 1;
            try {
                const url = new URL(match.card.sourceUrl);
                const robots = robotsByHost.get(match.report.hostname);
                if (robots && !robots.isAllowed(url.pathname + url.search)) continue;
                const page = await withTimeout(enrichImpl(match.card.sourceUrl), PICTURE_TIMEOUT);
                if (page?.imageUrl) {
                    match.card.imageUrl = page.imageUrl;
                    match.guessed.hasImage = true;
                }
                if (match.guessed.price === null && Number.isFinite(Number(page?.price)) && Number(page.price) > 0) {
                    match.guessed.price = Number(page.price);
                }
                if (!match.guessed.year && page?.year) match.guessed.year = Number(page.year) || null;
                if (!match.guessed.mileage && page?.mileage) match.guessed.mileage = Number(page.mileage) || null;
            } catch {
                // The page did not answer: the listing keeps no picture.
            }
        }
    };
    await Promise.all(Array.from({ length: PICTURE_CONCURRENCY }, worker));
}

/**
 * Websites take turns: 1st listing of each website, then the 2nd of each...
 * Listings with a picture come first, then those without.
 */
export function mixWebsites(perSite, limit = MAX_RESULTS) {
    const order = [];
    for (const withPicture of [true, false]) {
        const queues = perSite.map((list) => list.filter((match) => Boolean(match.card.imageUrl) === withPicture));
        for (let round = 0; order.length < limit; round += 1) {
            let added = false;
            for (const queue of queues) {
                if (queue[round] && order.length < limit) {
                    order.push(queue[round]);
                    added = true;
                }
            }
            if (!added) break;
        }
    }
    return order;
}

/* ---------- all websites ---------- */

const cache = new Map();

const cacheKey = (criteria, sources) =>
    JSON.stringify([criteria.city, criteria.category, criteria.listingType, criteria.make, criteria.model, criteria.maxPrice, sources.map((source) => source.hostnames[0]).sort()]);

/**
 * criteria: { city, category, listingType, make, model, maxPrice } ("" / null = all)
 * sources:  websites to search (supportedSources entries)
 * Returns { listings, sites, total, cached }.
 */
export async function liveSearch(
    criteria,
    sources,
    { fetchImpl = fetchText, httpGet, readImpl, enrichImpl = extractPageMetadata, useCache = true } = {},
) {
    const key = cacheKey(criteria, sources);
    const hit = useCache && cache.get(key);
    if (hit && hit.until > Date.now()) return { ...hit.value, cached: true };

    // Each website sent to the search engine costs one request.
    let slots = searchEngineMaxSites();
    const engineSlots = { take: () => (slots > 0 ? (slots -= 1, true) : false) };

    const results = await Promise.all(
        sources.map((source) =>
            searchWebsite(source, criteria, { fetchImpl, httpGet, ...(readImpl ? { readImpl } : {}), engineSlots }).catch((error) => ({
                report: { hostname: stripWww(source.hostnames[0]), sourceName: source.sourceName, method: "none", status: "failed", count: 0, error: String(error.message || error) },
                cards: [],
            })),
        ),
    );

    // Check every card against the search.
    const perSite = [];
    for (const { report, cards } of results) {
        const seen = new Set();
        const matches = [];
        for (const card of cards) {
            if (seen.has(card.sourceUrl)) continue;
            seen.add(card.sourceUrl);
            // Apartments shown by general classifieds websites are left out.
            if (isPropertyCard(card)) continue;
            const guessed = classifyCard(card, card.filtered, criteria);
            const score = scoreListing(guessed, criteria);
            if (score < 0) continue;
            matches.push({ card, guessed, score, report });
        }
        matches.sort((a, b) => b.score - a.score);
        report.count = matches.length;
        if (report.status === "ok" && !matches.length) report.status = "no-results";
        perSite.push(matches);
    }

    // Pictures for listings shown without one.
    const robotsByHost = new Map(results.map(({ report }) => [report.hostname, report.robots]));
    await addMissingPictures(perSite, { enrichImpl, robotsByHost });
    for (const { report } of results) delete report.robots;

    const total = perSite.reduce((sum, list) => sum + list.length, 0);
    const listings = mixWebsites(perSite).map(({ card, guessed, report }, index) => ({
        _id: `live-${index}-${Buffer.from(card.sourceUrl).toString("base64url").slice(-16)}`,
        title: card.title,
        description: String(card.text || "").slice(0, 300),
        imageUrl: card.imageUrl || "",
        price: guessed.price,
        currency: "MAD",
        priceUnit: "",
        listingType: guessed.listingType || "unknown",
        category: guessed.category || "",
        make: guessed.make || "",
        model: guessed.model || "",
        year: guessed.year || null,
        mileage: guessed.mileage ?? null,
        fuel: guessed.fuel || "",
        transmission: guessed.transmission || "",
        city: guessed.city || "",
        neighborhood: "",
        sourceName: report.sourceName,
        sourceDomain: report.hostname,
        sourceUrl: card.sourceUrl,
        publishedAt: card.publishedAt || null,
        foundWith: card.viaEngine ? "search-engine" : "website",
        exactMatch:
            (!criteria.listingType || guessed.listingType === criteria.listingType) &&
            (!criteria.category || guessed.category === criteria.category) &&
            (criteria.maxPrice === null || criteria.maxPrice === undefined || guessed.price !== null),
    }));

    const value = {
        listings,
        total,
        sites: results.map(({ report }) => report),
    };

    if (useCache) {
        if (cache.size >= CACHE_MAX) cache.delete(cache.keys().next().value);
        cache.set(key, { value, until: Date.now() + CACHE_TTL });
    }
    return { ...value, cached: false };
}

export const clearLiveSearchCache = () => {
    cache.clear();
    robotsCache.clear();
};
