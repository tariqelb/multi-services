import ExternalListing from "../DatabaseModels/Schema/ExternalListing.js";

import {
    extractExternalListing,
    supportsExternalListingUrl,
} from "../services/externalListings/sources/externalListingSource.js";

async function refreshListing(listing) {
    if (!supportsExternalListingUrl(listing.sourceUrl)) {
        throw new Error(
            "Unsupported listing source URL."
        );
    }

    const extracted = await extractExternalListing(
        listing.sourceUrl
    );

    if (!extracted) {
        throw new Error(
            "Could not extract usable listing information."
        );
    }

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

    let succeeded = 0;
    let failed = 0;

    for (const listing of listings) {
        try {
            await refreshListing(listing);
            succeeded++;
        } catch (error) {
            failed++;

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

        // Avoid sending requests too quickly.
        await new Promise((resolve) =>
            setTimeout(resolve, 2000)
        );
    }

    const summary = {
        processed: listings.length,
        succeeded,
        failed,
    };

    console.info(
        "[ExternalListings] Finished:",
        summary
    );

    return summary;
}