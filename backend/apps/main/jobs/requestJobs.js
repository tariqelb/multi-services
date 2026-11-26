// backend/apps/main/jobs/requestJobs.js
//
// Requests, every day:
//   - REQUESTS_DIGEST_CRON (default "0 8 * * *"): one summary for the
//     professionals who chose "once a day"
//   - REQUESTS_EXPIRY_CRON (default "30 2 * * *"): requests older than 30
//     days become "expired"
// REQUESTS_JOBS_ENABLED=false turns both off.

import cron from "node-cron";

import { expireRequests, runRequestDigest } from "../services/requests/requestNotifier.js";

let running = false;

async function once(name, task) {
    if (running) return;
    running = true;
    try {
        const summary = await task();
        console.log(`[Requests] ${name}:`, JSON.stringify(summary));
    } catch (error) {
        console.error(`[Requests] ${name} failed:`, error);
    } finally {
        running = false;
    }
}

export function startRequestJobs(io) {
    const digest = process.env.REQUESTS_DIGEST_CRON || "0 8 * * *";
    const expiry = process.env.REQUESTS_EXPIRY_CRON || "30 2 * * *";

    cron.schedule(digest, () => once("Daily summary", () => runRequestDigest({ io })));
    cron.schedule(expiry, () => once("Expiry", () => expireRequests()));

    console.log(`[Requests] Scheduled (summary ${digest}, expiry ${expiry}).`);
}
