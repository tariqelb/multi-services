
import { confirmedNow, getExpiryInfo } from "../../services/listingExpiry.js";
import mongoose from "mongoose";
import { extractGoogleMapsLocation } from "../../utils/googleMapsLocation.js";
import RoommateListing from "../../DatabaseModels/Schema/RoommateListing.js";
import User from "../../DatabaseModels/Schema/User.js";
import notifyMatchingRoommateAlerts from "../../services/notifyMatchingRoommateAlerts.js";
import { hideSuspended, isHiddenForRequester, isPublisherSuspended, isRequesterAdmin } from "../../services/accountStatus.js";
import { contactFromOwner, roommateForViewer } from "../../utils/listingStatus.js";

import {
    uploadPropertyImages,
    deletePropertyImages,
} from "../../middleware/propertyUpload.js";
import { getUserWhatsApp } from "../../utils/whatsapp.js";

// -----------------------------------------------------------------------------
// Constants
// -----------------------------------------------------------------------------

const allowedPurposes = [
    "Share My Property",
    "Find a Room",
    "Rent Together",
];

const allowedPropertyTypes = [
    "Apartment",
    "House",
    "Villa",
    "Studio",
    "Room",
    "Other",
];

const allowedRentalPeriods = ["Daily", "Monthly"];

const allowedFurnishingStatuses = [
    "Furnished",
    "Unfurnished",
];

const allowedPropertyConditions = [
    "New",
    "Good",
    "Needs Renovation",
];

const allowedGenderPreferences = [
    "Any",
    "Male",
    "Female",
];

// -----------------------------------------------------------------------------
// Validation helpers
// -----------------------------------------------------------------------------

const createValidationError = (message) => {
    const error = new Error(message);
    error.statusCode = 400;
    return error;
};

const validateEnum = (value, allowedValues, fieldName, required = false) => {
    if (value === undefined || value === null || value === "") {
        if (required) {
            throw createValidationError(`${fieldName} is required.`);
        }

        return null;
    }

    if (!allowedValues.includes(value)) {
        throw createValidationError(`Invalid ${fieldName}.`);
    }

    return value;
};

const parseNumber = (
    value,
    fieldName,
    {
        required = false,
        min = 0,
        integer = false,
        defaultValue = null,
    } = {}
) => {
    if (value === undefined || value === null || value === "") {
        if (required) {
            throw createValidationError(`${fieldName} is required.`);
        }

        return defaultValue;
    }

    const parsed = Number(value);

    if (!Number.isFinite(parsed)) {
        throw createValidationError(`${fieldName} must be a valid number.`);
    }

    if (parsed < min) {
        throw createValidationError(
            `${fieldName} must be greater than or equal to ${min}.`
        );
    }

    if (integer && !Number.isInteger(parsed)) {
        throw createValidationError(`${fieldName} must be an integer.`);
    }

    return parsed;
};

const parseOptionalBoolean = (value, fieldName, defaultValue = null) => {
    if (value === undefined || value === null || value === "") {
        return defaultValue;
    }

    if (typeof value === "boolean") {
        return value;
    }

    if (value === "true" || value === "1") {
        return true;
    }

    if (value === "false" || value === "0") {
        return false;
    }

    throw createValidationError(`${fieldName} must be true or false.`);
};

const validateGoogleMapsLink = (value) => {
    if (!value) return "";

    let parsedUrl;

    try {
        parsedUrl = new URL(value);
    } catch {
        throw createValidationError("Invalid Google Maps link.");
    }

    const allowedHosts = [
        "google.com",
        "www.google.com",
        "maps.google.com",
        "maps.app.goo.gl",
        "goo.gl",
    ];

    const hostname = parsedUrl.hostname.toLowerCase();

    const isAllowedHost = allowedHosts.some(
        (host) => hostname === host || hostname.endsWith(`.${host}`)
    );

    if (
        !isAllowedHost ||
        !["http:", "https:"].includes(parsedUrl.protocol)
    ) {
        throw createValidationError("Please provide a valid Google Maps link.");
    }

    return value.trim();
};

const validateYoutubeVideoUrl = (value) => {
    if (!value) return "";

    let parsedUrl;

    try {
        parsedUrl = new URL(value);
    } catch {
        throw createValidationError("Invalid YouTube video URL.");
    }

    const hostname = parsedUrl.hostname.toLowerCase();

    const allowedHosts = [
        "youtube.com",
        "www.youtube.com",
        "m.youtube.com",
        "youtu.be",
        "www.youtu.be",
    ];

    const isAllowedHost = allowedHosts.some(
        (host) => hostname === host || hostname.endsWith(`.${host}`)
    );

    if (
        !isAllowedHost ||
        !["http:", "https:"].includes(parsedUrl.protocol)
    ) {
        throw createValidationError("Please provide a valid YouTube URL.");
    }

    const videoId =
        hostname.includes("youtu.be")
            ? parsedUrl.pathname.slice(1)
            : parsedUrl.searchParams.get("v");

    if (!videoId && !parsedUrl.pathname.includes("/embed/")) {
        throw createValidationError("Please provide a valid YouTube video URL.");
    }

    return value.trim();
};

