// backend/apps/property/jobs/externalListingsCollectionJob.js
//
// Nightly collection: for every registered website, collect up to
// EXTERNAL_LISTINGS_NIGHTLY_COUNT (default 30) NEW listings. Websites whose
// robots.txt forbids visiting them are skipped (checked again every night).
//
// Started by server.js when EXTERNAL_LISTINGS_NIGHTLY_COLLECT=true is set in .env.

import cron from "node-cron";

import { getSupportedSources } from "../services/externalListings/sources/externalListingSource.js";
import {
    getCollectionStatus,
    runCollection,
} from "../services/externalListings/siteCollector.js";

let isRunning = false;

export async function collectAllWebsites(count) {
    const perWebsite = Number(count) || Number(process.env.EXTERNAL_LISTINGS_NIGHTLY_COUNT) || 30;
    const results = [];

    for (const source of getSupportedSources()) {
        const website = source.hostnames?.[0];

        if (!website) continue;

        // Wait if an administrator started a collection manually.
        while (getCollectionStatus().running) {
            await new Promise((resolve) => setTimeout(resolve, 5000));
        }

        try {
            const job = await runCollection({ website, count: perWebsite });

            results.push({
                website,
                status: job?.status,
                saved: job?.saved ?? 0,
                alreadyInDb: job?.alreadyInDb ?? 0,
            });
        } catch (error) {
            results.push({ website, status: "failed", error: error.message });
        }
    }

    return results;
}

export function startExternalListingsCollectionJob() {
    cron.schedule(
        "0 0 * * *",
        async () => {
            if (isRunning) {
                console.log("[External Listings] Previous collection is still running.");
                return;
            }

            isRunning = true;

            try {
                console.log("[External Listings] Starting nightly collection...");

                const results = await collectAllWebsites();

                console.log("[External Listings] Nightly collection completed:", results);
            } catch (error) {
                console.error("[External Listings] Nightly collection failed:", error);
            } finally {
                isRunning = false;
            }
        },
        {
            timezone: "Africa/Casablanca",
        }
    );

    console.log(
        "[External Listings] Nightly collection scheduled for midnight (Africa/Casablanca)."
    );
}
