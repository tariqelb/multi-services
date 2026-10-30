import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// Resolve __dirname in ES module scope
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from the parent backend/ directory before importing dependencies
dotenv.config({ path: path.resolve(__dirname, "../.env") });

async function migrateUserRoles() {
    try {
        // Dynamically import database and schema after environment variables are loaded
        const { default: connectDB } = await import("../config/db.js");
        const { default: User } = await import("../DatabaseModels/Schema/User.js");

        await connectDB();

        const result = await User.updateMany(
            {
                $or: [
                    { role: { $exists: false } },
                    { role: null },
                    { role: "" },
                ],
            },
            {
                $set: {
                    role: "client",
                },
            }
        );

        console.log("User role migration completed.");
        console.log("Matched:", result.matchedCount);
        console.log("Updated:", result.modifiedCount);
    } catch (error) {
        console.error("User role migration failed:", error);
        process.exitCode = 1;
    } finally {
        process.exit();
    }
}

migrateUserRoles();