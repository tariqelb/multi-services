

import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import { getAllowedOrigins } from "./allowedOrigins.js";
import { getAccountStatus } from "../services/accountStatus.js";

const initializeSocket = (server) => {
    const allowedOrigins = getAllowedOrigins();

    const io = new Server(server, {
        cors: {
            origin: allowedOrigins,
            credentials: true,
        },
    });

    // Authenticate each socket connection using the token cookie.
    io.use(async (socket, next) => {
        try {
            const cookieHeader = socket.handshake.headers.cookie || "";

            const tokenCookie = cookieHeader
                .split(";")
                .find((cookie) => cookie.trim().startsWith("token="));

            const token = tokenCookie
                ? decodeURIComponent(
                    tokenCookie.trim().slice("token=".length)
                )
                : null;

            if (!token) {
                return next(new Error("Authentication required"));
            }

            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            if (!decoded.userId) {
                return next(new Error("Invalid authentication token"));
            }

            const account = await getAccountStatus(decoded.userId);

            if (!account.exists || account.status === "suspended") {
                return next(new Error("Account unavailable"));
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