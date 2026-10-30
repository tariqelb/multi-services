
import "dotenv/config";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import path from "node:path";
import { fileURLToPath } from "node:url";
import multer from "multer";


import routes from "./routes/index.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(
    cors({
        origin: "http://localhost:5173",
        credentials: true,
    })
);

app.use(express.json());
app.use(cookieParser());

// Serve uploaded property images
app.use(
    "/uploads",
    express.static(path.join(__dirname, "uploads"))
);

// Register API routes
app.use("/api", routes);

// Centralized error handler (must come after routes)
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
        return res.status(400).json({
            message: err.message || "Upload failed.",
        });
    }

    next();
});

export default app;