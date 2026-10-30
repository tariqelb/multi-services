import "dotenv/config";
import mongoose from "mongoose";

import connectDB from "../config/db.js";
import { runExternalListingsJob } from "../jobs/externalListingsJob.js";

try {
    await connectDB();
    await runExternalListingsJob();
} catch (error) {
    console.error("[ExternalListings] Job failed:", error);
    process.exitCode = 1;
} finally {
    await mongoose.disconnect();
}