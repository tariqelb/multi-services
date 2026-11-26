// backend/apps/vehicles/index.js
//
// Vehicles service: vehicles for sale or rent, published by owners, agencies and showrooms.
// API under /api/vehicles.

import router from "./routes/index.js";
import { startRequestJobs } from "./jobs/requestJobs.js";
import { startExternalListingsCollectionJob } from "./jobs/externalListingsCollectionJob.js";
import { startExternalListingsAvailabilityJob } from "./jobs/externalListingsAvailabilityJob.js";
import { registerService } from "../main/services/serviceRegistry.js";
import {
    getListingSummary,
    getPublishingActivity,
    getUserDetailStats,
    getUserListStats,
    onUserDeleted,
    userListDefaults,
    userActivity,
} from "./services/userHooks.js";

registerService("vehicles", { userListDefaults, userActivity, getUserListStats, getUserDetailStats, onUserDeleted, getPublishingActivity, getListingSummary });

export default {
    name: "vehicles",
    basePath: "/api/vehicles",
    router,
    startJobs({ io } = {}) {
        // Requests: daily summary and expiry (on unless REQUESTS_JOBS_ENABLED=false).
        if (process.env.REQUESTS_JOBS_ENABLED !== "false") {
            startRequestJobs(io);
        }

        // External listings (Avito, Moteur.ma...): nightly collection and weekly check, off by default.
        if (process.env.VEHICLE_EXTERNAL_LISTINGS_NIGHTLY_COLLECT === "true") {
            startExternalListingsCollectionJob();
        }
        if (process.env.VEHICLE_EXTERNAL_LISTINGS_WEEKLY_CHECK === "true") {
            startExternalListingsAvailabilityJob();
        }
    },
};
