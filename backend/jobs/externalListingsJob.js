import cron from "node-cron";

import ExternalListing from "../DatabaseModels/Schema/ExternalListing.js";

import {
    extractAqariListing,
    supportsAqariUrl,
} from "../services/externalListings/sources/aqariSource.js";

import {
    extractPageMetadata,
} from "../services/externalListings/metadataExtractor.js";

let isRunning = false;

async function refreshListing(listing) {
    const extracted = supportsAqariUrl(listing.sourceUrl)
        ? await extractAqariListing(listing.sourceUrl)
        : await extractPageMetadata(listing.sourceUrl);

    listing.lastCheckedAt = new Date();
    listing.lastSeenAt = new Date();
    listing.lastError = "";
    listing.status = "active";

    // Preserve listing fields until a field-level
    // manual/source provenance system is implemented.
    listing.contentHash = extracted.contentHash || "";

    await listing.save();
}

export function startExternalListingsJob() {
    cron.schedule(
        "*/15 * * * *",
        async () => {
            if (isRunning) {
                return;
            }

            isRunning = true;

            try {
                const listings = await ExternalListing.find({
                    status: { $ne: "unavailable" },
                })
                    .sort({ lastCheckedAt: 1 })
                    .limit(10);

                for (const listing of listings) {
                    try {
                        await refreshListing(listing);
                    } catch (error) {
                        listing.lastCheckedAt = new Date();
                        listing.lastError =
                            error instanceof Error
                                ? error.message
                                : "Refresh failed.";

                        await listing.save();
                    }

                    // Avoid rapidly sending requests to the
                    // same source website.
                    await new Promise((resolve) =>
                        setTimeout(resolve, 2000)
                    );
                }
            } catch (error) {
                console.error(
                    "External listings job failed:",
                    error
                );
            } finally {
                isRunning = false;
            }
        },
        {
            timezone: "Africa/Casablanca",
        }
    );

    console.log(
        "External listings refresh job scheduled."
    );
}