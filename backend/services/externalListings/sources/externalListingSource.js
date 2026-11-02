// import supportedSources from "./supportedSources.json" with {
//     type: "json",
// };

// import { extractPageMetadata } from "../metadataExtractor.js";
// import { normalizeExternalListing } from "../listingNormalizer.js";
// import { getListingSourceUrls } from "../listingSourcesStore.js";

// /**
//  * Get the configuration for a supported listing URL.
//  */
// export function getSourceConfig(inputUrl) {
//     if (typeof inputUrl !== "string" || !inputUrl.trim()) {
//         return null;
//     }

//     try {
//         const url = new URL(inputUrl.trim());

//         if (
//             url.protocol !== "https:" ||
//             url.username ||
//             url.password ||
//             url.port
//         ) {
//             return null;
//         }

//         const hostname = url.hostname.toLowerCase();

//         const source = supportedSources.find((item) => {
//             const hostnameSupported =
//                 item.hostnames.includes(hostname);

//             const pathSupported =
//                 url.pathname.toLowerCase().startsWith(
//                     item.pathPrefix.toLowerCase()
//                 );

//             // Require a path after the configured prefix.
//             const remainingPath = url.pathname.slice(
//                 item.pathPrefix.length
//             );

//             return (
//                 hostnameSupported &&
//                 pathSupported &&
//                 remainingPath.replaceAll("/", "").length > 0
//             );
//         });

//         if (!source) {
//             return null;
//         }

//         url.hash = "";

//         return {
//             sourceName: source.sourceName,
//             hostname,
//             normalizedUrl: url.href,
//             sourceListingId: decodeURIComponent(url.pathname)
//                 .split("/")
//                 .filter(Boolean)
//                 .pop(),
//         };
//     } catch {
//         return null;
//     }
// }

// /**
//  * Check whether a URL belongs to any configured website.
//  */
// export function supportsExternalListingUrl(inputUrl) {
//     return getSourceConfig(inputUrl) !== null;
// }

// /**
//  * Backward-compatible Aqari validator.
//  */
// export function supportsAqariUrl(inputUrl) {
//     return (
//         getSourceConfig(inputUrl)?.sourceName === "Aqari Annonces"
//     );
// }

// /**
//  * Return all configured websites.
//  */
// export function getSupportedSources() {
//     return supportedSources;
// }

// /**
//  * Return the configured listing URLs.
//  */
// export async function discoverExternalListings() {
//     return getListingSourceUrls();
// }

// /**
//  * Extract and normalize a listing from any supported website.
//  */
// export async function extractExternalListing(inputUrl) {
//     const source = getSourceConfig(inputUrl);

//     if (!source) {
//         throw new Error(
//             "Unsupported URL. Only configured external listing websites are allowed."
//         );
//     }

//     const metadata = await extractPageMetadata(
//         source.normalizedUrl
//     );

//     if (!metadata) {
//         return null;
//     }

//     const listing = normalizeExternalListing({
//         ...metadata,
//         sourceUrl: source.normalizedUrl,
//         sourceDomain: source.hostname,
//         sourceName: source.sourceName,
//         sourceListingId: source.sourceListingId,
//         extractionMethod: metadata.extractionMethod || "metadata",
//     });

//     if (!listing || !listing.imageUrl) {
//         return null;
//     }

//     return listing;
// }

// /**
//  * Backward-compatible alias for existing Aqari imports.
//  */
// export const extractAqariListing = extractExternalListing;


import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import net from "node:net";

import { extractPageMetadata } from "../metadataExtractor.js";
import { normalizeExternalListing } from "../listingNormalizer.js";

const currentFile = fileURLToPath(import.meta.url);
const currentDirectory = path.dirname(currentFile);

const CONFIG_FILE = path.join(
    currentDirectory,
    "supportedSources.json"
);

function readSupportedSources() {
    try {
        const content = fs.readFileSync(CONFIG_FILE, "utf8");
        const sources = JSON.parse(content);

        return Array.isArray(sources) ? sources : [];
    } catch (error) {
        console.error(
            "Could not read supported sources:",
            error.message
        );

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

/**
 * Validate an HTTPS listing URL before registering or fetching it.
 */
export function inspectListingUrl(inputUrl) {
    if (
        typeof inputUrl !== "string" ||
        !inputUrl.trim()
    ) {
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
 * Get configuration for an already registered website.
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
            inspected.pathname.toLowerCase().startsWith(
                item.pathPrefix.toLowerCase()
            )
        );
    });

    if (!source) {
        return null;
    }

    const remainingPath = inspected.pathname.slice(
        source.pathPrefix.length
    );

    if (!remainingPath.replaceAll("/", "").length) {
        return null;
    }

    return {
        sourceName: source.sourceName,
        hostname: inspected.hostname,
        normalizedUrl: inspected.normalizedUrl,
        sourceListingId: remainingPath
            .split("/")
            .filter(Boolean)
            .pop(),
    };
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
    return (
        getSourceConfig(inputUrl)?.sourceName ===
        "Aqari Annonces"
    );
}

/**
 * Register a new website automatically.
 *
 * New websites use "/" as their path prefix because their
 * listing URL structure is not known in advance.
 */
export async function registerSupportedSource(inputUrl) {
    const inspected = inspectListingUrl(inputUrl);

    if (!inspected) {
        throw new Error(
            "Invalid or unsafe HTTPS website URL."
        );
    }

    const sources = readSupportedSources();

    const existing = sources.find((source) =>
        source.hostnames.includes(inspected.hostname)
    );

    if (existing) {
        return existing;
    }

    const sourceName = inspected.hostname
        .replace(/^www\./, "")
        .split(".")
        .slice(0, -1)
        .join(".") || inspected.hostname;

    const newSource = {
        sourceName,
        hostnames: [inspected.hostname],
        pathPrefix: "/",
    };

    sources.push(newSource);
    writeSupportedSources(sources);

    return newSource;
}

/**
 * Return all configured websites.
 */
export function getSupportedSources() {
    return readSupportedSources();
}

/**
 * Extract and normalize a listing from any configured website.
 */
export async function extractExternalListing(inputUrl) {
    const source = getSourceConfig(inputUrl);

    if (!source) {
        throw new Error(
            "This listing website has not been registered."
        );
    }

    const metadata = await extractPageMetadata(
        source.normalizedUrl
    );

    if (!metadata) {
        return null;
    }

    const listing = normalizeExternalListing({
        ...metadata,
        sourceUrl: source.normalizedUrl,
        sourceDomain: source.hostname,
        sourceName: source.sourceName,
        sourceListingId: source.sourceListingId,
        extractionMethod:
            metadata.extractionMethod || "metadata",
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
