// backend/apps/property/controllers/externalListings/externalListingSearchController.js
//
// "Find a property from external websites" (logged-in users): a REAL-TIME
// search on the listing websites (nothing is read from our database).
//
//   GET /api/property/external-listings/search/websites
//       websites the search covers (name, robots.txt status, how they are searched)
//
//   GET /api/property/external-listings/search
//       ?city=Agadir (or all)&propertyType=Apartment&listingType=For Rent&maxPrice=6000
//       &sites=agenz.ma,2p.ma&siteMode=include|exclude
//       -> up to 50 listings read now on the websites + what happened on each website
//
//   Admin: GET / PUT /search/websites/:hostname/config   search settings of a website
//          POST /search/websites/:hostname/test          try them with a search
//
// How each website is searched: services/externalListings/live/liveSearch.js

import { getSupportedSources, findSourceByWebsite, updateSupportedSource } from "../../services/externalListings/sources/externalListingSource.js";
import { PROPERTY_TYPES, matchCityName } from "../../services/externalListings/listingClassifier.js";
import { liveSearch, scoreListing, MAX_RESULTS, clearLiveSearchCache } from "../../services/externalListings/live/liveSearch.js";
import { buildSearchUrls } from "../../services/externalListings/live/searchUrlBuilder.js";
import { isSearchEngineEnabled } from "../../services/externalListings/live/searchEngineFallback.js";

export { scoreListing, MAX_RESULTS };

const LISTING_TYPES = ["For Sale", "For Rent"];

const stripWww = (hostname) => String(hostname || "").toLowerCase().replace(/^www\./, "");

/** Registered websites with their robots.txt status and search method. */
function listWebsites() {
    return getSupportedSources()
        .map((source) => ({
            hostname: stripWww(source.hostnames?.[0]),
            sourceName: source.sourceName || stripWww(source.hostnames?.[0]),
            blocked: source.robots?.allowed === false,
            robotsReason: source.robots?.reason || null,
            robotsCheckedAt: source.robots?.checkedAt || null,
            // "website": its own results page is read; "search-engine": found through Brave.
            searchMethod: source.search?.templates?.length ? "website" : isSearchEngineEnabled() ? "search-engine" : "none",
            offers: source.search?.offers || LISTING_TYPES,
        }))
        .filter((website) => website.hostname);
}

/** "agenz.ma,Mubawab, https://www.2p.ma/x" -> { known: [hostname], unknown: [text] } */
export function resolveSites(value) {
    const known = new Set();
    const unknown = [];
    const items = (Array.isArray(value) ? value : String(value || "").split(","))
        .map((item) => String(item).trim())
        .filter(Boolean)
        .slice(0, 30);

    for (const item of items) {
        const source = findSourceByWebsite(item);
        if (source) known.add(stripWww(source.hostnames[0]));
        else unknown.push(item.slice(0, 80));
    }
    return { known: [...known], unknown };
}

/** Query string -> clean search criteria. */
export function parseSearchQuery(query = {}) {
    const maxPrice = Number(String(query.maxPrice ?? "").replace(/[\s,]/g, ""));
    // "all" (or nothing): every city of Morocco.
    const cityInput = String(query.city || "").trim().slice(0, 80);
    const allCities = !cityInput || cityInput.toLowerCase() === "all";
    return {
        city: allCities ? "" : matchCityName(cityInput) || "",
        cityInput: allCities ? "" : cityInput,
        propertyType: PROPERTY_TYPES.includes(query.propertyType) ? query.propertyType : "",
        listingType: LISTING_TYPES.includes(query.listingType) ? query.listingType : "",
        maxPrice: Number.isFinite(maxPrice) && maxPrice > 0 ? maxPrice : null,
        siteMode: query.siteMode === "exclude" ? "exclude" : "include",
        sites: resolveSites(query.sites),
    };
}

// GET /search/websites
export async function getSearchWebsites(req, res) {
    try {
        return res.status(200).json({
            success: true,
            searchEngine: isSearchEngineEnabled(),
            websites: listWebsites().sort((a, b) => a.sourceName.localeCompare(b.sourceName)),
        });
    } catch (error) {
        console.error("[ExternalListings] Search websites error:", error);
        return res.status(500).json({ success: false, message: "Could not load the websites." });
    }
}