const validateAvailableFrom = (value) => {
    if (!value) return null;

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        throw createValidationError("Invalid availability date.");
    }

    return date;
};

const removeUploadedFiles = async (images) => {
    if (!images || images.length === 0) return;

    await deletePropertyImages(images);
};

// -----------------------------------------------------------------------------
// Create roommate listing
// -----------------------------------------------------------------------------

export const createRoommateListing = async (req, res) => {
    let uploadedImages = [];

    try {
        // ---------------------------------------------------------------------
        // 1. Authenticate user
        // ---------------------------------------------------------------------

        const userId = req.user?.userId;

        if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(401).json({
                message: "Authentication required.",
            });
        }

        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({
                message: "User not found.",
            });
        }

        // ---------------------------------------------------------------------
        // 2. Verify email and WhatsApp
        // ---------------------------------------------------------------------

        if (!user.emailVerified) {
            return res.status(403).json({
                message: "Please verify your email before publishing.",
                field: "emailVerified",
            });
        }

        if (!getUserWhatsApp(user).verified) {
            return res.status(403).json({
                message: "Please verify your WhatsApp number before publishing.",
                field: "whatsapp",
            });
        }

        // ---------------------------------------------------------------------
        // 3. Parse roommate preferences
        // ---------------------------------------------------------------------

        const rawPreferences = req.body?.preferences;

        let parsedPreferences = {};

        try {
            if (
                rawPreferences === undefined ||
                rawPreferences === null ||
                rawPreferences === ""
            ) {
                parsedPreferences = {};
            } else if (typeof rawPreferences === "string") {
                parsedPreferences = JSON.parse(rawPreferences);

                // Support accidentally double-encoded JSON.
                if (typeof parsedPreferences === "string") {
                    parsedPreferences = JSON.parse(parsedPreferences);
                }
            } else {
                parsedPreferences = rawPreferences;
            }
        } catch (error) {
            console.error(
                "[CreateRoommateListing] Preferences parsing failed:",
                error.message
            );

            return res.status(400).json({
                message: "Invalid roommate preferences.",
                field: "preferences",
            });
        }

        if (
            !parsedPreferences ||
            typeof parsedPreferences !== "object" ||
            Array.isArray(parsedPreferences)
        ) {
            return res.status(400).json({
                message: "Invalid roommate preferences.",
                field: "preferences",
            });
        }

        // ---------------------------------------------------------------------
        // 4. Read request body
        // ---------------------------------------------------------------------

        const {
            title,
            description,
            purpose,
            propertyType,
            city,
            neighborhood,
            fullAddress,
            mapLink,
            totalRent,
            rentalPeriod,
            furnishingStatus,
            individualRoomPrice,
            rentSplitType,
            deposit,
            syndicateFees,
            otherExpenses,
            surface,
            rooms,
            salons,
            bathrooms,
            floor,
            propertyCondition,
            hasBalcony,
            hasKitchen,
            hasParking,
            totalPeople,
            currentPeople,
            availableFrom,
            youtubeVideoUrl,
        } = req.body;

        // ---------------------------------------------------------------------
        // 5. Basic validation
        // ---------------------------------------------------------------------

        const normalizedTitle =
            typeof title === "string" ? title.trim() : "";

        const normalizedDescription =
            typeof description === "string" ? description.trim() : "";

        const normalizedCity =
            typeof city === "string" ? city.trim() : "";

        if (!normalizedTitle) {
            return res.status(400).json({
                message: "Title is required.",
                field: "title",
            });
        }

        if (normalizedTitle.length > 120) {
            return res.status(400).json({
                message: "Title cannot exceed 120 characters.",
                field: "title",
            });
        }

        if (normalizedDescription.length > 3000) {
            return res.status(400).json({
                message: "Description cannot exceed 3000 characters.",
                field: "description",
            });
        }

        if (!normalizedCity) {
            return res.status(400).json({
                message: "City is required.",
                field: "city",
            });
        }

        // ---------------------------------------------------------------------
        // 6. Validate purpose and property type
        // ---------------------------------------------------------------------

        const normalizedPurpose = validateEnum(
            purpose,
            allowedPurposes,
            "purpose",
            true
        );

        const normalizedPropertyType = validateEnum(
            propertyType,
            allowedPropertyTypes,
            "property type",
            normalizedPurpose !== "Rent Together"
        );

        // ---------------------------------------------------------------------
        // 7. Validate people capacity
        // ---------------------------------------------------------------------

        const normalizedTotalPeople = parseNumber(
            totalPeople,
            "Total people",
            {
                required: true,
                min: 1,
                integer: true,
            }
        );

        const normalizedCurrentPeople = parseNumber(
            currentPeople,
            "Current people",
            {
                required: true,
                min: 0,
                integer: true,
                defaultValue: 0,
            }
        );

        if (normalizedCurrentPeople > normalizedTotalPeople) {
            return res.status(400).json({
                message:
                    "Current people cannot exceed the total number of people.",
                field: "currentPeople",
            });
        }

        if (
            normalizedPurpose === "Share My Property" &&
            normalizedCurrentPeople >= normalizedTotalPeople
        ) {
            return res.status(400).json({
                message: "You must have at least one available place.",
                field: "totalPeople",
            });
        }

        // ---------------------------------------------------------------------
        // 8. Validate rental information
        // ---------------------------------------------------------------------

        const normalizedTotalRent = parseNumber(
            totalRent,
            "Total rent",
            { min: 0 }
        );

        const normalizedRentalPeriod = validateEnum(
            rentalPeriod,
            allowedRentalPeriods,
            "rental period"
        );

        const normalizedFurnishingStatus = validateEnum(
            furnishingStatus,
            allowedFurnishingStatuses,
            "furnishing status"
        );

        const normalizedIndividualRoomPrice = parseNumber(
            individualRoomPrice,
            "Individual room price",
            { min: 0 }
        );

        const normalizedRentSplitType = validateEnum(
            rentSplitType || "Equal",
            ["Equal", "Custom"],
            "rent split type",
            true
        );

        const normalizedDeposit = parseNumber(
            deposit,
            "Deposit",
            { min: 0, defaultValue: 0 }
        );

        const normalizedSyndicateFees = parseNumber(
            syndicateFees,
            "Syndicate fees",
            { min: 0, defaultValue: 0 }
        );

        const normalizedOtherExpenses = parseNumber(
            otherExpenses,
            "Other expenses",
            { min: 0, defaultValue: 0 }
        );

        // ---------------------------------------------------------------------
        // 9. Validate accommodation details
        // ---------------------------------------------------------------------

        const normalizedSurface = parseNumber(
            surface,
            "Surface",
            { min: 0 }
        );

        const normalizedRooms = parseNumber(
            rooms,
            "Rooms",
            { min: 0, integer: true, defaultValue: 0 }
        );

        const normalizedSalons = parseNumber(
            salons,
            "Salons",
            { min: 0, integer: true, defaultValue: 0 }
        );

        const normalizedBathrooms = parseNumber(
            bathrooms,
            "Bathrooms",
            { min: 0, integer: true, defaultValue: 0 }
        );

        const normalizedFloor = parseNumber(
            floor,
            "Floor",
            { min: 0, integer: true }
        );

        const normalizedPropertyCondition = validateEnum(
            propertyCondition,
            allowedPropertyConditions,
            "property condition"
        );

        // ---------------------------------------------------------------------
        // 10. Validate optional property features
        // ---------------------------------------------------------------------

        const normalizedHasBalcony = parseOptionalBoolean(
            hasBalcony,
            "Balcony"
        );

        const normalizedHasKitchen = parseOptionalBoolean(
            hasKitchen,
            "Kitchen"
        );

        const normalizedHasParking = parseOptionalBoolean(
            hasParking,
            "Parking"
        );

        // ---------------------------------------------------------------------
        // 11. Validate roommate preferences
        // ---------------------------------------------------------------------

        const normalizedPreferences = {
            gender: validateEnum(
                parsedPreferences.gender || "Any",
                allowedGenderPreferences,
                "gender preference",
                true
            ),

            smokingAllowed: parseOptionalBoolean(
                parsedPreferences.smokingAllowed,
                "Smoking preference",
                false
            ),

            petsAllowed: parseOptionalBoolean(
                parsedPreferences.petsAllowed,
                "Pets preference",
                false
            ),
        };

        // ---------------------------------------------------------------------
        // 12. Validate dates and links
        // ---------------------------------------------------------------------

        const normalizedAvailableFrom =
            validateAvailableFrom(availableFrom);

        // Validate the Google Maps URL.
        const normalizedMapLink = validateGoogleMapsLink(mapLink);

        // ---------------------------------------------------------------------
        // 13. Extract Google Maps coordinates
        // ---------------------------------------------------------------------

        let location = {
            lat: null,
            lng: null,
        };

        if (normalizedMapLink) {
            try {
                location = await extractGoogleMapsLocation(
                    normalizedMapLink
                );

                if (
                    !location ||
                    !Number.isFinite(location.lat) ||
                    !Number.isFinite(location.lng)
                ) {
                    throw new Error(
                        "Could not extract valid coordinates from the Google Maps link."
                    );
                }
            } catch (error) {
                console.error(
                    "[CreateRoommateListing] Location extraction failed:",
                    error.message
                );

                return res.status(400).json({
                    message:
                        error.message ||
                        "Unable to extract coordinates from Google Maps link.",
                    field: "mapLink",
                });
            }
        }

        const normalizedYoutubeVideoUrl =
            validateYoutubeVideoUrl(youtubeVideoUrl);

        // ---------------------------------------------------------------------
        // 14. Validate and upload listing images
        // ---------------------------------------------------------------------

        const uploadedFiles = req.files || [];

        if (uploadedFiles.length > 15) {
            return res.status(400).json({
                message: "You can upload a maximum of 15 images.",
                field: "images",
            });
        }

        uploadedImages = await uploadPropertyImages(uploadedFiles);

        // ---------------------------------------------------------------------
        // 15. Calculate listing status
        // ---------------------------------------------------------------------

        const initialStatus =
            normalizedCurrentPeople >= normalizedTotalPeople
                ? "Full"
                : "Open";

        // ---------------------------------------------------------------------
        // 16. Create listing and store coordinates
        // ---------------------------------------------------------------------

        const roommateListing = await RoommateListing.create({
            userId,

            title: normalizedTitle,
            description: normalizedDescription,
            purpose: normalizedPurpose,
            propertyType: normalizedPropertyType,

            city: normalizedCity,
            neighborhood:
                typeof neighborhood === "string"
                    ? neighborhood.trim()
                    : "",
            fullAddress:
                typeof fullAddress === "string"
                    ? fullAddress.trim()
                    : "",

            mapLink: normalizedMapLink,

            // Extracted Google Maps coordinates.
            location: {
                lat: location.lat,
                lng: location.lng,
            },

            totalRent: normalizedTotalRent,
            rentalPeriod: normalizedRentalPeriod,
            furnishingStatus: normalizedFurnishingStatus,
            individualRoomPrice: normalizedIndividualRoomPrice,
            rentSplitType: normalizedRentSplitType,

            deposit: normalizedDeposit,
            syndicateFees: normalizedSyndicateFees,
            otherExpenses: normalizedOtherExpenses,

            surface: normalizedSurface,
            rooms: normalizedRooms,
            salons: normalizedSalons,
            bathrooms: normalizedBathrooms,
            floor: normalizedFloor,
            propertyCondition: normalizedPropertyCondition,

            hasBalcony: normalizedHasBalcony,
            hasKitchen: normalizedHasKitchen,
            hasParking: normalizedHasParking,

            totalPeople: normalizedTotalPeople,
            currentPeople: normalizedCurrentPeople,

            availableFrom: normalizedAvailableFrom,

            preferences: normalizedPreferences,

            images: uploadedImages,

            youtubeVideoUrl: normalizedYoutubeVideoUrl,

            status: initialStatus,
        });
        // Notify users who have matching roommate alerts.
        // Notification failures must not cancel successful publication.
        try {
            const io = req.app.get("io");

            const notificationSummary =
                await notifyMatchingRoommateAlerts(
                    roommateListing,
                    io
                );

            console.log(
                "[Roommate Alerts] Notification summary:",
                notificationSummary
            );
        } catch (notificationError) {
            console.error(
                "[Roommate Alerts] Matching failed:",
                notificationError
            );
        }

        // ---------------------------------------------------------------------
        // 17. Calculate derived values
        // ---------------------------------------------------------------------

        const availablePlaces =
            normalizedTotalPeople - normalizedCurrentPeople;

        const rentPerPerson =
            normalizedTotalRent !== null &&
            normalizedTotalPeople > 0 &&
            normalizedRentSplitType === "Equal"
                ? normalizedTotalRent / normalizedTotalPeople
                : null;

        // ---------------------------------------------------------------------
        // 18. Response
        // ---------------------------------------------------------------------

        return res.status(201).json({
            message: "Roommate listing created successfully.",
            roommateListing,
            location: roommateListing.location,
            availablePlaces,
            rentPerPerson,
        });

    } catch (error) {
        console.error("[CreateRoommateListing] Error:", error);

        // Clean up uploaded images if listing creation fails.
        if (uploadedImages.length > 0) {
            try {
                await deletePropertyImages(uploadedImages);
            } catch (cleanupError) {
                console.error(
                    "[CreateRoommateListing] Image cleanup error:",
                    cleanupError
                );
            }
        }

        if (
            error.statusCode === 400 ||
            error.name === "ValidationError" ||
            error.name === "CastError"
        ) {
            return res.status(400).json({
                message: "Invalid roommate listing data.",
                error: error.message,
            });
        }

        return res.status(500).json({
            message: "Failed to create roommate listing.",
        });
    }
};

