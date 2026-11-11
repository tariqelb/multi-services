

import Property from "../../DatabaseModels/Schema/Property.js";
import User from "../../DatabaseModels/Schema/User.js";
import mongoose from "mongoose";

import {
    uploadPropertyImages,
    deletePropertyImages,
} from "../../middleware/propertyUpload.js";

import notifyMatchingPropertyAlerts from "./propertyAlertNotificationService.js";

// Google Maps domains accepted by the backend.
const isAllowedGoogleMapsHost = (hostname) => {
    return (
        hostname === "maps.app.goo.gl" ||
        hostname === "goo.gl" ||
        hostname === "google.com" ||
        hostname.endsWith(".google.com") ||
        hostname === "google.co.ma" ||
        hostname.endsWith(".google.co.ma")
    );
};

// Extract latitude and longitude from a Google Maps URL.
const parseGoogleMapsCoordinates = (url) => {
    const coordinatePatterns = [
        /@(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)/,
        /!3d(-?\d+(?:\.\d+)?)!4d(-?\d+(?:\.\d+)?)/,
        /\/maps\/(?:search|place)\/(-?\d+(?:\.\d+)?),\s*\+?(-?\d+(?:\.\d+)?)/i,
        /\/maps\/dir\/(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)/i,
    ];

    for (const pattern of coordinatePatterns) {
        const match = url.match(pattern);

        if (match) {
            return {
                lat: Number(match[1]),
                lng: Number(match[2]),
            };
        }
    }

    try {
        const parsedUrl = new URL(url);

        const parameters = [
            "q",
            "query",
            "ll",
            "center",
            "destination",
            "daddr",
        ];

        for (const parameter of parameters) {
            const value = parsedUrl.searchParams.get(parameter);

            if (!value) continue;

            const match = value.match(
                /(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)/
            );

            if (match) {
                return {
                    lat: Number(match[1]),
                    lng: Number(match[2]),
                };
            }
        }
    } catch {
        return null;
    }

    return null;
};

