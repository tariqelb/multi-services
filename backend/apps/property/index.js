// backend/apps/property/index.js
//
// Property service: properties, furnished rentals, roommates, hotels & riads,
// external listings. API under /api/property.

import router from "./routes/index.js";
import { registerService } from "../main/services/serviceRegistry.js";
import { getUserDetailStats, getUserListStats, onUserDeleted, userListDefaults } from "./services/userHooks.js";

import { startExternalListingsCollectionJob } from "./jobs/externalListingsCollectionJob.js";
import { startExternalListingsAvailabilityJob } from "./jobs/externalListingsAvailabilityJob.js";
import { startListingExpiryJob } from "./jobs/listingExpiryJob.js";

registerService("property", { userListDefaults, getUserListStats, getUserDetailStats, onUserDeleted });

export default {
    name: "property",
    basePath: "/api/property",
    router,
    startJobs({ io }) {
        // Optional, off unless enabled in .env:
        //   EXTERNAL_LISTINGS_NIGHTLY_COLLECT=true   collect new listings every night
        //   EXTERNAL_LISTINGS_WEEKLY_CHECK=true      remove unavailable listings every week
        if (process.env.EXTERNAL_LISTINGS_NIGHTLY_COLLECT === "true") {
            startExternalListingsCollectionJob();
        }

        if (process.env.EXTERNAL_LISTINGS_WEEKLY_CHECK === "true") {
            startExternalListingsAvailabilityJob();
        }

        // 60-day listing expiry: on unless LISTING_EXPIRY_ENABLED=false.
        if (process.env.LISTING_EXPIRY_ENABLED !== "false") {
            startListingExpiryJob(io);
        }
    },
};
