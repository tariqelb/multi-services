import Property from "../../DatabaseModels/Schema/Property.js";
import fs from "node:fs/promises";

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

    // Diagnostic logs: inspect what reached the controller.
    console.log("\n========== PROPERTY UPLOAD DEBUG ==========");
    console.log(
        "[Backend] Content-Type:",
        req.headers["content-type"]
    );
    console.log("[Backend] Request body:", req.body);
    console.log("[Backend] Number of uploaded files:", uploadedFiles.length);
    console.log(
        "[Backend] Uploaded files:",
        uploadedFiles.map((file) => ({
            fieldname: file.fieldname,
            originalname: file.originalname,
            mimetype: file.mimetype,
            size: file.size,
            filename: file.filename,
            path: file.path,
        }))
    );
    console.log("===========================================\n");

    try {
        const {
            role,
            firstName,
            lastName,
            email,
            phone,
            title,
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
        } = req.body;

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

        const numericFields = {
            price,
            surface,
            rooms,
            salons,
            bathrooms,
            floor,
            syndicateFees,
        };

        for (const [field, value] of Object.entries(numericFields)) {
            if (value === undefined || value === "") {
                if (["price", "surface"].includes(field)) {
                    await removeUploadedFiles(uploadedFiles);

                    return res.status(400).json({
                        message: `${field} is required.`,
                    });
                }

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

        const images = uploadedFiles.map((file) => ({
            filename: file.filename,
            path: `/uploads/properties/${file.filename}`,
        }));

        console.log("[Backend] Images being saved:", images);

        const property = await Property.create({
            role,
            firstName,
            lastName,
            email,
            phone,
            title,
            listingType,
            propertyType,
            city,
            neighborhood,
            fullAddress,
            mapLink,
            price: numericFields.price,
            surface: numericFields.surface,
            rooms: numericFields.rooms ?? 0,
            salons: numericFields.salons ?? 0,
            bathrooms: numericFields.bathrooms ?? 0,
            floor: numericFields.floor ?? 0,
            syndicateFees: numericFields.syndicateFees ?? 0,
            images,
        });

        console.log("[Backend] Property saved:", property._id);
        console.log("[Backend] Saved image count:", property.images.length);

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