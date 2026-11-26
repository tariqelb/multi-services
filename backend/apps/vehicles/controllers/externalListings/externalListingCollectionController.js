// backend/apps/vehicles/controllers/externalListings/externalListingCollectionController.js
//
// Admin endpoints for "collect N new listings from a website".
//
//   GET    /api/vehicles/external-listings/websites                 registered websites + stats
//   POST   /api/vehicles/external-listings/websites                 { website } register a website
//   DELETE /api/vehicles/external-listings/websites/:hostname       unregister (listings are kept)
//   POST   /api/vehicles/external-listings/collect-site             { website, count } start a collection
//   GET    /api/vehicles/external-listings/collect-site/status      live progress + recent runs
//   POST   /api/vehicles/external-listings/collect-site/cancel      stop the running collection

import VehicleExternalListing from "../../models/VehicleExternalListing.js";
import {
    getSupportedSources,
    removeSupportedSource,
} from "../../services/externalListings/sources/externalListingSource.js";
import {
    MAX_LISTINGS_PER_RUN,
    cancelCollectionJob,
    getCollectionStatus,
    resolveWebsite,
    startCollectionJob,
} from "../../services/externalListings/siteCollector.js";
import { isAvailabilityCheckRunning } from "../../services/externalListings/availabilityChecker.js";

function stripWww(hostname) {
    return String(hostname || "").toLowerCase().replace(/^www\./, "");
}

function errorMessage(error) {
    return error instanceof Error ? error.message : "An unexpected error occurred.";
}

// GET /api/vehicles/external-listings/websites
export async function getCollectableWebsites(req, res) {
    try {
        const sources = getSupportedSources();

        // Listings stored per domain.
        const counts = await VehicleExternalListing.aggregate([
            {
                $group: {
                    _id: "$sourceDomain",
                    total: { $sum: 1 },
                    active: {
                        $sum: { $cond: [{ $eq: ["$status", "active"] }, 1, 0] },
                    },
                    lastAddedAt: { $max: "$createdAt" },
                },
            },
        ]);

        // "www.site.ma" and "site.ma" are the same website.
        const countByDomain = new Map();

        for (const item of counts) {
            const domain = stripWww(item._id);
            const previous = countByDomain.get(domain);

            countByDomain.set(domain, {
                total: (previous?.total || 0) + item.total,
                active: (previous?.active || 0) + item.active,
                lastAddedAt:
                    !previous?.lastAddedAt || item.lastAddedAt > previous.lastAddedAt
                        ? item.lastAddedAt
                        : previous.lastAddedAt,
            });
        }

        const websites = sources.map((source) => {
            const domains = [...new Set((source.hostnames || []).map(stripWww))];

            const stats = domains.reduce(
                (sum, domain) => {
                    const item = countByDomain.get(domain);

                    if (!item) return sum;

                    return {
                        total: sum.total + item.total,
                        active: sum.active + item.active,
                        lastAddedAt:
                            !sum.lastAddedAt || item.lastAddedAt > sum.lastAddedAt
                                ? item.lastAddedAt
                                : sum.lastAddedAt,
                    };
                },
                { total: 0, active: 0, lastAddedAt: null }
            );

            return {
                sourceName: source.sourceName,
                hostname: domains[0] || "",
                hostnames: source.hostnames || [],
                pathPrefix: source.pathPrefix || "/",
                hasCustomDiscovery: Boolean(
                    source.listPageUrls?.length || source.sitemapUrls?.length || source.linkPattern
                ),
                listingCount: stats.total,
                activeListingCount: stats.active,
                lastAddedAt: stats.lastAddedAt,
                lastCollectedAt: source.lastCollectedAt || null,
                lastCollectSummary: source.lastCollectSummary || null,
                // { allowed, reason, checkedAt }: websites whose robots.txt
                // forbids visiting them are skipped.
                robots: source.robots || null,
                // Live search settings (see live/searchUrlBuilder.js).
                search: source.search || null,
            };
        });

        return res.status(200).json({
            success: true,
            maxPerRun: MAX_LISTINGS_PER_RUN,
            websites,
        });
    } catch (error) {
        console.error("[VehicleExternalListings] Could not load websites:", error);

        return res.status(500).json({
            success: false,
            message: "Could not load the listing websites.",
        });
    }
}

// POST /api/vehicles/external-listings/websites   { website }
export async function addCollectableWebsite(req, res) {
    try {
        const { source, registered, learnedPrefix } = await resolveWebsite(req.body?.website);

        return res.status(registered ? 201 : 200).json({
            success: true,
            registered,
            learnedPrefix: learnedPrefix || null,
            message: registered
                ? `${source.sourceName} was added.`
                : learnedPrefix
                  ? `${source.sourceName}: listing pages are now recognized (${learnedPrefix}).`
                  : `${source.sourceName} is already registered.`,
            website: {
                sourceName: source.sourceName,
                hostname: stripWww(source.hostnames?.[0]),
                pathPrefix: source.pathPrefix,
            },
        });
    } catch (error) {
        return res.status(400).json({
            success: false,
            message: errorMessage(error),
        });
    }
}

// DELETE /api/vehicles/external-listings/websites/:hostname
export async function deleteCollectableWebsite(req, res) {
    try {
        const removed = removeSupportedSource(req.params.hostname);

        return res.status(removed ? 200 : 404).json({
            success: removed,
            message: removed
                ? "Website removed. Its listings stay in the application."
                : "Website not found.",
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: errorMessage(error),
        });
    }
}

// POST /api/vehicles/external-listings/collect-site   { website, count }
export async function startWebsiteCollection(req, res) {
    try {
        // One website visit at a time: do not collect during a check.
        if (isAvailabilityCheckRunning()) {
            return res.status(409).json({
                success: false,
                message: "An availability check is running. Collect when it is finished.",
                ...getCollectionStatus(),
            });
        }

        const job = startCollectionJob({
            website: req.body?.website,
            count: req.body?.count,
            requestedBy: req.user?.email || req.user?.id || "",
        });

        return res.status(202).json({
            success: true,
            message: "Collection started.",
            job,
        });
    } catch (error) {
        return res.status(error.status || 400).json({
            success: false,
            message: errorMessage(error),
            ...getCollectionStatus(),
        });
    }
}

// GET /api/vehicles/external-listings/collect-site/status
export async function getWebsiteCollectionStatus(req, res) {
    return res.status(200).json({
        success: true,
        ...getCollectionStatus(),
    });
}

// POST /api/vehicles/external-listings/collect-site/cancel
export async function cancelWebsiteCollection(req, res) {
    const cancelled = cancelCollectionJob();

    return res.status(200).json({
        success: true,
        cancelled,
        message: cancelled
            ? "The collection will stop after the current listing."
            : "No collection is running.",
    });
}
