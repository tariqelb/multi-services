import "dotenv/config";
import mongoose from "mongoose";

import connectDB from "../config/db.js";
import { runAccountDeletionJob } from "../jobs/accountDeletionCron.js";

try {
    await connectDB();
    await runAccountDeletionJob();
} catch (error) {
    console.error("[AccountDeletion] Job failed:", error);
    process.exitCode = 1;
} finally {
    await mongoose.disconnect();
}