
import "dotenv/config";
import http from "node:http";

import app from "./app.js";
import connectDB from "./config/db.js";
import initializeSocket from "./config/socket.js";

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
        
        const server = http.createServer(app);
        console.log("[STARTUP] Initializing Socket.IO...");
        const io = initializeSocket(server);

        app.set("io", io);

        server.listen(PORT, "0.0.0.0", () => {
            console.log(`Server running on port ${PORT}`);
        });
    } catch (error) {
        console.error("Failed to start server:", error);
        process.exit(1);
    }
};

startServer();
