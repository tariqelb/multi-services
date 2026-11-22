// services/externalListings/sources/externalListingSource.js
//
// Registry of the external websites the application collects listings from.
// The list lives in supportedSources.json (next to this file).
//
// Each website entry:
// {
//     "sourceName": "Mr Semsar",
//     "hostnames": ["mrsemsar.ma", "www.mrsemsar.ma"],
//     "pathPrefix": "/listing/",          // listing pages start with this path
//
//     // Optional discovery settings (only needed when automatic discovery
//     // cannot find the listings of a website):
//     "listPageUrls": ["https://www.mrsemsar.ma/listings?page={page}"],
//     "sitemapUrls": ["https://www.mrsemsar.ma/sitemap.xml"],
//     "linkPattern": "^/listing/\\d+$",  // regular expression on the URL path
//     "maxPages": 15,
//
//     // Written automatically by the collector:
//     "lastCollectedAt": "2026-11-21T00:00:00.000Z",
//     "lastCollectSummary": { ... }
// }

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import net from "node:net";

import { extractPageMetadata } from "../metadataExtractor.js";
import { normalizeExternalListing } from "../listingNormalizer.js";

const currentFile = fileURLToPath(import.meta.url);
const currentDirectory = path.dirname(currentFile);

const CONFIG_FILE = path.join(currentDirectory, "supportedSources.json");

/* --------------------------------------------------
   Config file
-------------------------------------------------- */

function readSupportedSources() {
    try {
        const content = fs.readFileSync(CONFIG_FILE, "utf8");
        const sources = JSON.parse(content);

        return Array.isArray(sources) ? sources : [];
    } catch (error) {
        console.error("Could not read supported sources:", error.message);
        return [];
    }
}

function writeSupportedSources(sources) {
    fs.writeFileSync(
        CONFIG_FILE,
        JSON.stringify(sources, null, 4) + "\n",
        "utf8"
    );
}

/* --------------------------------------------------
   URL helpers
-------------------------------------------------- */

/**
 * Validate an HTTPS listing URL before registering or fetching it.
 */
export function inspectListingUrl(inputUrl) {
    if (typeof inputUrl !== "string" || !inputUrl.trim()) {
        return null;
    }

    try {
        const url = new URL(inputUrl.trim());

        if (
            url.protocol !== "https:" ||
            url.username ||
            url.password ||
            url.port ||
            !url.hostname ||
            url.hostname === "localhost" ||
            url.hostname.endsWith(".localhost") ||
            url.hostname.endsWith(".local") ||
            net.isIP(url.hostname)
        ) {
            return null;
        }

        url.hash = "";

        return {
            hostname: url.hostname.toLowerCase(),
            normalizedUrl: url.href,
            pathname: url.pathname,
        };
    } catch {
        return null;
    }
}

/**
 * Turn what an administrator typed ("mrsemsar.ma", "www.mrsemsar.ma",
 * "https://mrsemsar.ma/listing/3", "Mr Semsar") into a bare hostname.
 * Returns "" when the text is not a hostname.
 */
export function parseWebsiteInput(input) {
    if (typeof input !== "string") return "";

    let value = input.trim().toLowerCase();

    if (!value) return "";

    if (!/^https?:\/\//.test(value)) {
        value = `https://${value}`;
    }

    try {
        const url = new URL(value);
        const hostname = url.hostname.replace(/\.$/, "");

        // Must look like a real domain: "name.tld".
        if (
            !/^[a-z0-9-]+(\.[a-z0-9-]+)+$/.test(hostname) ||
            net.isIP(hostname)
        ) {
            return "";
        }

        return hostname;
    } catch {
        return "";
    }
}

function stripWww(hostname) {
    return String(hostname || "").toLowerCase().replace(/^www\./, "");
}

/* --------------------------------------------------
   Lookups
-------------------------------------------------- */

/**
 * Get configuration for an already registered website.
 * Returns null when the URL is not a listing URL of a registered website.
 */
export function getSourceConfig(inputUrl) {
    const inspected = inspectListingUrl(inputUrl);

    if (!inspected) {
        return null;
    }

    const sources = readSupportedSources();

    const source = sources.find((item) => {
        return (
            item.hostnames.includes(inspected.hostname) &&
            inspected.pathname
                .toLowerCase()
                .startsWith(item.pathPrefix.toLowerCase())
        );
    });

    if (!source) {
        return null;
    }

    const remainingPath = inspected.pathname.slice(source.pathPrefix.length);

    if (!remainingPath.replaceAll("/", "").length) {
        return null;
    }

    return {
        sourceName: source.sourceName,
        hostname: inspected.hostname,
        normalizedUrl: inspected.normalizedUrl,
        sourceListingId: remainingPath.split("/").filter(Boolean).pop(),
    };
}

