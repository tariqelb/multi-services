// Runs the 60-day listing expiry once.
//   node scripts/runListingExpiry.js
import "dotenv/config";
import mongoose from "mongoose";

import connectDB from "../config/db.js";
import { runListingExpiry } from "../services/listingExpiry.js";

try {
    await connectDB();
    const summary = await runListingExpiry();
    console.log("Listing expiry done:", JSON.stringify(summary));
} catch (error) {
    console.error("Listing expiry failed:", error);
    process.exitCode = 1;
} finally {
    await mongoose.disconnect();
}