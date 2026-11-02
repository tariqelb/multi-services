
import Property from "../../DatabaseModels/Schema/Property.js";
import User from "../../DatabaseModels/Schema/User.js";
import mongoose from "mongoose";

import {
    uploadPropertyImages,
    deletePropertyImages,
} from "../../middleware/propertyUpload.js";

import notifyMatchingPropertyAlerts from "./propertyAlertNotificationService.js";

// Remove uploaded files if property creation fails.
const removeUploadedFiles = async (images = []) => {
    if (images.length > 0) {
        await deletePropertyImages(images);
    }
};

// Convert multipart form values into Booleans.
const parseBoolean = (value, field) => {
    if (
        value === undefined ||
        value === null ||
        value === ""
    ) {
        return false;
    }

    if (value === true || value === "true") {
        return true;
    }

    if (value === false || value === "false") {
        return false;
    }

    throw new Error(`${field} must be true or false.`);
};

// export const createProperty = async (req, res) => {
//     const uploadedFiles = req.files || [];
//     let uploadedImages = [];

//     try {
//         // 1. Validate authenticated user.
//         const userId = req.user?.userId;

//         if (!userId || !mongoose.isValidObjectId(userId)) {
//             return res.status(401).json({
//                 message: "Authenticated user ID is missing or invalid.",
//             });
//         }

//         // 2. Retrieve authenticated user's profile.
//         // The + explicitly includes fields configured with select: false.
//         const user = await User.findById(userId).select(
//             "+emailVerified +phoneVerified firstName lastName email phoneNumber"
//         );

//         if (!user) {
//             return res.status(404).json({
//                 message: "User profile not found.",
//             });
//         }

//         // 3. Check verification using MongoDB values.
//         const emailVerified = user.emailVerified === true;
//         const phoneVerified = user.phoneVerified === true;

//         console.log("[CreateProperty] User verification:", {
//             userId: user._id,
//             emailVerified,
//             phoneVerified,
//             hasPhoneNumber: Boolean(user.phoneNumber),
//         });

//         if (!emailVerified || !phoneVerified) {
//             const missingVerification = [];

//             if (!emailVerified) {
//                 missingVerification.push("email");
//             }

//             if (!phoneVerified) {
//                 missingVerification.push("phone number");
//             }

//             return res.status(403).json({
//                 message: `Please verify your ${missingVerification.join(
//                     " and "
//                 )} in your profile before publishing a property.`,
//                 emailVerified,
//                 phoneVerified,
//             });
//         }

//         // 4. Retrieve property information from request body.
//         const {
//             role,
//             title,
//             description,
//             listingType,
//             propertyType,
//             city,
//             neighborhood,
//             fullAddress,
//             mapLink,
//             price,
//             surface,
//             rooms,
//             salons,
//             bathrooms,
//             floor,
//             syndicateFees,
//             rentWithContract,
//             mortgageAgreement,
//             deposit,
//             mediatorFee,
//             showEmail,
//         } = req.body;

//         // Contact information always comes from the authenticated user.
//         const firstName = user.firstName;
//         const lastName = user.lastName;
//         const email = user.email;
//         const phone = user.phoneNumber;

//         // 5. Validate required fields.
//         const requiredFields = {
//             firstName,
//             lastName,
//             phone,
//             title,
//             listingType,
//             propertyType,
//             city,
//             price,
//             surface,
//         };

//         const missingFields = Object.entries(requiredFields)
//             .filter(([, value]) =>
//                 value === undefined ||
//                 value === null ||
//                 String(value).trim() === ""
//             )
//             .map(([key]) => key);

//         if (missingFields.length > 0) {
//             return res.status(400).json({
//                 message:
//                     "Please complete your profile and fill in all required property fields.",
//                 missingFields,
//             });
//         }

//         // 6. Validate description.
//         const propertyDescription =
//             typeof description === "string"
//                 ? description.trim()
//                 : "";

//         if (
//             description !== undefined &&
//             typeof description !== "string"
//         ) {
//             return res.status(400).json({
//                 message: "Description must be a string.",
//             });
//         }

//         // 7. Validate numeric fields.
//         const numericFields = {
//             price,
//             surface,
//             rooms,
//             salons,
//             bathrooms,
//             floor,
//             syndicateFees,
//             deposit,
//             mediatorFee,
//         };

//         for (const [field, value] of Object.entries(numericFields)) {
//             if (
//                 value === undefined ||
//                 value === null ||
//                 value === ""
//             ) {
//                 if (["price", "surface"].includes(field)) {
//                     return res.status(400).json({
//                         message: `${field} is required.`,
//                     });
//                 }

//                 numericFields[field] = 0;
//                 continue;
//             }

//             const number = Number(value);

//             if (!Number.isFinite(number) || number < 0) {
//                 return res.status(400).json({
//                     message:
//                         `${field} must be a valid non-negative number.`,
//                 });
//             }

