// backend/apps/main/index.js
//
// Main service: accounts, settings and notifications, shared by every service.

import router from "./routes/index.js";

export default {
    name: "main",
    basePath: "/api",
    router,
    startJobs() {
        // Account deletion runs as a script (npm run job:account-deletion).
        // Requests jobs run in each service (property/, vehicles/).
    },
};
