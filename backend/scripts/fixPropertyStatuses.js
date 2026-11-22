// Fix statuses that do not match the listing type (one time).
//   npm run fix:property-status            -> report only
//   npm run fix:property-status -- --apply -> fix
//
// "For Sale" + "Rented" -> "Sold"     (the property is no longer available)
// "For Rent" + "Sold"   -> "Rented"
import "dotenv/config";
import mongoose from "mongoose";

import connectDB from "../config/db.js";
import Property from "../DatabaseModels/Schema/Property.js";

const apply = process.argv.includes("--apply");

const fixes = [
    { filter: { listingType: "For Sale", status: "Rented" }, status: "Sold" },
    { filter: { listingType: "For Rent", status: "Sold" }, status: "Rented" },
];

try {
    await connectDB();

    for (const { filter, status } of fixes) {
        const count = await Property.countDocuments(filter);
        const label = `${filter.listingType} marked ${filter.status}`;

        if (!apply) {
            console.log(`${label}: ${count} (would become ${status})`);
            continue;
        }

        const result = await Property.updateMany(filter, { $set: { status } });
        console.log(`${label}: ${result.modifiedCount} changed to ${status}`);
    }

    if (!apply) console.log("Report only. Run with --apply to fix.");
} catch (error) {
    console.error("Status fix failed:", error);
    process.exitCode = 1;
} finally {
    await mongoose.disconnect();
}