const escapeRegex = (value = "") =>
    value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const formatRoommateListing = (listing) => {
    const data = listing.toObject ? listing.toObject() : listing;

    const totalPeople = Number(data.totalPeople) || 0;
    const currentPeople = Number(data.currentPeople) || 0;
    const totalRent = Number(data.totalRent) || 0;

    return {
        ...data,
        availablePlaces: Math.max(0, totalPeople - currentPeople),
        rentPerPerson:
            data.rentSplitType === "Equal" && totalPeople > 0 && totalRent > 0
                ? Math.round((totalRent / totalPeople) * 100) / 100
                : null,
    };
};

// GET /api/roommates
export const getRoommateListings = async (req, res) => {
    try {
        const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
        const limit = Math.min(
            30,
            Math.max(1, Number.parseInt(req.query.limit, 10) || 9)
        );

        const {
            search,
            purpose,
            city,
            propertyType,
            rentalPeriod,
            furnishingStatus,
        } = req.query;

        const filter = {
            status: "Open",
        };

        if (req.query.includeFull === "true") {
            filter.status = { $in: ["Open", "Full"] };
        }

        if (purpose && purpose !== "All") {
            if (!allowedPurposes.includes(purpose)) {
                return res.status(400).json({
                    message: "Invalid roommate purpose.",
                });
            }

            filter.purpose = purpose;
        }

        if (propertyType && propertyType !== "All") {
            if (!allowedPropertyTypes.includes(propertyType)) {
                return res.status(400).json({
                    message: "Invalid property type.",
                    received: propertyType,
                    allowed: allowedPropertyTypes,
                });
            }

            filter.propertyType = propertyType;
        }

        if (rentalPeriod && rentalPeriod !== "All") {
            if (!allowedRentalPeriods.includes(rentalPeriod)) {
                return res.status(400).json({
                    message: "Invalid rental period.",
                    received: rentalPeriod,
                    allowed: allowedRentalPeriods,
                });
            }

            filter.rentalPeriod = rentalPeriod;
        }

        if (furnishingStatus && furnishingStatus !== "All") {
            if (!allowedFurnishingStatuses.includes(furnishingStatus)) {
                return res.status(400).json({
                    message: "Invalid furnishing status.",
                    received: furnishingStatus,
                    allowed: allowedFurnishingStatuses,
                });
            }

            filter.furnishingStatus = furnishingStatus;
        }

        if (city?.trim()) {
            filter.city = {
                $regex: escapeRegex(city.trim()),
                $options: "i",
            };
        }

        if (search?.trim()) {
            const searchRegex = {
                $regex: escapeRegex(search.trim()),
                $options: "i",
            };

            filter.$or = [
                { title: searchRegex },
                { description: searchRegex },
                { city: searchRegex },
                { neighborhood: searchRegex },
            ];
        }

        const skip = (page - 1) * limit;

        // Hide announcements of suspended users.
        const visibleFilter = await hideSuspended(filter);

        const [listings, total] = await Promise.all([
            RoommateListing.find(visibleFilter)
                .select("-fullAddress")
                .populate({
                    path: "userId",
                    select: [
                        "firstName",
                        "lastName",
                        "phoneNumber",
                        "whatsappNumber",
                    ].join(" "),
                })
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),

            RoommateListing.countDocuments(visibleFilter),
        ]);

        return res.status(200).json({
            listings: listings.map(formatRoommateListing),
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(total / limit),
                totalListings: total,
                limit,
                hasNextPage: page * limit < total,
                hasPreviousPage: page > 1,
            },
        });
    } catch (error) {
        console.error("[GetRoommateListings] Error:", error);

        return res.status(500).json({
            message: "Failed to retrieve roommate listings.",
        });
    }
};

