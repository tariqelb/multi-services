// services/externalListings/siteCollector.js
//
// "Collect N new listings from website X".
//
//   const job = startCollectionJob({ website: "mrsemsar.ma", count: 20 });
//   getCollectionStatus() -> { current, history }
//
// The collector:
//   1. resolves (or registers) the website,
//   2. asks siteDiscovery for candidate listing URLs, newest first,
//   3. skips URLs already stored in ExternalListing,
//   4. extracts and saves new listings until `count` is reached,
//   5. remembers the detected listing path and a summary in
//      supportedSources.json.
//
// Only one collection runs at a time (one website is visited slowly and
// politely). Progress is kept in memory so the admin page can poll it.

import crypto from "node:crypto";

import {
    discoverListingUrls,
    fetchText,
    urlVariants,
} from "./siteDiscovery.js";
import {
    extractExternalListing,
    findSourceByWebsite,
    parseWebsiteInput,
    registerSupportedSource,
    updateSupportedSource,
} from "./sources/externalListingSource.js";

export const MAX_LISTINGS_PER_RUN = 50;
const DEFAULT_LISTING_DELAY_MS = 1500;
const MAX_CANDIDATES_CHECKED = 1000; // safety stop for one run
const HISTORY_SIZE = 10;

let currentJob = null;
const history = [];

/* --------------------------------------------------
   Helpers
-------------------------------------------------- */

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function createContentHash(data) {
    return crypto
        .createHash("sha256")
        .update(
            JSON.stringify({
                title: data.title,
                description: data.description,
                imageUrl: data.imageUrl,
                price: data.price,
                currency: data.currency,
                priceUnit: data.priceUnit,
            })
        )
        .digest("hex");
}

function publicJob(job) {
    if (!job) return null;

    // Never expose internal functions.
    const { cancelRequested, ...rest } = job;

    return { ...rest, cancelRequested: Boolean(cancelRequested) };
}

function pushError(job, message) {
    job.errors.push(String(message).slice(0, 300));

    if (job.errors.length > 15) job.errors.shift();
}

async function defaultModel() {
    const module = await import("../../DatabaseModels/Schema/ExternalListing.js");
    return module.default;
}

// Listings removed earlier (no longer available) must not come back.
async function defaultGetRemoved() {
    const module = await import("./removedListings.js");
    return module.getRemovedVariants;
}

/* --------------------------------------------------
   Website resolution
-------------------------------------------------- */

/**
 * Find a registered website, or register a new one after checking that
 * its home page answers.
 */
