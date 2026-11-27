// backend/apps/workers/index.js
//
// Daily worker service ("Find a worker"): artisans and day workers publish one
// profile with up to 5 trade offers (price per day or per task, deposit...).
// API under /api/workers.

import router from "./routes/index.js";
import { registerService } from "../main/services/serviceRegistry.js";
import { getUserDetailStats, getUserListStats, onUserDeleted, userActivity, userListDefaults } from "./services/userHooks.js";

registerService("workers", { userListDefaults, userActivity, getUserListStats, getUserDetailStats, onUserDeleted });

export default {
    name: "workers",
    basePath: "/api/workers",
    router,
    startJobs() {},
};