// GET /api/roommates/:id
export const getRoommateListingById = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                message: "Invalid roommate listing ID.",
            });
        }

        const found = await RoommateListing.findById(id)
            .select("-fullAddress")
            .populate({
                path: "userId",
                select: [
                    "firstName",
                    "lastName",
                    "phoneNumber",
                    "whatsappNumber",
                    "phoneVerified",
                    "whatsappVerified",
                ].join(" "),
            })
            .lean();

        const viewerId = req.user?.userId || req.user?.id || null;
        const isOwner = Boolean(found && viewerId && String(found.userId?._id || found.userId) === String(viewerId));
        const isAdmin = found && !isOwner ? await isRequesterAdmin(req) : false;

        // Visitors: open, full and inactive (inactive without contact).
        // Owner and administrators: any status (needed to edit it).
        const visibleToVisitors = ["Open", "Full", "Inactive"];
        const listing =
            found && (isOwner || isAdmin || visibleToVisitors.includes(found.status)) ? found : null;

        // Publisher suspended: hidden (administrators still see it).
        if (!listing || (await isHiddenForRequester(listing.userId, req))) {
            return res.status(404).json({
                message: "Roommate listing not found.",
            });
        }

        // "Verified" badges: the owner's current numbers, if verified.
        const owner = listing.userId && typeof listing.userId === "object" ? listing.userId : null;
        const { contactVerified } = contactFromOwner(owner);

        const { phoneVerified, whatsappVerified, ...publicOwner } = owner || {};

        return res.status(200).json({
            listing: roommateForViewer(
                {
                    ...formatRoommateListing(listing),
                    userId: owner ? publicOwner : listing.userId,
                    contactVerified: { phone: contactVerified.phone, whatsapp: contactVerified.whatsapp },
                },
                { viewerId, isAdmin }
            ),
        });
    } catch (error) {
        console.error("[GetRoommateListingById] Error:", error);

        return res.status(500).json({
            message: "Failed to retrieve roommate listing.",
        });
    }
};