/**
 * Find a registered website from a name, a hostname or any URL of the site.
 */
export function findSourceByWebsite(input) {
    const sources = readSupportedSources();
    const text = String(input || "").trim().toLowerCase();

    if (!text) return null;

    const hostname = parseWebsiteInput(text);

    if (hostname) {
        const bare = stripWww(hostname);

        const byHost = sources.find((source) =>
            source.hostnames.some((item) => stripWww(item) === bare)
        );

        if (byHost) return byHost;
    }

    return (
        sources.find(
            (source) => String(source.sourceName || "").toLowerCase() === text
        ) || null
    );
}

/**
 * Check whether a website is already configured.
 */
export function supportsExternalListingUrl(inputUrl) {
    return getSourceConfig(inputUrl) !== null;
}

/**
 * Backward-compatible Aqari validator.
 */
export function supportsAqariUrl(inputUrl) {
    return getSourceConfig(inputUrl)?.sourceName === "Aqari Annonces";
}

/* --------------------------------------------------
   Registration / updates
-------------------------------------------------- */

/**
 * Register a new website automatically.
 *
 * - With a listing URL ("https://site.ma/annonce/12"), the listing path
 *   prefix ("/annonce/") is learned from the URL.
 * - With a bare website ("https://site.ma/"), the prefix is "/" until the
 *   collector detects the real one.
 */
export async function registerSupportedSource(inputUrl) {
    const inspected = inspectListingUrl(inputUrl);

    if (!inspected) {
        throw new Error("Invalid or unsafe HTTPS website URL.");
    }

    const sources = readSupportedSources();
    const bare = stripWww(inspected.hostname);

    const existing = sources.find((source) =>
        source.hostnames.some((item) => stripWww(item) === bare)
    );

    if (existing) {
        return existing;
    }

    const segments = inspected.pathname.split("/").filter(Boolean);

    // "/annonce/12" -> "/annonce/"; "/" -> "/".
    const pathPrefix =
        segments.length >= 2 ? `/${segments.slice(0, -1).join("/")}/` : "/";

    const sourceName =
        bare.split(".").slice(0, -1).join(".") || inspected.hostname;

    const newSource = {
        sourceName,
        hostnames: [...new Set([bare, `www.${bare}`])],
        pathPrefix,
    };

    sources.push(newSource);
    writeSupportedSources(sources);

    return newSource;
}

/**
 * Merge new values into a registered website (matched by hostname).
 * Used by the collector to remember the detected listing path and the
 * last collection summary.
 */
export function updateSupportedSource(hostname, changes = {}) {
    const sources = readSupportedSources();
    const bare = stripWww(hostname);

    const index = sources.findIndex((source) =>
        source.hostnames.some((item) => stripWww(item) === bare)
    );

    if (index === -1) {
        return null;
    }

    sources[index] = { ...sources[index], ...changes };
    writeSupportedSources(sources);

    return sources[index];
}

/**
 * Remove a registered website (its stored listings are kept).
 */
export function removeSupportedSource(hostname) {
    const sources = readSupportedSources();
    const bare = stripWww(hostname);

    const remaining = sources.filter(
        (source) => !source.hostnames.some((item) => stripWww(item) === bare)
    );

    if (remaining.length === sources.length) {
        return false;
    }

    writeSupportedSources(remaining);
    return true;
}

/**
 * Return all configured websites.
 */
export function getSupportedSources() {
    return readSupportedSources();
}

/* --------------------------------------------------
   Extraction
-------------------------------------------------- */

/**
 * Extract and normalize a listing from any configured website.
 * Returns null when the page has no usable listing (e.g. no image).
 */
export async function extractExternalListing(inputUrl) {
    const source = getSourceConfig(inputUrl);

    if (!source) {
        throw new Error("This listing website has not been registered.");
    }

    const metadata = await extractPageMetadata(source.normalizedUrl);

    if (!metadata) {
        return null;
    }

    const listing = normalizeExternalListing({
        ...metadata,
        sourceUrl: source.normalizedUrl,
        sourceDomain: source.hostname,
        sourceName: source.sourceName,
        sourceListingId: source.sourceListingId,
        extractionMethod: metadata.extractionMethod || "metadata",
    });

    if (!listing || !listing.imageUrl) {
        return null;
    }

    return listing;
}

/**
 * Backward-compatible alias.
 */
export const extractAqariListing = extractExternalListing;
