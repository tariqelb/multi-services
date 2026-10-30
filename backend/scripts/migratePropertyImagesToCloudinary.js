
import dotenv from "dotenv";
import path from "node:path";
import fs from "node:fs/promises";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({
    path: path.resolve(__dirname, "../.env"),
});

async function migratePropertyImages() {
    let mongoose;

    try {
        const { default: connectDB } = await import("../config/db.js");
        const { default: Property } = await import(
            "../DatabaseModels/Schema/Property.js"
        );
        const { default: cloudinary } = await import(
            "../config/cloudinary.js"
        );

        mongoose = (await import("mongoose")).default;

        await connectDB();

        const properties = await Property.find({
            "images.path": {
                $regex: "^/uploads/properties/",
            },
        });

        console.log(`Found ${properties.length} properties to inspect.`);

        const localImagesDirectory = path.resolve(
            __dirname,
            "../uploads/properties"
        );

        const uploadedCache = new Map();

        let migratedImages = 0;
        let failedImages = 0;
        let failedProperties = 0;

        for (const property of properties) {
            let propertyChanged = false;

            for (const image of property.images) {
                if (!image.path?.startsWith("/uploads/properties/")) {
                    continue;
                }

                const filename = path.basename(image.path);
                const localFilePath = path.join(
                    localImagesDirectory,
                    filename
                );

                try {
                    await fs.access(localFilePath);

                    let cloudinaryImage = uploadedCache.get(filename);

                    if (!cloudinaryImage) {
                        console.log(`Uploading: ${filename}`);

                        const publicId = path.parse(filename).name;

                        const result = await cloudinary.uploader.upload(
                            localFilePath,
                            {
                                folder: "multi-services/properties",
                                public_id: publicId,
                                resource_type: "image",
                                overwrite: true,
                            }
                        );

                        // Convert Cloudinary response to your MongoDB schema.
                        cloudinaryImage = {
                            filename: result.public_id,
                            path: result.secure_url,
                        };

                        uploadedCache.set(filename, cloudinaryImage);
                    }

                    image.filename = cloudinaryImage.filename;
                    image.path = cloudinaryImage.path;

                    propertyChanged = true;
                    migratedImages++;

                    console.log(`Ready to migrate: ${filename}`);
                } catch (error) {
                    failedImages++;

                    console.error(
                        `Failed to migrate ${filename}:`,
                        error.message
                    );
                }
            }

            if (propertyChanged) {
                try {
                    await property.save();

                    console.log(
                        `Updated property: ${property.title} (${property._id})`
                    );
                } catch (error) {
                    failedProperties++;

                    console.error(
                        `Failed to save property ${property._id}:`,
                        error.message
                    );
                }
            }
        }

        console.log("\n========== MIGRATION SUMMARY ==========");
        console.log("Properties inspected:", properties.length);
        console.log("Images migrated:", migratedImages);
        console.log("Image upload failures:", failedImages);
        console.log("Property save failures:", failedProperties);
        console.log("Local images were preserved.");
        console.log("========================================");
    } catch (error) {
        console.error("Property image migration failed:", error);
        process.exitCode = 1;
    } finally {
        if (mongoose?.connection?.readyState) {
            await mongoose.disconnect();
        }
    }
}

migratePropertyImages();
