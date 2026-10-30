import "dotenv/config";
import http from "node:http";

import app from "./app.js";
import connectDB from "./config/db.js";
import initializeSocket from "./config/socket.js";

const PORT = process.env.PORT || 3000;

const startServer = async () => {
    try {
        await connectDB();

        const server = http.createServer(app);

        // Initialize Socket.IO on the same HTTP server.
        const io = initializeSocket(server);

        // Make Socket.IO accessible to Express controllers.
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