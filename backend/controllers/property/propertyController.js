import Property from "../../DatabaseModels/Schema/Property.js";
import mongoose from "mongoose";
import fs from "node:fs/promises";
import notifyMatchingPropertyAlerts from "./propertyAlertNotificationService.js";

const removeUploadedFiles = async (files = []) => {
    await Promise.all(
        files.map(async (file) => {
            try {
                await fs.unlink(file.path);
            } catch (error) {
                if (error.code !== "ENOENT") {
                    console.error(
                        "[Backend] Failed to remove uploaded file:",
                        file.path,
                        error.message
                    );
                }
            }
        })
    );
};


export const createProperty = async (req, res) => {
    const uploadedFiles = req.files || [];

    try {
        const userId = req.user?.userId;

console.log("\n========== CREATE PROPERTY DEBUG ==========");
console.log("[CreateProperty] Controller entered");
console.log("[CreateProperty] User ID:", req.user?.userId);
console.log("[CreateProperty] Uploaded files:", uploadedFiles.length);
console.log("[CreateProperty] Request body:", req.body);

        if (!userId || !mongoose.isValidObjectId(userId)) {
            await removeUploadedFiles(uploadedFiles);

            return res.status(401).json({
                message: "Authenticated user ID is missing or invalid.",
            });
        }

        const {
            role,
            firstName,
            lastName,
            email,
            phone,
            title,
            description,
            listingType,
            propertyType,
            city,
            neighborhood,
            fullAddress,
            mapLink,
            price,
            surface,
            rooms,
            salons,
            bathrooms,
            floor,
            syndicateFees,

            // New fields
            rentWithContract,
            mortgageAgreement,
            deposit,
            mediatorFee,
        } = req.body;

        // Validate required fields.
        const requiredFields = {
            firstName,
            lastName,
            phone,
            title,
            listingType,
            propertyType,
            city,
            price,
            surface,
        };

        const missingFields = Object.entries(requiredFields)
            .filter(
                ([, value]) =>
                    value === undefined ||
                    value === null ||
                    String(value).trim() === ""
            )
            .map(([key]) => key);

        if (missingFields.length > 0) {
            await removeUploadedFiles(uploadedFiles);

            return res.status(400).json({
                message: "Please fill in all required fields.",
                missingFields,
            });
        }

        // Validate description.
        const propertyDescription =
            typeof description === "string"
                ? description.trim()
                : "";

        if (
            description !== undefined &&
            typeof description !== "string"
        ) {
            await removeUploadedFiles(uploadedFiles);

            return res.status(400).json({
                message: "Description must be a string.",
            });
        }

        // Validate numeric fields.
        const numericFields = {
            price,
            surface,
            rooms,
            salons,
            bathrooms,
            floor,
            syndicateFees,
            deposit,
            mediatorFee,
        };

        for (const [field, value] of Object.entries(numericFields)) {
            if (value === undefined || value === "") {
                if (["price", "surface"].includes(field)) {
                    await removeUploadedFiles(uploadedFiles);

                    return res.status(400).json({
                        message: `${field} is required.`,
                    });
                }

                numericFields[field] = 0;
                continue;
            }

            const number = Number(value);

            if (!Number.isFinite(number) || number < 0) {
                await removeUploadedFiles(uploadedFiles);

                return res.status(400).json({
                    message: `${field} must be a valid non-negative number.`,
                });
            }

            numericFields[field] = number;
        }

        if (numericFields.surface <= 0) {
            await removeUploadedFiles(uploadedFiles);

            return res.status(400).json({
                message: "Surface must be greater than zero.",
            });
        }

        // Validate boolean fields.
        const parseBoolean = (value, field) => {
            if (
                value === undefined ||
                value === null ||
                value === ""
            ) {
                return false;
            }

            if (value === true || value === "true") return true;
            if (value === false || value === "false") return false;

            throw new Error(`${field} must be true or false.`);
        };

        let parsedRentWithContract;
        let parsedMortgageAgreement;

        try {
            parsedRentWithContract = parseBoolean(
                rentWithContract,
                "rentWithContract"
            );

            parsedMortgageAgreement = parseBoolean(
                mortgageAgreement,
                "mortgageAgreement"
            );
        } catch (error) {
            await removeUploadedFiles(uploadedFiles);

            return res.status(400).json({
                message: error.message,
            });
        }

        // Validate map URL.
        if (mapLink) {
            try {
                const parsedUrl = new URL(mapLink);

                if (!["http:", "https:"].includes(parsedUrl.protocol)) {
                    throw new Error("Invalid URL protocol");
                }
            } catch {
                await removeUploadedFiles(uploadedFiles);

                return res.status(400).json({
                    message: "Please provide a valid map URL.",
                });
            }
        }

        // Prepare uploaded images.
        const images = uploadedFiles.map((file) => ({
            filename: file.filename,
            path: `/uploads/properties/${file.filename}`,
        }));

        // Create property.
        console.log("[CreateProperty] Validation passed");
        console.log("[CreateProperty] Preparing to save property...");
        // Create property.
        const property = await Property.create({
            userId,
            role,
            firstName,
            lastName,
            email,
            phone,
            title,
            description: propertyDescription,
            status: "Available",
            listingType,
            propertyType,
            city,
            neighborhood,
            fullAddress,
            mapLink,

            price: numericFields.price,
            surface: numericFields.surface,
            rooms: numericFields.rooms,
            salons: numericFields.salons,
            bathrooms: numericFields.bathrooms,
            floor: numericFields.floor,
            syndicateFees: numericFields.syndicateFees,

            rentWithContract: parsedRentWithContract,
            mortgageAgreement: parsedMortgageAgreement,
            deposit: numericFields.deposit,
            mediatorFee: numericFields.mediatorFee,

            images,
        });
console.log("[CreateProperty] Property saved successfully");
console.log("[CreateProperty] Property ID:", String(property._id));
console.log("[CreateProperty] Property city:", property.city);
console.log("[CreateProperty] Property type:", property.propertyType);
console.log("[CreateProperty] Listing type:", property.listingType);
console.log("[CreateProperty] Publisher ID:", String(property.userId));
        // Notify matching users without failing property creation
        // if the notification process encounters an error.
        try {
            const io = req.app.get("io");

            const notificationResult =
                await notifyMatchingPropertyAlerts(property, io);

            console.log(
                "Property alert notifications:",
                notificationResult
            );
        } catch (notificationError) {
            console.error(
                "Property created, but alert notifications failed:",
                notificationError
            );
        }

        return res.status(201).json({
            message: "Property created successfully.",
            property,
        });
    } catch (error) {
        await removeUploadedFiles(uploadedFiles);

        console.error("[Backend] Create property error:", error);

        if (
            error.name === "ValidationError" ||
            error.name === "CastError"
        ) {
            return res.status(400).json({
                message: "Invalid property data.",
                error: error.message,
            });
        }

        return res.status(500).json({
            message: "Failed to create property.",
        });
    }
};