// Resolve a shortened Google Maps URL and extract its coordinates.
const extractGoogleMapsLocation = async (mapLink) => {
    let currentUrl;

    try {
        currentUrl = new URL(mapLink);
    } catch {
        throw new Error("Invalid Google Maps URL.");
    }

    if (
        !["http:", "https:"].includes(currentUrl.protocol) ||
        !isAllowedGoogleMapsHost(currentUrl.hostname)
    ) {
        throw new Error("Please provide a valid Google Maps link.");
    }

    let finalUrl = "";

    // Follow redirects manually and validate every destination.
    for (let attempt = 0; attempt < 10; attempt++) {
        if (!isAllowedGoogleMapsHost(currentUrl.hostname)) {
            throw new Error(
                "The Google Maps link redirected to an invalid domain."
            );
        }

        const response = await fetch(currentUrl.toString(), {
            method: "GET",
            redirect: "manual",
            signal: AbortSignal.timeout(15000),
            headers: {
                "User-Agent":
                    "Mozilla/5.0 (compatible; PropertyLocationResolver/1.0)",
                Accept: "text/html,application/xhtml+xml",
            },
        });

        if ([301, 302, 303, 307, 308].includes(response.status)) {
            const redirectLocation = response.headers.get("location");

            await response.body?.cancel();

            if (!redirectLocation) {
                throw new Error("Google Maps returned an invalid redirect.");
            }

            currentUrl = new URL(redirectLocation, currentUrl);
            continue;
        }

        if (!response.ok) {
            await response.body?.cancel();

            throw new Error(
                `Google Maps could not resolve the link (HTTP ${response.status}).`
            );
        }

        finalUrl = response.url || currentUrl.toString();

        await response.body?.cancel();
        break;
    }

    if (!finalUrl) {
        throw new Error("Too many Google Maps redirects.");
    }

    const coordinates = parseGoogleMapsCoordinates(finalUrl);

    if (!coordinates) {
        throw new Error(
            "Could not extract coordinates from this Google Maps link. Please use a link pointing to a specific location."
        );
    }

    const { lat, lng } = coordinates;

    // Validate Morocco map boundaries.
    if (
        !Number.isFinite(lat) ||
        !Number.isFinite(lng) ||
        lat < 20 ||
        lat > 36 ||
        lng < -18 ||
        lng > -0.5
    ) {
        throw new Error("The selected location must be within Morocco.");
    }

    return { lat, lng };
};

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

        // 3. Retrieve authenticated user's profile.
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
            rentalPeriod,
            furnishingStatus,
            city,
            neighborhood,
            fullAddress,
            mapLink,
            youtubeVideoUrl,
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

        // Contact information comes from authenticated user.
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

        // 7. Validate listing type.
        if (!["For Sale", "For Rent"].includes(listingType)) {
            return res.status(400).json({
                message: "Listing type must be For Sale or For Rent.",
                field: "listingType",
            });
        }

        // 8. Validate rental-specific fields.
        let normalizedRentalPeriod = null;
        let normalizedFurnishingStatus = null;

        if (listingType === "For Rent") {
            normalizedRentalPeriod =
                typeof rentalPeriod === "string"
                    ? rentalPeriod.trim()
                    : "";

            normalizedFurnishingStatus =
                typeof furnishingStatus === "string"
                    ? furnishingStatus.trim()
                    : "";

            if (
                !["Daily", "Monthly"].includes(normalizedRentalPeriod)
            ) {
                return res.status(400).json({
                    message: "Please select a valid rental period.",
                    field: "rentalPeriod",
                });
            }

            if (
                !["Furnished", "Unfurnished"].includes(
                    normalizedFurnishingStatus
                )
            ) {
                return res.status(400).json({
                    message: "Please select a valid furnishing status.",
                    field: "furnishingStatus",
                });
            }
        }

        // For sale listings, rental-specific fields remain null.
        // 9. Validate description.
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

        // 10. Validate numeric fields.
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

        // 11. Parse Boolean fields.
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

        // 12. Validate and extract Google Maps coordinates.
        const normalizedMapLink = mapLink?.trim() || "";

        let location = {
            lat: null,
            lng: null,
        };

        if (normalizedMapLink) {
            try {
                location = await extractGoogleMapsLocation(
                    normalizedMapLink
                );

                console.log(
                    "[CreateProperty] Location extracted:",
                    location
                );
            } catch (error) {
                console.error(
                    "[CreateProperty] Location extraction failed:",
                    error.message
                );

                return res.status(400).json({
                    message: error.message,
                    field: "mapLink",
                });
            }
        }

        // 13. Validate optional YouTube video URL.
        const normalizedYoutubeVideoUrl =
            youtubeVideoUrl?.trim() || "";

        if (normalizedYoutubeVideoUrl) {
            try {
                const url = new URL(normalizedYoutubeVideoUrl);

                const hostname = url.hostname
                    .toLowerCase()
                    .replace(/^www\./, "");

                let videoId = "";

                if (hostname === "youtu.be") {
                    videoId = url.pathname.slice(1).split("/")[0];
                } else if (
                    hostname === "youtube.com" ||
                    hostname === "m.youtube.com" ||
                    hostname === "youtube-nocookie.com"
                ) {
                    if (url.pathname === "/watch") {
                        videoId = url.searchParams.get("v") || "";
                    } else if (
                        url.pathname.startsWith("/embed/") ||
                        url.pathname.startsWith("/shorts/")
                    ) {
                        videoId = url.pathname.split("/")[2] || "";
                    }
                }

                if (!/^[a-zA-Z0-9_-]{11}$/.test(videoId)) {
                    return res.status(400).json({
                        message: "Please provide a valid YouTube video link.",
                        field: "youtubeVideoUrl",
                    });
                }
            } catch {
                return res.status(400).json({
                    message: "Please provide a valid YouTube video link.",
                    field: "youtubeVideoUrl",
                });
            }
        }

        // 14. Upload images.
        uploadedImages = await uploadPropertyImages(uploadedFiles);

        console.log("[CreateProperty] Images uploaded:", {
            count: uploadedImages.length,
        });

        // 15. Create property with extracted location and rental details.
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

            // Rental-specific fields.
            rentalPeriod: normalizedRentalPeriod,
            furnishingStatus: normalizedFurnishingStatus,

            city,
            neighborhood,
            fullAddress,
            mapLink: normalizedMapLink,
            location,
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
            youtubeVideoUrl: normalizedYoutubeVideoUrl,
        });

        console.log("[CreateProperty] Property created:", {
            propertyId: property._id.toString(),
            userId: property.userId.toString(),
            title: property.title,
            contactPhone: property.phone,
            location: property.location,
            rentalPeriod: property.rentalPeriod,
            furnishingStatus: property.furnishingStatus,
        });

        // 16. Notify matching property alerts.
        try {
            const io = req.app.get("io");

            await notifyMatchingPropertyAlerts(property, io);
        } catch (notificationError) {
            console.error(
                "[CreateProperty] Notification error:",
                notificationError
            );
        }

        // 17. Return success.
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
