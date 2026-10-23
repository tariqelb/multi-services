import { Server } from "socket.io";
import jwt from "jsonwebtoken";

const initializeSocket = (server) => {
    const io = new Server(server, {
        cors: {
            origin:
                process.env.FRONTEND_URL || "http://localhost:5173",
            credentials: true,
        },
    });

    // Authenticate each socket connection.
    io.use((socket, next) => {
        try {
            const cookieHeader = socket.handshake.headers.cookie || "";

            const tokenCookie = cookieHeader
                .split("; ")
                .find((cookie) => cookie.startsWith("token="));

            const token = tokenCookie
                ? decodeURIComponent(tokenCookie.slice("token=".length))
                : null;

            if (!token) {
                return next(new Error("Authentication required"));
            }

            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            if (!decoded.userId) {
                return next(new Error("Invalid authentication token"));
            }

            socket.data.userId = decoded.userId;

            next();
        } catch {
            next(new Error("Authentication failed"));
        }
    });

    io.on("connection", (socket) => {
        const userId = socket.data.userId;

        // Each authenticated user joins their own private room.
        socket.join(`user:${userId}`);

        console.log(`User ${userId} connected to notifications`);

        socket.on("disconnect", () => {
            console.log(`User ${userId} disconnected`);
        });
    });

    return io;
};

export default initializeSocket;