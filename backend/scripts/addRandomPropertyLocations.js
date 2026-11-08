
import mongoose from "mongoose";
import Property from "../DatabaseModels/Schema/Property.js";
import dotenv from "dotenv";

dotenv.config();

// Morocco approximate geographic boundaries.
const MOROCCO_BOUNDS = {
    minLat: 27.0,
    maxLat: 35.9,
    minLng: -13.2,
    maxLng: -1.0,
};

// Set true to preview without updating MongoDB.
const DRY_RUN = false;

// Generate a random number within a range.
const randomBetween = (min, max) => {
    return Math.random() * (max - min) + min;
};

// Generate random coordinates in Morocco.
const generateRandomLocation = () => {
    return {
        lat: Number(
            randomBetween(
                MOROCCO_BOUNDS.minLat,
                MOROCCO_BOUNDS.maxLat
            ).toFixed(6)
        ),
        lng: Number(
            randomBetween(
                MOROCCO_BOUNDS.minLng,
                MOROCCO_BOUNDS.maxLng
            ).toFixed(6)
        ),
    };
};

const addRandomPropertyLocations = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);

        console.log("Connected to MongoDB.");

        const properties = await Property.find({
            $or: [
                { "location.lat": null },
                { "location.lng": null },
                { location: { $exists: false } },
            ],
        }).select("_id title city location");

        if (!properties.length) {
            console.log("All properties already have coordinates.");
            return;
        }

        console.log(`Found ${properties.length} properties.`);

        for (const property of properties) {
            const location = generateRandomLocation();

            console.log({
                id: property._id.toString(),
                title: property.title,
                city: property.city,
                generatedLocation: location,
            });

            if (!DRY_RUN) {
                await Property.updateOne(
                    { _id: property._id },
                    {
                        $set: {
                            location,
                        },
                    }
                );
            }
        }

        console.log(
            DRY_RUN
                ? "Dry run completed. No database changes made."
                : "All property locations updated successfully."
        );
    } catch (error) {
        console.error("Script error:", error);
        process.exitCode = 1;
    } finally {
        await mongoose.disconnect();
    }
};

addRandomPropertyLocations();
