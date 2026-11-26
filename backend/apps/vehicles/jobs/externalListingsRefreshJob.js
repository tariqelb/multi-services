// backend/apps/vehicles/jobs/externalListingsRefreshJob.js
//
// Refreshes the 10 vehicle external listings checked the longest time ago
// (Admin > Vehicles > External listings > Refresh).

import VehicleExternalListing from "../models/VehicleExternalListing.js";

import {
    extractExternalListing,
    supportsExternalListingUrl,
} from "../services/externalListings/sources/externalListingSource.js";

// Fields refreshed from the source website. Listings edited manually by an
// administrator (extractionMethod "manual") keep their values.
const REFRESHED_FIELDS = [
    "title",
    "description",
    "imageUrl",
    "imageUrls",
    "price",
    "currency",
    "priceUnit",
    "listingType",
    "category",
    "make",
    "model",
    "year",
    "mileage",
    "fuel",
    "transmission",
    "city",
    "neighborhood",
];

const isEmpty = (value) =>
    value === null ||
    value === undefined ||
    value === "" ||
    (Array.isArray(value) && value.length === 0);

async function refreshListing(listing) {
    if (!supportsExternalListingUrl(listing.sourceUrl)) {
        throw new Error("Unsupported listing source URL.");
    }

    const extracted = await extractExternalListing(listing.sourceUrl);

    if (!extracted) {
        throw new Error("Could not extract usable listing information.");
    }

    if (listing.extractionMethod !== "manual") {
        for (const field of REFRESHED_FIELDS) {
            // Never erase a stored value with an empty one.
            if (!isEmpty(extracted[field])) {
                listing[field] = extracted[field];
            }
        }

        listing.extractionMethod = extracted.extractionMethod || listing.extractionMethod;
    }

    listing.lastCheckedAt = new Date();
    listing.lastSeenAt = new Date();
    listing.lastError = "";
    listing.status = "active";
    listing.contentHash = extracted.contentHash || listing.contentHash || "";

    await listing.save();
}

export async function runExternalListingsJob() {
    console.info("[VehicleExternalListings] Starting refresh.");

    const listings = await VehicleExternalListing.find({
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
                error instanceof Error ? error.message : "Refresh failed.";

            try {
                await listing.save();
            } catch (saveError) {
                console.error(
                    "[VehicleExternalListings] Could not save refresh error:",
                    saveError.message
                );
            }

            console.error(
                "[VehicleExternalListings] Refresh failed:",
                listing.sourceUrl,
                error.message
            );
        }

        // Avoid sending requests too quickly.
        await new Promise((resolve) => setTimeout(resolve, 2000));
    }

    const summary = {
        processed: listings.length,
        succeeded,
        failed,
    };

    console.info("[VehicleExternalListings] Finished:", summary);

    return summary;
}
