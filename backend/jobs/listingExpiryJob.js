// jobs/listingExpiryJob.js
//
// Every day (09:00 server time by default): reminds owners whose listing
// was not confirmed for 53 days, and sets listings not confirmed for 60
// days to Inactive. See services/listingExpiry.js.
//
// On by default. LISTING_EXPIRY_ENABLED=false turns it off.
// Schedule: LISTING_EXPIRY_CRON (cron syntax), default "0 9 * * *".

import cron from "node-cron";

import { runListingExpiry } from "../services/listingExpiry.js";

let running = false;

async function runOnce(io) {
    if (running) return;
    running = true;

    try {
        const summary = await runListingExpiry({ io });
        console.log("[ListingExpiry] Done:", JSON.stringify(summary));
    } catch (error) {
        console.error("[ListingExpiry] Failed:", error);
    } finally {
        running = false;
    }
}

export function startListingExpiryJob(io) {
    const schedule = process.env.LISTING_EXPIRY_CRON || "0 9 * * *";

    cron.schedule(schedule, () => runOnce(io));

    // Also shortly after start (the first run starts the 60 days for
    // older listings; later runs only send what is due).
    setTimeout(() => runOnce(io), 2 * 60 * 1000).unref?.();

    console.log(`[ListingExpiry] Scheduled (${schedule}).`);
}