//             numericFields[field] = number;
//         }

//         if (numericFields.surface <= 0) {
//             return res.status(400).json({
//                 message: "Surface must be greater than zero.",
//             });
//         }

//         // 8. Parse Boolean fields.
//         let parsedRentWithContract;
//         let parsedMortgageAgreement;
//         let parsedShowEmail;

//         try {
//             parsedRentWithContract = parseBoolean(
//                 rentWithContract,
//                 "rentWithContract"
//             );

//             parsedMortgageAgreement = parseBoolean(
//                 mortgageAgreement,
//                 "mortgageAgreement"
//             );

//             parsedShowEmail = parseBoolean(
//                 showEmail,
//                 "showEmail"
//             );
//         } catch (error) {
//             return res.status(400).json({
//                 message: error.message,
//             });
//         }

//         // 9. Validate map URL.
//         if (mapLink) {
//             try {
//                 const parsedUrl = new URL(mapLink);

//                 if (
//                     !["http:", "https:"].includes(parsedUrl.protocol)
//                 ) {
//                     throw new Error("Invalid URL protocol");
//                 }
//             } catch {
//                 return res.status(400).json({
//                     message: "Please provide a valid map URL.",
//                 });
//             }
//         }

//         // 10. Upload property images.
//         uploadedImages = await uploadPropertyImages(uploadedFiles);

//         // 11. Create property.
//         const property = await Property.create({
//             userId,

//             role,

//             // Authenticated user's contact information.
//             firstName,
//             lastName,
//             email,
//             phone,

//             // Public email visibility preference.
//             showEmail: parsedShowEmail,

//             title,
//             description: propertyDescription,
//             status: "Available",
//             listingType,
//             propertyType,
//             city,
//             neighborhood,
//             fullAddress,
//             mapLink,

//             price: numericFields.price,
//             surface: numericFields.surface,
//             rooms: numericFields.rooms,
//             salons: numericFields.salons,
//             bathrooms: numericFields.bathrooms,
//             floor: numericFields.floor,
//             syndicateFees: numericFields.syndicateFees,

//             rentWithContract: parsedRentWithContract,
//             mortgageAgreement: parsedMortgageAgreement,
//             deposit: numericFields.deposit,
//             mediatorFee: numericFields.mediatorFee,

//             images: uploadedImages,
//         });

//         // 12. Notify matching property alerts.
//         try {
//             const io = req.app.get("io");

//             await notifyMatchingPropertyAlerts(property, io);
//         } catch (notificationError) {
//             console.error(
//                 "[CreateProperty] Notification error:",
//                 notificationError
//             );
//         }

//         // 13. Return successful response.
//         return res.status(201).json({
//             message: "Property created successfully.",
//             property,
//         });
//     } catch (error) {
//         // Clean uploaded images if creation fails.
//         try {
//             await removeUploadedFiles(uploadedImages);
//         } catch (cleanupError) {
//             console.error(
//                 "[CreateProperty] Image cleanup error:",
//                 cleanupError
//             );
//         }

//         console.error(
//             "[Backend] Create property error:",
//             error
//         );

//         if (
//             error.name === "ValidationError" ||
//             error.name === "CastError"
//         ) {
//             return res.status(400).json({
//                 message: "Invalid property data.",
//                 error: error.message,
//             });
//         }

