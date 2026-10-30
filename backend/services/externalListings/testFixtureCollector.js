
import crypto from "node:crypto";
import ExternalListing from "../../DatabaseModels/Schema/ExternalListing.js";
import {
    discoverAqariListings,
} from "./sources/aqariSource.js";

export async function collectTestFixtures() {
    const listings = await discoverTestListings();
    const results = {
        discovered: listings.length,
        inserted: 0,
        updated: 0,
        errors: [],
    };

    for (const listing of listings) {
        try {
            const contentHash = crypto
                .createHash("sha256")
                .update(JSON.stringify(listing))
                .digest("hex");

            const existing = await ExternalListing.findOne({
                sourceUrl: listing.sourceUrl,
            }).select("_id");

            await ExternalListing.findOneAndUpdate(
                { sourceUrl: listing.sourceUrl },
                {
                    $set: {
                        ...listing,
                        contentHash,
                        lastCheckedAt: new Date(),
                        lastSeenAt: new Date(),
                        lastError: "",
                    },
                    $setOnInsert: {
                        publishedAt: new Date(),
                    },
                },
                {
                    upsert: true,
                    new: true,
                    runValidators: true,
                    setDefaultsOnInsert: true,
                }
            );

            if (existing) {
                results.updated += 1;
            } else {
                results.inserted += 1;
            }
        } catch (error) {
            results.errors.push({
                sourceUrl: listing.sourceUrl,
                error: error.message,
            });
        }
    }

    return results;
}

