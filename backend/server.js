
import "dotenv/config";
import http from "node:http";

import app from "./app.js";
import connectDB from "./config/db.js";
import initializeSocket from "./config/socket.js";
import { moveWhatsappNumber } from "./services/migrations/moveWhatsappNumber.js";
import { startExternalListingsCollectionJob } from "./jobs/externalListingsCollectionJob.js";
import { startExternalListingsAvailabilityJob } from "./jobs/externalListingsAvailabilityJob.js";
import { startListingExpiryJob } from "./jobs/listingExpiryJob.js";

const PORT = process.env.PORT || 3000;

const showOutboundIP = async () => {
    try {
        const response = await fetch("https://api.ipify.org?format=json");
        const data = await response.json();

        console.log("BACK4APP_OUTBOUND_IP:", data.ip);
    } catch (error) {
        console.error("Could not detect outbound IP:", error.message);
    }
};

const startServer = async () => {
    try {
        await showOutboundIP();
        console.log("[STARTUP] Starting backend...");
        console.log("[STARTUP] Environment:", process.env.NODE_ENV);
        console.log("[STARTUP] Port:", PORT);
        
        console.log("[STARTUP] Connecting to MongoDB...");
        await connectDB();
        console.log("[STARTUP] MongoDB connected successfully.");

        // One-time data move (does nothing once done).
        try {
            await moveWhatsappNumber();
        } catch (migrationError) {
            console.error("[STARTUP] WhatsApp number migration failed:", migrationError.message);
        }
        
        const server = http.createServer(app);
        console.log("[STARTUP] Initializing Socket.IO...");
        const io = initializeSocket(server);

        app.set("io", io);

        server.listen(PORT, "0.0.0.0", () => {
            console.log(`Server running on port ${PORT}`);
        });

        // Optional scheduled jobs, off unless enabled in .env:
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
    } catch (error) {
        console.error("Failed to start server:", error);
        process.exit(1);
    }
};

startServer();
