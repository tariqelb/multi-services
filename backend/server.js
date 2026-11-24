
import "dotenv/config";
import http from "node:http";

import app from "./app.js";
import connectDB from "./config/db.js";
import initializeSocket from "./config/socket.js";
import { moveWhatsappNumber } from "./apps/main/services/migrations/moveWhatsappNumber.js";
import services from "./apps/index.js";

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

        // Scheduled jobs of every service (see apps/<service>/index.js).
        for (const service of services) {
            service.startJobs({ io });
        }
    } catch (error) {
        console.error("Failed to start server:", error);
        process.exit(1);
    }
};

startServer();
