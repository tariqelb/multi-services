// backend/apps/property/services/externalListings/removedListings.js
//
// Removing external listings and remembering them, so a removed listing is
// never collected again.
//
//   await removeListings(listings, { reasonById, removedBy })
//   const removedSet = await getRemovedVariants(urls)   // Set of URL variants
//   await forgetRemoved(url)   // the administrator added it again by hand

import ExternalListing from "../../models/ExternalListing.js";
import ExternalListingRemoved from "../../models/ExternalListingRemoved.js";
import { urlVariants } from "./siteDiscovery.js";

/**
 * Delete listings and remember their URLs.
 *
 * @param {Array<{_id, sourceUrl, sourceDomain, title}>} listings
 * @param {object} options
 *   - reasonById  Map or object: listing id -> reason text
 *   - removedBy   who asked ("admin@site.ma", "scheduler"...)
 *   - Model, RemovedModel   injectable for tests
 * @returns {Promise<number>} number of deleted listings
 */
export async function removeListings(listings, options = {}) {
    const {
        reasonById = {},
        removedBy = "",
        Model = ExternalListing,
        RemovedModel = ExternalListingRemoved,
        // false: not remembered, the collector may add it again
        // (used for listings that could not be reached).
        remember = true,
    } = options;

    const items = (listings || []).filter((item) => item?._id && item?.sourceUrl);

    if (!items.length) return 0;

    const reasonOf = (id) =>
        (reasonById instanceof Map ? reasonById.get(String(id)) : reasonById[String(id)]) ||
        "No longer available on the website.";

    // Remember first: if the deletion fails, nothing is lost.
    if (remember) await Promise.all(
        items.map((item) =>
            RemovedModel.updateOne(
                { sourceUrl: item.sourceUrl },
                {
                    $set: {
                        sourceDomain: item.sourceDomain || "",
                        title: item.title || "",
                        reason: reasonOf(item._id),
                        removedBy,
                        removedAt: new Date(),
                    },
                },
                { upsert: true }
            )
        )
    );

    const result = await Model.deleteMany({
        _id: { $in: items.map((item) => item._id) },
    });

    return result?.deletedCount ?? 0;
}

/**
 * Which of these URLs (in any www / trailing-slash form) were removed before?
 * Returns a Set holding every variant of every removed URL.
 */
export async function getRemovedVariants(urls, { RemovedModel = ExternalListingRemoved } = {}) {
    const lookup = [...new Set((urls || []).flatMap(urlVariants))];

    if (!lookup.length) return new Set();

    const removed = await RemovedModel.find({ sourceUrl: { $in: lookup } })
        .select("sourceUrl")
        .lean();

    return new Set(removed.flatMap((item) => urlVariants(item.sourceUrl)));
}

/** True when this URL was removed before. */
export async function wasRemoved(url, options) {
    const removed = await getRemovedVariants([url], options);
    return removed.has(url);
}

/** Forget a removed URL (an administrator added the listing again). */
export async function forgetRemoved(url, { RemovedModel = ExternalListingRemoved } = {}) {
    if (!url) return;

    await RemovedModel.deleteMany({ sourceUrl: { $in: urlVariants(url) } });
}
