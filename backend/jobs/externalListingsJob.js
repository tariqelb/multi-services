import ExternalListing from "../DatabaseModels/Schema/ExternalListing.js";

import {
    extractAqariListing,
    supportsAqariUrl,
} from "../services/externalListings/sources/aqariSource.js";

import {
    extractPageMetadata,
} from "../services/externalListings/metadataExtractor.js";

async function refreshListing(listing) {
    const extracted = supportsAqariUrl(listing.sourceUrl)
        ? await extractAqariListing(listing.sourceUrl)
        : await extractPageMetadata(listing.sourceUrl);

    listing.lastCheckedAt = new Date();
    listing.lastSeenAt = new Date();
    listing.lastError = "";
    listing.status = "active";
    listing.contentHash = extracted.contentHash || "";

    await listing.save();
}

export async function runExternalListingsJob() {
    console.info("[ExternalListings] Starting refresh.");

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

            try {
                await listing.save();
            } catch (saveError) {
                console.error(
                    "[ExternalListings] Could not save refresh error:",
                    saveError.message
                );
            }

            console.error(
                "[ExternalListings] Refresh failed:",
                listing.sourceUrl,
                error.message
            );
        }

        // Avoid sending requests too quickly to source websites.
        await new Promise((resolve) => setTimeout(resolve, 2000));
    }

    console.info(
        `[ExternalListings] Finished. Processed ${listings.length} listings.`
    );
}