// GET /api/roommates/my-listings
export const getMyRoommateListings = async (req, res) => {
    try {
        const userId = req.user?.userId;

        if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(401).json({
                message: "Authentication required.",
            });
        }

        const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
        const limit = Math.min(
            30,
            Math.max(1, Number.parseInt(req.query.limit, 10) || 9)
        );

        const filter = { userId };
        const skip = (page - 1) * limit;

        const [listings, total] = await Promise.all([
            RoommateListing.find(filter)
                .select("-fullAddress")
                .populate({
                    path: "userId",
                    select: [
                        "firstName",
                        "lastName",
                        "phoneNumber",
                        "whatsappNumber",
                    ].join(" "),
                })
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),

            RoommateListing.countDocuments(filter),
        ]);

        return res.status(200).json({
            listings: listings.map((listing) => ({
                ...formatRoommateListing(listing),
                expiry: getExpiryInfo("roommate", listing),
            })),
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(total / limit),
                totalListings: total,
                limit,
                hasNextPage: page * limit < total,
                hasPreviousPage: page > 1,
            },
        });
    } catch (error) {
        console.error("[GetMyRoommateListings] Error:", error);

        return res.status(500).json({
            message: "Failed to retrieve your roommate listings.",
        });
    }
};

// GET /api/roommates/user/:userId
export const getUserRoommateListings = async (req, res) => {
    try {
        const { userId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({
                message: "Invalid user ID.",
            });
        }

        const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
        const limit = Math.min(
            30,
            Math.max(1, Number.parseInt(req.query.limit, 10) || 12)
        );

        // Only publicly visible roommate announcements.
        const filter = {
            userId,
            status: { $in: ["Open", "Full"] },
        };

        if (await isPublisherSuspended(userId)) {
            filter._id = { $in: [] }; // suspended publisher: nothing public
        }

        const skip = (page - 1) * limit;

        const [listings, total] = await Promise.all([
            RoommateListing.find(filter)
                .select("-fullAddress")
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),

            RoommateListing.countDocuments(filter),
        ]);

        return res.status(200).json({
            listings: listings.map(formatRoommateListing),
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(total / limit),
                totalListings: total,
                limit,
                hasNextPage: page * limit < total,
                hasPreviousPage: page > 1,
            },
        });
    } catch (error) {
        console.error("[GetUserRoommateListings] Error:", error);

        return res.status(500).json({
            message: "Failed to retrieve this user's roommate announcements.",
        });
    }
};

