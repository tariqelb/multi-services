
import "dotenv/config";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import path from "node:path";
import { fileURLToPath } from "node:url";
import multer from "multer";

import services from "./apps/index.js";
import { getAllowedOrigins, isOriginAllowed } from "./config/allowedOrigins.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Behind the hosting proxy: use the visitor's real IP (rate limits, logs).
app.set("trust proxy", 1);

// Only our own frontend may call the API with the login cookie.
// Configure FRONTEND_URLS (or FRONTEND_URL) in .env.
const allowedOrigins = getAllowedOrigins();

if (process.env.NODE_ENV === "production" && allowedOrigins.length === 0) {
    console.error(
        "[CORS] FRONTEND_URLS / FRONTEND_URL is not set: every website is allowed. Set it in .env."
    );
}

const corsOptions = {
    origin: (origin, callback) => {
        if (allowedOrigins.length === 0 || isOriginAllowed(origin, allowedOrigins)) {
            return callback(null, true);
        }

        // Not an error page: the browser simply blocks the response.
        return callback(null, false);
    },
    credentials: true,
    methods: [
        "GET",
        "HEAD",
        "POST",
        "PUT",
        "PATCH",
        "DELETE",
        "OPTIONS",
    ],
    allowedHeaders: [
        "Content-Type",
        "Authorization",
        "X-Visitor-Id",
    ],
    optionsSuccessStatus: 204,
};

// Apply CORS before all routes and middleware.
app.use(cors(corsOptions));

// Handle all preflight requests.
app.options(/.*/, cors(corsOptions));

app.disable("x-powered-by");

// Basic security headers (API only returns JSON).
app.use((req, res, next) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "DENY");
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    next();
});

app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ extended: true, limit: "5mb" }));
app.use(cookieParser());

// Serve local images only during development.
if (process.env.NODE_ENV !== "production") {
    app.use(
        "/uploads",
        express.static(path.join(__dirname, "uploads"))
    );
}

// API routes: each service under its own path (/api/property, /api/cars, main at /api).
for (const service of services) {
    app.use(service.basePath, service.router);
}

// Backend health check.
app.get("/", (req, res) => {
    res.status(200).json({
        message: "Multi-services API is running",
    });
});

// Centralized error handler.
app.use((err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        let message = err.message;

        if (err.code === "LIMIT_FILE_SIZE") {
            message = "Each image must be 5 MB or smaller.";
        } else if (
            err.code === "LIMIT_FILE_COUNT" ||
            err.code === "LIMIT_UNEXPECTED_FILE"
        ) {
            message = "Maximum 15 images allowed.";
        }

        return res.status(400).json({ message });
    }

    if (err) {
        console.error("Application error:", err);

        return res.status(400).json({
            message: err.message || "Request failed.",
        });
    }

    next();
});

export default app;