function learnedPrefixFromUrl(website) {
    try {
        const text = String(website || "").trim();
        const url = new URL(/^https?:\/\//i.test(text) ? text : `https://${text}`);
        const segments = url.pathname.split("/").filter(Boolean);

        // "/annonce/villa-12" -> "/annonce/"
        return segments.length >= 2 ? `/${segments.slice(0, -1).join("/")}/` : null;
    } catch {
        return null;
    }
}

export async function resolveWebsite(website, { fetchImpl = fetchText } = {}) {
    const existing = findSourceByWebsite(website);

    if (existing) {
        // An example listing URL teaches the listing path of a website
        // whose path is still unknown ("/").
        const learned = learnedPrefixFromUrl(website);

        if (learned && (existing.pathPrefix || "/") === "/" && !existing.linkPattern) {
            const updated = updateSupportedSource(existing.hostnames[0], { pathPrefix: learned });

            return { source: updated || existing, registered: false, learnedPrefix: learned };
        }

        return { source: existing, registered: false };
    }

    const hostname = parseWebsiteInput(website);

    if (!hostname) {
        throw new Error(
            "Type a website domain, for example: mrsemsar.ma"
        );
    }

    // When a full listing URL was typed, keep its path so the listing
    // section ("/annonce/") is learned immediately.
    let registrationUrl = `https://${hostname}/`;

    try {
        const typed = new URL(
            /^https?:\/\//i.test(website.trim()) ? website.trim() : `https://${website.trim()}`
        );

        if (typed.pathname.split("/").filter(Boolean).length >= 2) {
            registrationUrl = `https://${hostname}${typed.pathname}`;
        }
    } catch {
        // keep the home page
    }

    // The website must exist and be public before it is registered.
    await fetchImpl(`https://${hostname}/`, {
        allowedHosts: [hostname, hostname.replace(/^www\./, ""), `www.${hostname.replace(/^www\./, "")}`],
    });

    const source = await registerSupportedSource(registrationUrl);

    return { source, registered: true };
}

/* --------------------------------------------------
   Collection
-------------------------------------------------- */

/**
 * Run one collection. `job` is mutated with live progress.
 *
 * deps (all optional, used by tests):
 *   Model, fetchImpl, extractImpl, listingDelayMs, pageDelayMs
 */
export async function collectFromWebsite(job, deps = {}) {
    const Model = deps.Model || (await defaultModel());
    const fetchImpl = deps.fetchImpl || fetchText;
    const extractImpl = deps.extractImpl || extractExternalListing;
    const listingDelayMs = deps.listingDelayMs ?? DEFAULT_LISTING_DELAY_MS;
    const getRemoved = deps.getRemovedImpl || (await defaultGetRemoved());

    const { source, registered } = await resolveWebsite(job.website, { fetchImpl });

    job.sourceName = source.sourceName;
    job.hostname = source.hostnames[0];
    job.registered = registered;
    job.phase = "discovering";

    const discovery = discoverListingUrls(source, {
        fetchImpl,
        pageDelayMs: deps.pageDelayMs,
        isCancelled: () => job.cancelRequested,
        onEvent: (event) => {
            if (event.type === "page") job.pagesScanned += 1;
            if (event.type === "sitemap") job.sitemapFiles += 1;
            if (event.type === "prefix") {
                job.detectedPrefix = event.pathPrefix;
                updateSupportedSource(job.hostname, { pathPrefix: event.pathPrefix });
            }
        },
    });

    let discoverySummary = null;
    let checked = 0;

    try {
        while (true) {
            const step = await discovery.next();

            if (step.done) {
                discoverySummary = step.value;
                break;
            }

            const batch = step.value.urls;
            job.discovered += batch.length;

            // Which of these URLs are already in the database?
            const lookup = [...new Set(batch.flatMap(urlVariants))];
            const stored = await Model.find({ sourceUrl: { $in: lookup } })
                .select("sourceUrl")
                .lean();

            const storedVariants = new Set(
                stored.flatMap((item) => urlVariants(item.sourceUrl))
            );

            const removedVariants = await getRemoved(batch);

            for (const url of batch) {
                if (job.cancelRequested) break;
                if (job.saved >= job.requested) break;

                checked += 1;

                if (storedVariants.has(url)) {
                    job.alreadyInDb += 1;
                    continue;
                }

                if (removedVariants.has(url)) {
                    job.skippedRemoved += 1;
                    continue;
                }

                job.phase = "extracting";
                job.currentUrl = url;

                try {
                    const listing = await extractImpl(url);

                    if (!listing || !listing.title || !listing.imageUrl) {
                        job.skippedNoImage += 1;
                    } else {
                        const now = new Date();
                        const { publishedAt, ...data } = listing;

                        await Model.create({
                            ...data,
                            contentHash: createContentHash(listing),
                            status: "active",
                            lastCheckedAt: now,
                            lastSeenAt: now,
                            lastError: "",
                            publishedAt: publishedAt || now,
                        });

                        job.saved += 1;
                        job.savedListings.push({
                            title: listing.title,
                            sourceUrl: listing.sourceUrl,
                            imageUrl: listing.imageUrl,
                            price: listing.price ?? null,
                            currency: listing.currency || "MAD",
                            city: listing.city || "",
                        });
                    }
                } catch (error) {
                    // Duplicate key: saved meanwhile (other variant of the URL).
                    if (error?.code === 11000) {
                        job.alreadyInDb += 1;
                    } else {
                        job.failed += 1;
                        pushError(job, `${url}: ${error.message}`);
                    }
                }

                job.currentUrl = "";
                job.phase = "discovering";

                if (job.saved < job.requested && listingDelayMs) {
                    await sleep(listingDelayMs);
                }
            }

            if (
                job.cancelRequested ||
                job.saved >= job.requested ||
                checked >= MAX_CANDIDATES_CHECKED
            ) {
                break;
            }
        }
    } finally {
        // Stop the discovery generator (closes pending work).
        if (!discoverySummary) {
            const end = await discovery.return(undefined);
            discoverySummary = end?.value || null;
        }
    }

    if (discoverySummary) {
        job.pagesScanned = Math.max(job.pagesScanned, discoverySummary.pagesScanned || 0);
        job.robotsBlocked = discoverySummary.robotsBlocked || 0;

        for (const message of (discoverySummary.errors || []).slice(-5)) {
            pushError(job, message);
        }
    }

    return job;
}

function buildMessage(job) {
    if (job.status === "cancelled") {
        return `Stopped. ${job.saved} new listing(s) were saved before stopping.`;
    }

    if (job.saved >= job.requested) {
        return `${job.saved} new listing(s) added from ${job.sourceName}.`;
    }

    if (job.discovered === 0) {
        return (
            `No listing links were found on ${job.sourceName || job.website}. ` +
            "The website may build its pages with JavaScript or hide its listings. " +
            "Add an example listing URL of this website so its listing path can be learned."
        );
    }

    const removedNote = job.skippedRemoved
        ? ` ${job.skippedRemoved} listing(s) you removed before as unavailable were skipped.`
        : "";

    if (job.saved === 0 && job.alreadyInDb > 0) {
        return `No new listings: the ${job.alreadyInDb} listing(s) found are already in your application.${removedNote}`;
    }

    return `${job.saved} of ${job.requested} new listing(s) added. The website has no more new listings right now.${removedNote}`;
}

/* --------------------------------------------------
   Job manager
-------------------------------------------------- */

export function getCollectionStatus() {
    return {
        current: publicJob(currentJob),
        running: Boolean(currentJob && currentJob.status === "running"),
        history: history.map(publicJob),
    };
}

export function cancelCollectionJob() {
    if (!currentJob || currentJob.status !== "running") return false;

    currentJob.cancelRequested = true;
    return true;
}

/**
 * Start a collection in the background. Throws when one is running.
 */
export function startCollectionJob({ website, count, requestedBy = "" }, deps = {}) {
    if (currentJob && currentJob.status === "running") {
        const error = new Error("A collection is already running. Wait for it to finish.");
        error.status = 409;
        throw error;
    }

    const requested = Math.min(
        MAX_LISTINGS_PER_RUN,
        Math.max(1, Number.parseInt(count, 10) || 0)
    );

    if (!website || typeof website !== "string" || !website.trim()) {
        const error = new Error("The website is required.");
        error.status = 400;
        throw error;
    }

    const job = {
        id: crypto.randomUUID(),
        website: website.trim(),
        sourceName: "",
        hostname: "",
        registered: false,
        requested,
        status: "running",
        phase: "starting",
        saved: 0,
        alreadyInDb: 0,
        skippedRemoved: 0,
        skippedNoImage: 0,
        failed: 0,
        discovered: 0,
        pagesScanned: 0,
        sitemapFiles: 0,
        robotsBlocked: 0,
        detectedPrefix: null,
        currentUrl: "",
        savedListings: [],
        errors: [],
        message: "",
        requestedBy,
        startedAt: new Date().toISOString(),
        finishedAt: null,
        cancelRequested: false,
    };

    currentJob = job;

    (async () => {
        try {
            await collectFromWebsite(job, deps);
            job.status = job.cancelRequested ? "cancelled" : "completed";
        } catch (error) {
            job.status = "failed";
            pushError(job, error.message);
        } finally {
            job.phase = "done";
            job.currentUrl = "";
            job.finishedAt = new Date().toISOString();
            job.message =
                job.status === "failed"
                    ? job.errors[job.errors.length - 1] || "The collection failed."
                    : buildMessage(job);

            if (job.hostname) {
                try {
                    updateSupportedSource(job.hostname, {
                        lastCollectedAt: job.finishedAt,
                        lastCollectSummary: {
                            requested: job.requested,
                            saved: job.saved,
                            alreadyInDb: job.alreadyInDb,
                            skippedNoImage: job.skippedNoImage,
                            failed: job.failed,
                            status: job.status,
                        },
                    });
                } catch (error) {
                    console.error("[ExternalListings] Could not save summary:", error.message);
                }
            }

            history.unshift({ ...job });
            if (history.length > HISTORY_SIZE) history.pop();

            console.log(
                `[ExternalListings] Collection ${job.status} for ${job.website}: ` +
                    `${job.saved}/${job.requested} saved, ${job.alreadyInDb} already stored, ` +
                    `${job.skippedNoImage} without images, ${job.failed} failed.`
            );
        }
    })();

    return publicJob(job);
}

/**
 * Run a collection and wait for the result (used by the nightly job).
 */
export async function runCollection({ website, count }, deps = {}) {
    startCollectionJob({ website, count, requestedBy: "scheduler" }, deps);

    while (currentJob && currentJob.status === "running") {
        await sleep(500);
    }

    return publicJob(currentJob);
}
