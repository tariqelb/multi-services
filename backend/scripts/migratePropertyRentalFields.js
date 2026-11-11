
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

async function migratePropertyRentalFields() {
    let mongoose;

    try {
        // Import dependencies after loading environment variables
        const { default: connectDB } = await import("../config/db.js");
        const { default: Property } = await import(
            "../DatabaseModels/Schema/Property.js"
        );

        const mongooseModule = await import("mongoose");
        mongoose = mongooseModule.default;

        await connectDB();

        const rentalPeriods = ["Daily", "Monthly"];

        const furnishingStatuses = [
            "Furnished",
            "Unfurnished",
            "Semi-Furnished",
        ];

        function randomValue(values) {
            return values[
                Math.floor(Math.random() * values.length)
            ];
        }

        let totalProperties = 0;
        let updatedProperties = 0;
        let addedFields = 0;

        // Use the native collection to inspect actual stored documents
        const cursor = Property.collection.find({});

        for await (const property of cursor) {
            totalProperties++;

            const fieldsToSet = {};

            // Add missing or empty rentalPeriod
            if (
                property.rentalPeriod === undefined ||
                property.rentalPeriod === null ||
                property.rentalPeriod === ""
            ) {
                fieldsToSet.rentalPeriod = randomValue(rentalPeriods);
            }

            // Add missing or empty furnishingStatus
            if (
                property.furnishingStatus === undefined ||
                property.furnishingStatus === null ||
                property.furnishingStatus === ""
            ) {
                fieldsToSet.furnishingStatus =
                    randomValue(furnishingStatuses);
            }

            const missingFieldsCount = Object.keys(fieldsToSet).length;

            // Update only when missing fields are found
            if (missingFieldsCount > 0) {
                const result = await Property.collection.updateOne(
                    { _id: property._id },
                    {
                        $set: fieldsToSet,
                    }
                );

                if (result.modifiedCount > 0) {
                    updatedProperties++;
                    addedFields += missingFieldsCount;

                    console.log(
                        `Updated property: ${property._id} | Added fields: ${missingFieldsCount} |`,
                        fieldsToSet
                    );
                }
            }
        }

        console.log("\n================================");
        console.log("Property migration completed.");
        console.log("================================");
        console.log("Total properties checked:", totalProperties);
        console.log("Properties updated:", updatedProperties);
        console.log("Fields added:", addedFields);
        console.log("================================\n");
    } catch (error) {
        console.error("Property migration failed:", error);
        process.exitCode = 1;
    } finally {
        if (mongoose) {
            await mongoose.disconnect();
        }
    }
}

migratePropertyRentalFields();