const editableRoommateFields = [
    "title",
    "description",
    "purpose",
    "propertyType",
    "city",
    "neighborhood",
    "fullAddress",
    "mapLink",
    "totalRent",
    "rentalPeriod",
    "furnishingStatus",
    "individualRoomPrice",
    "rentSplitType",
    "deposit",
    "syndicateFees",
    "otherExpenses",
    "surface",
    "rooms",
    "salons",
    "bathrooms",
    "floor",
    "propertyCondition",
    "totalPeople",
    "currentPeople",
    "availableFrom",
    "youtubeVideoUrl",
    "preferences",
    "hasBalcony",
    "hasKitchen",
    "hasParking",
];

const roommateNumberFields = [
    "totalRent",
    "individualRoomPrice",
    "deposit",
    "syndicateFees",
    "otherExpenses",
    "surface",
    "rooms",
    "salons",
    "bathrooms",
    "floor",
    "totalPeople",
    "currentPeople",
];

const roommateBooleanFields = [
    "hasBalcony",
    "hasKitchen",
    "hasParking",
];

const parseRoommateUpdateBody = (body) => {
    const updates = {};

    for (const field of editableRoommateFields) {
        if (body[field] !== undefined) {
            updates[field] = body[field];
        }
    }

    for (const field of roommateNumberFields) {
        if (updates[field] !== undefined && updates[field] !== "") {
            const value = Number(updates[field]);

            if (!Number.isFinite(value) || value < 0) {
                throw createValidationError(`${field} must be a valid positive number.`);
            }

            updates[field] = value;
        } else if (updates[field] === "") {
            updates[field] = null;
        }
    }

    for (const field of roommateBooleanFields) {
        if (updates[field] !== undefined) {
            updates[field] = parseOptionalBoolean(updates[field]);
        }
    }

    if (updates.preferences !== undefined) {
        let preferences = updates.preferences;

        if (typeof preferences === "string") {
            try {
                preferences = JSON.parse(preferences);
            } catch {
                throw createValidationError("Invalid roommate preferences.");
            }
        }

        if (!preferences || typeof preferences !== "object" || Array.isArray(preferences)) {
            throw createValidationError("Invalid roommate preferences.");
        }

        const allowedGenders = ["Any", "Male", "Female"];

        if (
            preferences.gender !== undefined &&
            !allowedGenders.includes(preferences.gender)
        ) {
            throw createValidationError("Invalid gender preference.");
        }

        updates.preferences = {
            gender: preferences.gender ?? "Any",
            smokingAllowed: parseOptionalBoolean(preferences.smokingAllowed),
            petsAllowed: parseOptionalBoolean(preferences.petsAllowed),
        };
    }

    if (updates.purpose && !allowedPurposes.includes(updates.purpose)) {
        throw createValidationError("Invalid roommate purpose.");
    }

    if (
        updates.propertyType !== undefined &&
        updates.propertyType !== null &&
        !allowedPropertyTypes.includes(updates.propertyType)
    ) {
        throw createValidationError("Invalid property type.");
    }

    if (
        updates.rentalPeriod !== undefined &&
        updates.rentalPeriod !== null &&
        !allowedRentalPeriods.includes(updates.rentalPeriod)
    ) {
        throw createValidationError("Invalid rental period.");
    }

    if (
        updates.furnishingStatus !== undefined &&
        updates.furnishingStatus !== null &&
        !allowedFurnishingStatuses.includes(updates.furnishingStatus)
    ) {
        throw createValidationError("Invalid furnishing status.");
    }

    if (
        updates.propertyCondition !== undefined &&
        updates.propertyCondition !== null &&
        !allowedPropertyConditions.includes(updates.propertyCondition)
    ) {
        throw createValidationError("Invalid property condition.");
    }

    if (
        updates.rentSplitType !== undefined &&
        !["Equal", "Custom"].includes(updates.rentSplitType)
    ) {
        throw createValidationError("Invalid rent split type.");
    }

    if (updates.title !== undefined) {
        updates.title = String(updates.title).trim();

        if (!updates.title || updates.title.length > 120) {
            throw createValidationError("Title is required and must not exceed 120 characters.");
        }
    }

    if (updates.description !== undefined) {
        updates.description = String(updates.description).trim();

        if (updates.description.length > 3000) {
            throw createValidationError("Description must not exceed 3000 characters.");
        }
    }

    if (updates.city !== undefined) {
        updates.city = String(updates.city).trim();

        if (!updates.city) {
            throw createValidationError("City is required.");
        }
    }

    if (updates.neighborhood !== undefined) {
        updates.neighborhood = String(updates.neighborhood).trim();
    }

    if (updates.fullAddress !== undefined) {
        updates.fullAddress = String(updates.fullAddress).trim();
    }

    if (updates.mapLink !== undefined && updates.mapLink) {
        if (!validateGoogleMapsLink(updates.mapLink)) {
            throw createValidationError("Invalid Google Maps link.");
        }
    }

    if (updates.youtubeVideoUrl !== undefined && updates.youtubeVideoUrl) {
        if (!validateYoutubeVideoUrl(updates.youtubeVideoUrl)) {
            throw createValidationError("Invalid YouTube video URL.");
        }
    }

    if (updates.availableFrom !== undefined && updates.availableFrom) {
        const date = new Date(updates.availableFrom);

        if (Number.isNaN(date.getTime())) {
            throw createValidationError("Invalid availability date.");
        }

        updates.availableFrom = date;
    }

    return updates;
};

