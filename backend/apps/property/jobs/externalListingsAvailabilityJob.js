// backend/apps/property/jobs/externalListingsAvailabilityJob.js
//
// Weekly check: removes external listings that are no longer available on
// their websites (every Sunday at 03:00, server time).
//
// Started by server.js when EXTERNAL_LISTINGS_WEEKLY_CHECK=true is set in .env.
//
// Change the schedule with EXTERNAL_LISTINGS_CHECK_CRON (cron syntax).

import cron from "node-cron";

import {
    isAvailabilityCheckRunning,
    runAvailabilityCheck,
} from "../services/externalListings/availabilityChecker.js";
import { getCollectionStatus } from "../services/externalListings/siteCollector.js";

let isRunning = false;

export function startExternalListingsAvailabilityJob() {
    const schedule = process.env.EXTERNAL_LISTINGS_CHECK_CRON || "0 3 * * 0";

    cron.schedule(schedule, async () => {
        if (isRunning || isAvailabilityCheckRunning()) {
            console.log("[External Listings] An availability check is already running.");
            return;
        }

        isRunning = true;

        try {
            // Wait for a running collection to finish.
            while (getCollectionStatus().running) {
                await new Promise((resolve) => setTimeout(resolve, 10000));
            }

            const job = await runAvailabilityCheck({ website: "all" });

            console.log("[External Listings] Weekly availability check:", job?.message);
        } catch (error) {
            console.error("[External Listings] Weekly availability check failed:", error.message);
        } finally {
            isRunning = false;
        }
    });

    console.log(`[External Listings] Availability check scheduled (${schedule}).`);
}
