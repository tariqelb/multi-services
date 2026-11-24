// backend/apps/vehicles/index.js
//
// Vehicles service: vehicles for sale or rent, published by owners, agencies and showrooms.
// API under /api/vehicles.

import router from "./routes/index.js";
import { registerService } from "../main/services/serviceRegistry.js";
import { getUserDetailStats, getUserListStats, onUserDeleted, userListDefaults } from "./services/userHooks.js";

registerService("vehicles", { userListDefaults, getUserListStats, getUserDetailStats, onUserDeleted });

export default {
    name: "vehicles",
    basePath: "/api/vehicles",
    router,
    startJobs() {},
};
