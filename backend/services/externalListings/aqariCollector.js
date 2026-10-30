import crypto from "node:crypto";
import ExternalListing from "../../DatabaseModels/Schema/ExternalListing.js";
import {
    discoverAqariListings,
    extractAqariListing,
} from "./sources/aqariSource.js";

export async function collectAqariListings() {
    const urls = await discoverAqariListings();

    const result = {
        discovered: urls.length,
        inserted: 0,
        updated: 0,
        skipped: 0,
        deleted: 0,
        errors: [],
    };

    for (const sourceUrl of urls) {
        try {
            // Extract and normalize the external listing.
            const listing = await extractAqariListing(sourceUrl);

            // Skip and remove an existing record if extraction completed
            // successfully but returned no listing or no usable images.
            if (
                !listing ||
                !listing.sourceUrl ||
                !listing.title ||
                !listing.imageUrl ||
                !Array.isArray(listing.imageUrls) ||
                listing.imageUrls.length === 0
            ) {
                const deletion = await ExternalListing.deleteOne({
                    sourceUrl,
                });

                result.skipped += 1;

                if (deletion.deletedCount > 0) {
                    result.deleted += deletion.deletedCount;
                }

                console.log(
                    `[External Listings] Skipped listing without usable images: ${sourceUrl}`
                );

                continue;
            }

            const contentHash = crypto
                .createHash("sha256")
                .update(JSON.stringify(listing))
                .digest("hex");

            const existing = await ExternalListing.findOne({
                sourceUrl,
            }).select("_id");

            const update = {
                ...listing,
                sourceUrl,
                contentHash,
                lastCheckedAt: new Date(),
                lastSeenAt: new Date(),
                lastError: "",
                status: "active",
            };

            // Do not write undefined values into MongoDB.
            for (const [key, value] of Object.entries(update)) {
                if (value === undefined) {
                    delete update[key];
                }
            }

            // publishedAt should only be set when inserting a new record.
            const publishedAt = update.publishedAt;
            delete update.publishedAt;

            await ExternalListing.findOneAndUpdate(
                { sourceUrl },
                {
                    $set: update,
                    $setOnInsert: {
                        publishedAt: publishedAt ?? new Date(),
                    },
                },
                {
                    returnDocument: "after",
                    upsert: true,
                    runValidators: true,
                    setDefaultsOnInsert: true,
                }
            );

            if (existing) {
                result.updated += 1;
            } else {
                result.inserted += 1;
            }
        } catch (error) {
            // Network errors and extraction exceptions are recorded, not
            // treated as proof that the listing has no images.
            result.errors.push({
                sourceUrl,
                error: error.message || "Unknown collection error",
            });

            console.error(
                `[External Listings] Failed to collect ${sourceUrl}:`,
                error.message
            );
        }
    }

    return result;
}