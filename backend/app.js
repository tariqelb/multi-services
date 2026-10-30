
// import "dotenv/config";
// import express from "express";
// import cors from "cors";
// import cookieParser from "cookie-parser";
// import path from "node:path";
// import { fileURLToPath } from "node:url";
// import multer from "multer";


// import routes from "./routes/index.js";

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

// const app = express();

// const allowedOrigins = [
//     "http://localhost:5173",
//     process.env.FRONTEND_URL,
// ].filter(Boolean);

// app.use(
//     cors({
//         origin: (origin, callback) => {
//             if (!origin || allowedOrigins.includes(origin)) {
//                 return callback(null, true);
//             }

//             return callback(new Error("Not allowed by CORS"));
//         },
//         credentials: true,
//     })
// );

// app.use(express.json());
// app.use(cookieParser());

// // Serve uploaded property images
// app.use(
//     "/uploads",
//     express.static(path.join(__dirname, "uploads"))
// );

// // Register API routes
// app.use("/api", routes);

// // Centralized error handler (must come after routes)
// app.use((err, req, res, next) => {
//     if (err instanceof multer.MulterError) {
//         let message = err.message;

//         if (err.code === "LIMIT_FILE_SIZE") {
//             message = "Each image must be 5 MB or smaller.";
//         } else if (
//             err.code === "LIMIT_FILE_COUNT" ||
//             err.code === "LIMIT_UNEXPECTED_FILE"
//         ) {
//             message = "Maximum 15 images allowed.";
//         }

//         return res.status(400).json({ message });
//     }

//     if (err) {
//         return res.status(400).json({
//             message: err.message || "Upload failed.",
//         });
//     }

//     next();
// });

// export default app;


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

// Allow all origins while supporting credentialed requests.
const corsOptions = {
    origin: (origin, callback) => {
        callback(null, true);
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
    ],
    optionsSuccessStatus: 204,
};

// Apply CORS before all routes and middleware.
app.use(cors(corsOptions));

// Handle all preflight requests.
app.options(/.*/, cors(corsOptions));

app.use(express.json());
app.use(cookieParser());

// Serve local images only during development.
if (process.env.NODE_ENV !== "production") {
    app.use(
        "/uploads",
        express.static(path.join(__dirname, "uploads"))
    );
}

// API routes.
app.use("/api", routes);

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
