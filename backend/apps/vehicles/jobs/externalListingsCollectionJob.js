// backend/apps/vehicles/jobs/externalListingsCollectionJob.js
//
// Nightly collection (01:00, after the property one): for every registered vehicle website, collect up to
// VEHICLE_EXTERNAL_LISTINGS_NIGHTLY_COUNT (default 30) NEW listings. Websites whose
// robots.txt forbids visiting them are skipped (checked again every night).
//
// Started by apps/vehicles/index.js when VEHICLE_EXTERNAL_LISTINGS_NIGHTLY_COLLECT=true is set in .env.

import cron from "node-cron";

import { getSupportedSources } from "../services/externalListings/sources/externalListingSource.js";
import {
    getCollectionStatus,
    runCollection,
} from "../services/externalListings/siteCollector.js";

let isRunning = false;

export async function collectAllWebsites(count) {
    const perWebsite = Number(count) || Number(process.env.VEHICLE_EXTERNAL_LISTINGS_NIGHTLY_COUNT) || 30;
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
        process.env.VEHICLE_EXTERNAL_LISTINGS_COLLECT_CRON || "0 1 * * *",
        async () => {
            if (isRunning) {
                console.log("[Vehicle External Listings] Previous collection is still running.");
                return;
            }

            isRunning = true;

            try {
                console.log("[Vehicle External Listings] Starting nightly collection...");

                const results = await collectAllWebsites();

                console.log("[Vehicle External Listings] Nightly collection completed:", results);
            } catch (error) {
                console.error("[Vehicle External Listings] Nightly collection failed:", error);
            } finally {
                isRunning = false;
            }
        },
        {
            timezone: "Africa/Casablanca",
        }
    );

    console.log(
        "[Vehicle External Listings] Nightly collection scheduled (Africa/Casablanca)."
    );
}