// GET /search
export async function searchExternalListings(req, res) {
    try {
        const criteria = parseSearchQuery(req.query);

        if (criteria.cityInput && !criteria.city) {
            return res.status(400).json({ success: false, field: "city", message: "Choose a city from the list." });
        }
        if (criteria.siteMode === "include" && req.query.sites && !criteria.sites.known.length) {
            return res.status(400).json({
                success: false,
                field: "sites",
                message: "None of these websites is in our list.",
                unknownSites: criteria.sites.unknown,
            });
        }

        const chosen = new Set(criteria.sites.known);
        const sources = getSupportedSources().filter((source) => {
            const host = stripWww(source.hostnames?.[0]);
            if (!host) return false;
            if (!chosen.size) return true;
            return criteria.siteMode === "include" ? chosen.has(host) : !chosen.has(host);
        });

        const result = await liveSearch(
            { city: criteria.city, propertyType: criteria.propertyType, listingType: criteria.listingType, maxPrice: criteria.maxPrice },
            sources,
        );

        return res.status(200).json({
            success: true,
            criteria: publicCriteria(criteria),
            listings: result.listings,
            total: result.total,
            sites: result.sites,
            searchedSites: result.sites.filter((site) => site.status !== "blocked"),
            skippedSites: result.sites.filter((site) => site.status === "blocked"),
            unknownSites: criteria.sites.unknown,
            searchEngine: isSearchEngineEnabled(),
            cached: result.cached,
        });
    } catch (error) {
        console.error("[ExternalListings] Search error:", error);
        return res.status(500).json({ success: false, message: "The search failed. Please try again." });
    }
}

function publicCriteria(criteria) {
    return {
        city: criteria.city,
        propertyType: criteria.propertyType,
        listingType: criteria.listingType,
        maxPrice: criteria.maxPrice,
        siteMode: criteria.siteMode,
        sites: criteria.sites.known,
    };
}

/* ---------- admin: search settings of a website ---------- */

function sourceFromParam(req, res) {
    const source = findSourceByWebsite(req.params.hostname);
    if (!source) {
        res.status(404).json({ success: false, message: "This website is not in the list." });
        return null;
    }
    return source;
}

/** Check a search settings object; returns an error message or "". */
export function validateSearchConfig(config) {
    if (config === null) return "";
    if (typeof config !== "object" || Array.isArray(config)) return "The settings must be an object.";
    if (!Array.isArray(config.templates) || !config.templates.length) return "Add at least one template.";
    for (const template of config.templates) {
        if (!template || typeof template.url !== "string" || !template.url.startsWith("/")) {
            return 'Each template needs a "url" starting with "/".';
        }
        if (template.listingType && !LISTING_TYPES.includes(template.listingType)) return 'listingType must be "For Sale" or "For Rent".';
    }
    if (config.offers && (!Array.isArray(config.offers) || config.offers.some((offer) => !LISTING_TYPES.includes(offer)))) {
        return 'offers must be a list of "For Sale" / "For Rent".';
    }
    if (config.maps && (typeof config.maps !== "object" || Array.isArray(config.maps))) return "maps must be an object.";
    if (config.resultLinkPattern) {
        try {
            new RegExp(config.resultLinkPattern);
        } catch {
            return "resultLinkPattern is not a valid regular expression.";
        }
    }
    return "";
}

// GET /search/websites/:hostname/config (admin)
export function getWebsiteSearchConfig(req, res) {
    const source = sourceFromParam(req, res);
    if (!source) return undefined;
    return res.status(200).json({ success: true, hostname: stripWww(source.hostnames[0]), search: source.search || null });
}

// PUT /search/websites/:hostname/config (admin) body: { search: {...} | null }
export function updateWebsiteSearchConfig(req, res) {
    const source = sourceFromParam(req, res);
    if (!source) return undefined;
    const config = req.body?.search ?? null;
    const message = validateSearchConfig(config);
    if (message) return res.status(400).json({ success: false, message });

    const updated = updateSupportedSource(source.hostnames[0], { search: config || undefined });
    clearLiveSearchCache();
    return res.status(200).json({ success: true, search: updated?.search || null });
}

// POST /search/websites/:hostname/test (admin) body: { search?: {...}, city, propertyType, listingType, maxPrice }
export async function testWebsiteSearch(req, res) {
    const source = sourceFromParam(req, res);
    if (!source) return undefined;
    const config = req.body?.search === undefined ? source.search : req.body.search;
    const message = validateSearchConfig(config ?? null);
    if (message) return res.status(400).json({ success: false, message });

    try {
        const criteria = parseSearchQuery(req.body || {});
        const testSource = { ...source, search: config || undefined };
        const plain = { city: criteria.city, propertyType: criteria.propertyType, listingType: criteria.listingType, maxPrice: criteria.maxPrice };
        const result = await liveSearch(plain, [testSource], { useCache: false });
        return res.status(200).json({
            success: true,
            urls: buildSearchUrls(testSource, plain).map((item) => item.url),
            site: result.sites[0],
            listings: result.listings.slice(0, 10),
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: String(error.message || error) });
    }
}