//         return res.status(500).json({
//             message: "Failed to create property.",
//         });
//     }
// };
export const createProperty = async (req, res) => {
    const uploadedFiles = req.files || [];
    let uploadedImages = [];

    try {
        // 1. Validate authenticated user.
        const userId = req.user?.userId;

        if (!userId || !mongoose.isValidObjectId(userId)) {
            return res.status(401).json({
                message: "Authenticated user ID is missing or invalid.",
            });
        }

        // 2. Check active User model schema.
        console.log("[CreateProperty] Active User model:", {
            database: mongoose.connection.name,
            collection: User.collection.name,
            emailVerified: User.schema.path("emailVerified")?.instance,
            whatsappPhoneNumber: User.schema.path(
                "notificationPreferences.whatsapp.phoneNumber"
            )?.instance,
            whatsappVerified: User.schema.path(
                "notificationPreferences.whatsapp.verified"
            )?.instance,
        });

        // 3. Retrieve authenticated user's profile and WhatsApp information.
        const user = await User.findById(userId).select(
            "firstName lastName email emailVerified notificationPreferences.whatsapp"
        );

        if (!user) {
            console.error("[CreateProperty] User not found:", userId);

            return res.status(404).json({
                message: "User profile not found.",
            });
        }

        const whatsapp = user.notificationPreferences?.whatsapp;

        const whatsappPhoneNumber =
            whatsapp?.phoneNumber?.trim() || "";

        // 4. Check verification.
        const emailVerified = user.emailVerified === true;
        const phoneVerified = whatsapp?.verified === true;

        console.log("[CreateProperty] Retrieved user:", {
            userId: user._id.toString(),
            email: user.email,
            emailVerified,
            whatsappPhoneNumber,
            whatsappVerified: phoneVerified,
        });

        if (!emailVerified || !phoneVerified || !whatsappPhoneNumber) {
            const missingVerification = [];

            if (!emailVerified) {
                missingVerification.push("email");
            }

            if (!phoneVerified || !whatsappPhoneNumber) {
                missingVerification.push("WhatsApp number");
            }

            return res.status(403).json({
                message: `Please verify your ${missingVerification.join(
                    " and "
                )} in your profile before publishing a property.`,
                emailVerified,
                phoneVerified,
                hasPhoneNumber: Boolean(whatsappPhoneNumber),
            });
        }

        console.log(
            "[CreateProperty] Email and WhatsApp verification passed."
        );

        // 5. Retrieve property information.
        const {
            role,
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
            rentWithContract,
            mortgageAgreement,
            deposit,
            mediatorFee,
            showEmail,
        } = req.body;

        // Contact information comes from the authenticated user.
        const firstName = user.firstName;
        const lastName = user.lastName;
        const email = user.email;
        const phone = whatsappPhoneNumber;

        // 6. Validate required fields.
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
            .filter(([, value]) =>
                value === undefined ||
                value === null ||
                String(value).trim() === ""
            )
            .map(([key]) => key);

        if (missingFields.length > 0) {
            return res.status(400).json({
                message:
                    "Please complete your profile and fill in all required property fields.",
                missingFields,
            });
        }

        // 7. Validate description.
        if (
            description !== undefined &&
            typeof description !== "string"
        ) {
            return res.status(400).json({
                message: "Description must be a string.",
            });
        }

        const propertyDescription =
            typeof description === "string"
                ? description.trim()
                : "";

        // 8. Validate numeric fields.
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
            if (
                value === undefined ||
                value === null ||
                value === ""
            ) {
                if (["price", "surface"].includes(field)) {
                    return res.status(400).json({
                        message: `${field} is required.`,
                    });
                }

                numericFields[field] = 0;
                continue;
            }

            const number = Number(value);

            if (!Number.isFinite(number) || number < 0) {
                return res.status(400).json({
                    message:
                        `${field} must be a valid non-negative number.`,
                });
            }

            numericFields[field] = number;
        }

        if (numericFields.surface <= 0) {
            return res.status(400).json({
                message: "Surface must be greater than zero.",
            });
        }

        // 9. Parse Boolean fields.
        let parsedRentWithContract;
        let parsedMortgageAgreement;
        let parsedShowEmail;

        try {
            parsedRentWithContract = parseBoolean(
                rentWithContract,
                "rentWithContract"
            );

            parsedMortgageAgreement = parseBoolean(
                mortgageAgreement,
                "mortgageAgreement"
            );

            parsedShowEmail = parseBoolean(
                showEmail,
                "showEmail"
            );
        } catch (error) {
            return res.status(400).json({
                message: error.message,
            });
        }

        // 10. Validate map URL.
        if (mapLink) {
            try {
                const parsedUrl = new URL(mapLink);

                if (
                    !["http:", "https:"].includes(parsedUrl.protocol)
                ) {
                    throw new Error("Invalid URL protocol");
                }
            } catch {
                return res.status(400).json({
                    message: "Please provide a valid map URL.",
                });
            }
        }

        // 11. Upload images.
        uploadedImages = await uploadPropertyImages(uploadedFiles);

        console.log("[CreateProperty] Images uploaded:", {
            count: uploadedImages.length,
        });

        // 12. Create property using the verified WhatsApp number.
        const property = await Property.create({
            userId,
            role,
            firstName,
            lastName,
            email,
            phone,
            showEmail: parsedShowEmail,
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
            images: uploadedImages,
        });

        console.log("[CreateProperty] Property created:", {
            propertyId: property._id.toString(),
            userId: property.userId.toString(),
            title: property.title,
            contactPhone: property.phone,
        });

        // 13. Notify matching property alerts.
        try {
            const io = req.app.get("io");

            await notifyMatchingPropertyAlerts(property, io);
        } catch (notificationError) {
            console.error(
                "[CreateProperty] Notification error:",
                notificationError
            );
        }

        // 14. Return success.
        return res.status(201).json({
            message: "Property created successfully.",
            property,
        });
    } catch (error) {
        console.error("[CreateProperty] Error:", error);

        // Clean uploaded images if creation fails.
        try {
            await removeUploadedFiles(uploadedImages);
        } catch (cleanupError) {
            console.error(
                "[CreateProperty] Image cleanup error:",
                cleanupError
            );
        }

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