// PUT /api/roommates/:id
export const updateRoommateListing = async (req, res) => {
    let uploadedImages = [];

    try {
        const userId = req.user?.userId;
        const { id } = req.params;

        if (!userId) {
            return res.status(401).json({
                message: "Authentication required.",
            });
        }

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                message: "Invalid roommate listing ID.",
            });
        }

        const listing = await RoommateListing.findById(id);

        if (!listing) {
            return res.status(404).json({
                message: "Roommate listing not found.",
            });
        }

        // Owner or administrator.
        if (
            listing.userId.toString() !== userId.toString() &&
            !(await isRequesterAdmin(req))
        ) {
            return res.status(403).json({
                message: "You are not allowed to update this announcement.",
            });
        }

        const updates = parseRoommateUpdateBody(req.body || {});

        // Map link changed: read the coordinates again.
        if (updates.mapLink !== undefined && updates.mapLink !== listing.mapLink) {
            if (!updates.mapLink) {
                updates.location = { lat: null, lng: null };
            } else {
                const location = await extractGoogleMapsLocation(updates.mapLink).catch(() => null);

                if (!location || !Number.isFinite(location.lat) || !Number.isFinite(location.lng)) {
                    throw createValidationError(
                        "Could not extract valid coordinates from the Google Maps link."
                    );
                }

                updates.location = { lat: location.lat, lng: location.lng };
            }
        }

        if (updates.totalPeople !== undefined || updates.currentPeople !== undefined) {
            const totalPeople = updates.totalPeople ?? listing.totalPeople;
            const currentPeople = updates.currentPeople ?? listing.currentPeople;

            if (currentPeople > totalPeople) {
                throw createValidationError(
                    "Current people cannot exceed total people."
                );
            }

            if (
                listing.purpose === "Share My Property" &&
                currentPeople >= totalPeople
            ) {
                throw createValidationError(
                    "You must have at least one available place."
                );
            }
        }

        const files = req.files || [];

        if (files.length > 15) {
            throw createValidationError("You can upload a maximum of 15 images.");
        }

        if (files.length > 0) {
            uploadedImages = await uploadPropertyImages(files);
        }

        let imagesToRemove = [];

        if (req.body.removeImages !== undefined) {
            try {
                imagesToRemove =
                    typeof req.body.removeImages === "string"
                        ? JSON.parse(req.body.removeImages)
                        : req.body.removeImages;
            } catch {
                throw createValidationError("Invalid image removal data.");
            }

            if (!Array.isArray(imagesToRemove)) {
                throw createValidationError("Invalid image removal data.");
            }
        }

        // Accept filenames or full paths/URLs.
        const isRemoved = (image) =>
            imagesToRemove.some(
                (value) =>
                    value &&
                    (value === image.filename ||
                        value === image.path ||
                        value === image.url)
            );

        const removedImages = listing.images.filter(isRemoved);
        const remainingImages = listing.images.filter((image) => !isRemoved(image));

        const nextImages = [
            ...remainingImages,
            ...uploadedImages,
        ];

        if (nextImages.length > 15) {
            throw createValidationError("A maximum of 15 images is allowed.");
        }

        // Editing confirms the announcement (60-day expiry starts again).
        Object.assign(listing, updates, confirmedNow());
        listing.images = nextImages;

        const totalPeople = Number(listing.totalPeople) || 0;
        const currentPeople = Number(listing.currentPeople) || 0;

        if (currentPeople >= totalPeople) {
            listing.status = "Full";
        } else if (listing.status === "Full") {
            listing.status = "Open";
        }

        await listing.save();

        // Delete removed image files only after the database update succeeds.
        if (removedImages.length > 0) {
            try {
                await deletePropertyImages(removedImages);
            } catch (imageError) {
                console.error(
                    "[UpdateRoommateListing] Removed image cleanup error:",
                    imageError
                );
            }
        }

        return res.status(200).json({
            message: "Roommate announcement updated successfully.",
            listing: formatRoommateListing(listing),
        });
    } catch (error) {
        console.error("[UpdateRoommateListing] Error:", error);

        if (uploadedImages.length > 0) {
            try {
                await deletePropertyImages(uploadedImages);
            } catch (cleanupError) {
                console.error("[UpdateRoommateListing] Image cleanup error:", cleanupError);
            }
        }

        if (
            error.statusCode === 400 ||
            error.name === "ValidationError" ||
            error.name === "CastError"
        ) {
            return res.status(400).json({
                message: error.message || "Invalid roommate listing data.",
            });
        }

        return res.status(500).json({
            message: "Failed to update roommate announcement.",
        });
    }
};

