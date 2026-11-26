// backend/apps/vehicles/jobs/externalListingsAvailabilityJob.js
//
// Weekly check: removes external listings that are no longer available on
// their websites (every Sunday at 04:00, server time).
//
// Started by apps/vehicles/index.js when VEHICLE_EXTERNAL_LISTINGS_WEEKLY_CHECK=true is set in .env.
//
// Change the schedule with VEHICLE_EXTERNAL_LISTINGS_CHECK_CRON (cron syntax).

import cron from "node-cron";

import {
    isAvailabilityCheckRunning,
    runAvailabilityCheck,
} from "../services/externalListings/availabilityChecker.js";
import { getCollectionStatus } from "../services/externalListings/siteCollector.js";

let isRunning = false;

export function startExternalListingsAvailabilityJob() {
    const schedule = process.env.VEHICLE_EXTERNAL_LISTINGS_CHECK_CRON || "0 4 * * 0";

    cron.schedule(schedule, async () => {
        if (isRunning || isAvailabilityCheckRunning()) {
            console.log("[Vehicle External Listings] An availability check is already running.");
            return;
        }

        isRunning = true;

        try {
            // Wait for a running collection to finish.
            while (getCollectionStatus().running) {
                await new Promise((resolve) => setTimeout(resolve, 10000));
            }

            const job = await runAvailabilityCheck({ website: "all" });

            console.log("[Vehicle External Listings] Weekly availability check:", job?.message);
        } catch (error) {
            console.error("[Vehicle External Listings] Weekly availability check failed:", error.message);
        } finally {
            isRunning = false;
        }
    });

    console.log(`[Vehicle External Listings] Availability check scheduled (${schedule}).`);
}
