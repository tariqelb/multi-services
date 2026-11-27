// backend/apps/index.js
//
// Every service of the application. app.js mounts their routes, server.js starts their jobs.
// New service: create apps/<name>/index.js (name, basePath, router, startJobs) and add it here.
// Main is mounted last so a service path such as /api/property is never caught by main.

import property from "./property/index.js";
import vehicles from "./vehicles/index.js";
import workers from "./workers/index.js";
import main from "./main/index.js";

export const services = [property, vehicles, workers, main];

export default services;