// DELETE /api/roommates/:id
export const deleteRoommateListing = async (req, res) => {
    try {
        const userId = req.user?.userId;
        const { id } = req.params;

        if (!userId) {
            return res.status(401).json({
                message: "Authentication required.",
            });
        }

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                message: "Invalid roommate listing ID.",
            });
        }

        const listing = await RoommateListing.findById(id);

        if (!listing) {
            return res.status(404).json({
                message: "Roommate listing not found.",
            });
        }

        if (listing.userId.toString() !== userId.toString()) {
            return res.status(403).json({
                message: "You are not allowed to delete this announcement.",
            });
        }

        const listingImages = listing.images || [];

        await RoommateListing.findByIdAndDelete(id);

        if (listingImages.length > 0) {
            try {
                await deletePropertyImages(listingImages);
            } catch (imageError) {
                console.error("[DeleteRoommateListing] Image cleanup error:", imageError);
            }
        }

        return res.status(200).json({
            message: "Roommate announcement deleted successfully.",
            deletedId: id,
        });
    } catch (error) {
        console.error("[DeleteRoommateListing] Error:", error);

        return res.status(500).json({
            message: "Failed to delete roommate announcement.",
        });
    }
};

// PATCH /api/roommates/:id/status
export const updateRoommateListingStatus = async (req, res) => {
    try {
        const userId = req.user?.userId;
        const { id } = req.params;
        const { status } = req.body;

        if (!userId) {
            return res.status(401).json({
                message: "Authentication required.",
            });
        }

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                message: "Invalid roommate listing ID.",
            });
        }

        const allowedStatuses = ["Open", "Full", "Inactive", "Completed"];

        if (!allowedStatuses.includes(status)) {
            return res.status(400).json({
                message: "Status must be Open, Inactive, or Completed.",
            });
        }

        const listing = await RoommateListing.findById(id);

        if (!listing) {
            return res.status(404).json({
                message: "Roommate listing not found.",
            });
        }

        if (listing.userId.toString() !== userId.toString()) {
            return res.status(403).json({
                message: "You are not allowed to change this announcement.",
            });
        }

        if (
            status === "Open" &&
            Number(listing.currentPeople) >= Number(listing.totalPeople)
        ) {
            return res.status(400).json({
                message: "This announcement is full and cannot be reopened.",
            });
        }

        listing.status = status;
        Object.assign(listing, confirmedNow());
        await listing.save();

        return res.status(200).json({
            message: "Roommate announcement status updated successfully.",
            listing: formatRoommateListing(listing),
        });
    } catch (error) {
        console.error("[UpdateRoommateListingStatus] Error:", error);

        return res.status(500).json({
            message: "Failed to update roommate announcement status.",
        });
    }
};
