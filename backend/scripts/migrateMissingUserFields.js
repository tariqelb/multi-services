import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// Resolve __dirname in ES module scope
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from backend/
dotenv.config({
    path: path.resolve(__dirname, "../.env"),
});

async function migrateMissingUserFields() {
    let mongoose;

    try {
        // Import dependencies after loading environment variables
        const { default: connectDB } = await import("../config/db.js");
        const { default: User } = await import(
            "../DatabaseModels/Schema/User.js"
        );
        const mongooseModule = await import("mongoose");
        mongoose = mongooseModule.default;

        await connectDB();

        const defaultFields = {
            role: "client",
            accountStatus: "active",
            emailVerified: false,
            phoneVerified: false,
            phoneNumber: "",
            address: "",
            bio: "",
            profileImage: "",
            profileImagePublicId: "",
            language: "en",
        };

        const notificationDefaults = {
            email: {
                enabled: true,
                propertyAlerts: true,
            },
            whatsapp: {
                enabled: false,
                phoneNumber: "",
                propertyAlerts: false,
                verified: false,
            },
        };

        let totalUsers = 0;
        let updatedUsers = 0;
        let addedFields = 0;

        // Use the native collection to inspect actual stored documents
        const cursor = User.collection.find({});

        for await (const user of cursor) {
            totalUsers++;

            const fieldsToSet = {};

            // Add missing top-level fields
            for (const [field, defaultValue] of Object.entries(
                defaultFields
            )) {
                if (user[field] === undefined) {
                    fieldsToSet[field] = defaultValue;
                }
            }

            // Add missing notification preferences
            const preferences = user.notificationPreferences;

            if (!preferences || typeof preferences !== "object") {
                fieldsToSet.notificationPreferences =
                    notificationDefaults;
            } else {
                for (const [section, defaults] of Object.entries(
                    notificationDefaults
                )) {
                    const existingSection = preferences[section];

                    if (
                        !existingSection ||
                        typeof existingSection !== "object"
                    ) {
                        fieldsToSet[
                            `notificationPreferences.${section}`
                        ] = defaults;

                        continue;
                    }

                    for (const [field, defaultValue] of Object.entries(
                        defaults
                    )) {
                        if (existingSection[field] === undefined) {
                            fieldsToSet[
                                `notificationPreferences.${section}.${field}`
                            ] = defaultValue;
                        }
                    }
                }
            }

            // Update only when missing fields are found
            const missingFieldsCount = Object.keys(fieldsToSet).length;

            if (missingFieldsCount > 0) {
                const result = await User.collection.updateOne(
                    { _id: user._id },
                    {
                        $set: fieldsToSet,
                    }
                );

                if (result.modifiedCount > 0) {
                    updatedUsers++;
                    addedFields += missingFieldsCount;

                    console.log(
                        `Updated user: ${user._id} | Added fields: ${missingFieldsCount}`
                    );
                }
            }
        }

        console.log("\n================================");
        console.log("User migration completed.");
        console.log("================================");
        console.log("Total users checked:", totalUsers);
        console.log("Users updated:", updatedUsers);
        console.log("Fields added:", addedFields);
        console.log("================================\n");
    } catch (error) {
        console.error("User migration failed:", error);
        process.exitCode = 1;
    } finally {
        if (mongoose) {
            await mongoose.disconnect();
        }
    }
}

migrateMissingUserFields();