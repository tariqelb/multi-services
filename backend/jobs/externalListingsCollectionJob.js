
import cron from "node-cron";
import { collectAqariListings } from "../services/externalListings/aqariCollector.js";

let isRunning = false;

export function startExternalListingsCollectionJob() {
    cron.schedule(
        "0 0 * * *",
        async () => {
            if (isRunning) {
                console.log(
                    "[External Listings] Previous collection is still running."
                );
                return;
            }

            isRunning = true;

            try {
                console.log(
                    "[External Listings] Starting nightly collection..."
                );

                const result = await collectAqariListings();

                console.log(
                    "[External Listings] Nightly collection completed:",
                    result
                );
            } catch (error) {
                console.error(
                    "[External Listings] Nightly collection failed:",
                    error
                );
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
