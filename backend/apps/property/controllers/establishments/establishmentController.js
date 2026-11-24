
import mongoose from "mongoose";

import Establishment from "../../models/Establishment.js";

import {
    uploadEstablishmentImages,
    deleteEstablishmentImages,
} from "../../middleware/establishmentImageUpload.js";

import {
    extractGoogleMapsLocation,
} from "../../utils/googleMapsLocation.js";
import { hideSuspended, isHiddenForRequester, isPublisherSuspended, isRequesterAdmin } from "../../../main/services/accountStatus.js";

// --------------------------------------------------
// REQUEST HELPERS
// --------------------------------------------------

const getRequestData = (req) => {
    const rawData = req.body?.data;

    if (typeof rawData === "string") {
        try {
            return JSON.parse(rawData);
        } catch {
            throw new Error("Invalid establishment form data.");
        }
    }

    if (rawData && typeof rawData === "object") {
        return rawData;
    }

    return req.body || {};
};


const normalizeFiles = (files) => {
    if (Array.isArray(files)) {
        return files;
    }

    // Supports Multer upload.fields() as well.
    if (files && typeof files === "object") {
        return Object.values(files).flat();
    }

    return [];
};


const getEstablishmentImages = (establishment) => {
    if (!establishment) return [];

    const images = [];

    if (establishment.media?.coverPhoto) {
        images.push(establishment.media.coverPhoto);
    }

    if (Array.isArray(establishment.media?.gallery)) {
        images.push(...establishment.media.gallery);
    }

    if (Array.isArray(establishment.rooms)) {
        establishment.rooms.forEach((room) => {
            if (Array.isArray(room.photos)) {
                images.push(...room.photos);
            }
        });
    }

    return images.filter(Boolean);
};


const imageKey = (image) =>
    typeof image === "string" ? image : image?.filename || image?.path || "";

/**
 * Edit mode: the client sends the saved photos it wants to keep.
 * Only photos that really belong to the establishment are kept
 * (a client can't add paths of its own).
 */
const keepExisting = (oldImages = [], submitted = []) => {
    const wanted = new Set(
        submitted
            .flatMap((image) => [image?.filename, image?.path, typeof image === "string" ? image : null])
            .filter(Boolean)
    );

    return oldImages.filter(
        (image) => image && (wanted.has(image.filename) || wanted.has(image.path))
    );
};

const mergeImages = (...imageGroups) => {
    const result = [];
    const seen = new Set();

    imageGroups
        .flat()
        .filter(Boolean)
        .forEach((image) => {
            const key =
                typeof image === "string"
                    ? image
                    : `${image.filename || ""}:${image.path || ""}`;

            if (!key || seen.has(key)) return;

            seen.add(key);
            result.push(image);
        });

    return result;
};


// --------------------------------------------------
// IMAGE HELPERS
// --------------------------------------------------

const applyUploadedImages = (
    data,
    files,
    uploadedImages,
    existingEstablishment = null
) => {
    const uploadedByField = new Map();

    files.forEach((file, index) => {
        const image = uploadedImages[index];

        if (!image) return;

        if (!uploadedByField.has(file.fieldname)) {
            uploadedByField.set(file.fieldname, []);
        }

        uploadedByField.get(file.fieldname).push(image);
    });

    data.media = data.media || {};

    const oldMedia = existingEstablishment?.media;

    // Cover photo
    const uploadedCover = uploadedByField.get("coverPhoto") || [];

    if (uploadedCover.length > 0) {
        data.media.coverPhoto = uploadedCover[0];
    } else if (existingEstablishment) {
        // Kept only if the client still sends it.
        const keptCover = keepExisting(
            oldMedia?.coverPhoto ? [oldMedia.coverPhoto] : [],
            data.media.coverPhoto ? [data.media.coverPhoto] : []
        );
        data.media.coverPhoto = keptCover[0] || null;
    } else {
        data.media.coverPhoto = null;
    }

    // Gallery: retain old photos and append new uploads.
    const oldGallery = Array.isArray(oldMedia?.gallery)
        ? oldMedia.gallery
        : [];

    const submittedGallery = Array.isArray(data.media.gallery)
        ? data.media.gallery
        : [];

    const uploadedGallery = uploadedByField.get("gallery") || [];

    data.media.gallery = existingEstablishment
        ? mergeImages(keepExisting(oldGallery, submittedGallery), uploadedGallery)
        : mergeImages(submittedGallery, uploadedGallery);

    // Room photos
    if (Array.isArray(data.rooms)) {
        const oldRooms = existingEstablishment?.rooms || [];

        data.rooms = data.rooms.map((room, index) => {
            // Prefer matching by room ID, then fall back to index.
            const oldRoom = room._id
                ? oldRooms.find(
                    (item) => item._id?.toString() === room._id.toString()
                )
                : oldRooms[index];

            const oldPhotos = Array.isArray(oldRoom?.photos)
                ? oldRoom.photos
                : [];

            const submittedPhotos = Array.isArray(room.photos)
                ? room.photos
                : [];

            const uploadedRoomPhotos =
                uploadedByField.get(`roomPhotos_${index}`) || [];

            return {
                ...room,
                photos: existingEstablishment
                    ? mergeImages(keepExisting(oldPhotos, submittedPhotos), uploadedRoomPhotos)
                    : mergeImages(submittedPhotos, uploadedRoomPhotos),
            };
        });
    }

    return data;
};


// --------------------------------------------------
// LOCATION HELPERS
// --------------------------------------------------

const addLocationCoordinates = async (data) => {
    data.location = data.location || {};

    const mapLink = data.location.googleMapsLink?.trim();

    if (!mapLink) {
        data.location.lat = null;
        data.location.lng = null;
        return data;
    }

    const coordinates = await extractGoogleMapsLocation(mapLink);

    if (
        !coordinates ||
        !Number.isFinite(coordinates.lat) ||
        !Number.isFinite(coordinates.lng)
    ) {
        throw new Error(
            "Could not extract coordinates from the Google Maps link."
        );
    }

    data.location.lat = coordinates.lat;
    data.location.lng = coordinates.lng;

    return data;
};


// --------------------------------------------------
// CREATE ESTABLISHMENT
// --------------------------------------------------

export const createEstablishment = async (req, res) => {
    let uploadedImages = [];

    try {
        const userId = req.user?.userId;

        if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(401).json({
                success: false,
                message: "Authentication required.",
            });
        }

        // Parse the JSON object sent in multipart/form-data.
        const data = getRequestData(req);
        const files = normalizeFiles(req.files);

        if (!data || typeof data !== "object" || Array.isArray(data)) {
            return res.status(400).json({
                success: false,
                message: "Invalid establishment data.",
            });
        }

        // Upload images to Cloudinary.
        if (files.length > 0) {
            uploadedImages = await uploadEstablishmentImages(files);
        }

        // Attach uploaded images to the correct fields.
        applyUploadedImages(data, files, uploadedImages);

        // Extract coordinates from the Google Maps link, if provided.
        await addLocationCoordinates(data);

        const establishment = await Establishment.create({
            ...data,
            userId,
        });

        return res.status(201).json({
            success: true,
            message: "Establishment created successfully.",
            establishment,
        });
    } catch (error) {
        if (uploadedImages.length > 0) {
            await deleteEstablishmentImages(uploadedImages);
        }

        console.error("Create establishment error:", error);

        return res.status(400).json({
            success: false,
            message: error.message || "Failed to create establishment.",
        });
    }
};


// --------------------------------------------------
// GET ALL ESTABLISHMENTS (PUBLIC)
// --------------------------------------------------

export const getAllEstablishments = async (req, res) => {
    try {
        const {
            city,
            accommodationType,
            search,
            page = 1,
            limit = 12,
        } = req.query;

        const filter = {};

        if (city) {
            filter["location.city"] = {
                $regex: city,
                $options: "i",
            };
        }

        if (accommodationType) {
            filter.accommodationType = accommodationType;
        }

        if (search) {
            filter.name = {
                $regex: search,
                $options: "i",
            };
        }

        const currentPage = Math.max(1, Number(page) || 1);

        const itemsPerPage = Math.min(
            50,
            Math.max(1, Number(limit) || 12)
        );

        // Hide establishments of suspended users.
        const visibleFilter = await hideSuspended(filter);

        const [establishments, total] = await Promise.all([
            Establishment.find(visibleFilter)
                .sort({ createdAt: -1 })
                .skip((currentPage - 1) * itemsPerPage)
                .limit(itemsPerPage)
                .lean(),

            Establishment.countDocuments(visibleFilter),
        ]);

        return res.status(200).json({
            success: true,
            establishments,
            pagination: {
                total,
                page: currentPage,
                limit: itemsPerPage,
                totalPages: Math.ceil(total / itemsPerPage),
            },
        });
    } catch (error) {
        console.error("Get establishments error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to retrieve establishments.",
        });
    }
};


// --------------------------------------------------
// GET MY ESTABLISHMENTS
// --------------------------------------------------

export const getMyEstablishments = async (req, res) => {
    try {
        const userId = req.user?.userId;

        if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(401).json({
                success: false,
                message: "Authentication required.",
            });
        }

        const establishments = await Establishment.find({ userId })
            .sort({ createdAt: -1 })
            .lean();

        return res.status(200).json({
            success: true,
            establishments,
            total: establishments.length,
        });
    } catch (error) {
        console.error("Get my establishments error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to retrieve your establishments.",
        });
    }
};


// --------------------------------------------------
// GET ESTABLISHMENT BY ID (PUBLIC)
// --------------------------------------------------

export const getEstablishmentById = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid establishment ID.",
            });
        }

        const establishment = await Establishment.findById(id).lean();

        // Publisher suspended: hidden (administrators still see it).
        if (!establishment || (await isHiddenForRequester(establishment.userId, req))) {
            return res.status(404).json({
                success: false,
                message: "Establishment not found.",
            });
        }

        return res.status(200).json({
            success: true,
            establishment,
        });
    } catch (error) {
        console.error("Get establishment error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to retrieve establishment.",
        });
    }
};


// --------------------------------------------------
// UPDATE ESTABLISHMENT (OWNER ONLY)
// --------------------------------------------------

export const updateEstablishment = async (req, res) => {
    let uploadedImages = [];

    try {
        const { id } = req.params;
        const userId = req.user?.userId;

        if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(401).json({
                success: false,
                message: "Authentication required.",
            });
        }

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid establishment ID.",
            });
        }

        const existing = await Establishment.findById(id);

        // Owner or administrator.
        if (
            !existing ||
            (String(existing.userId) !== String(userId) && !(await isRequesterAdmin(req)))
        ) {
            return res.status(404).json({
                success: false,
                message: "Establishment not found or you are not its owner.",
            });
        }

        const imagesBefore = getEstablishmentImages(existing.toObject ? existing.toObject() : existing);

        const data = getRequestData(req);
        const files = normalizeFiles(req.files);

        if (!data || typeof data !== "object" || Array.isArray(data)) {
            return res.status(400).json({
                success: false,
                message: "Invalid establishment data.",
            });
        }

        // Upload only newly selected files.
        if (files.length > 0) {
            uploadedImages = await uploadEstablishmentImages(files);
        }

        // Preserve existing images and append new uploads.
        applyUploadedImages(
            data,
            files,
            uploadedImages,
            existing
        );

        await addLocationCoordinates(data);

        // Prevent clients from changing ownership or internal fields.
        const {
            userId: ignoredUserId,
            _id: ignoredId,
            __v,
            createdAt,
            updatedAt,
            ...updateData
        } = data;

        existing.set(updateData);

        const updatedEstablishment = await existing.save();

        // Delete photos that were removed, after the save succeeded.
        const keptKeys = new Set(getEstablishmentImages(updatedEstablishment).map(imageKey));
        const removedImages = imagesBefore.filter((image) => !keptKeys.has(imageKey(image)));

        if (removedImages.length > 0) {
            try {
                await deleteEstablishmentImages(removedImages);
            } catch (cleanupError) {
                console.error("Removed establishment image cleanup error:", cleanupError);
            }
        }

        // Newly uploaded files are now safely stored in the database.
        return res.status(200).json({
            success: true,
            message: "Establishment updated successfully.",
            establishment: updatedEstablishment,
        });
    } catch (error) {
        // Remove only newly uploaded images if the update fails.
        if (uploadedImages.length > 0) {
            await deleteEstablishmentImages(uploadedImages);
        }

        console.error("Update establishment error:", error);

        return res.status(400).json({
            success: false,
            message: error.message || "Failed to update establishment.",
        });
    }
};


// --------------------------------------------------
// DELETE ESTABLISHMENT (OWNER ONLY)
// --------------------------------------------------

export const deleteEstablishment = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user?.userId;

        if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(401).json({
                success: false,
                message: "Authentication required.",
            });
        }

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid establishment ID.",
            });
        }

        const establishment = await Establishment.findOneAndDelete({
            _id: id,
            userId,
        });

        if (!establishment) {
            return res.status(404).json({
                success: false,
                message: "Establishment not found or you are not its owner.",
            });
        }

        await deleteEstablishmentImages(
            getEstablishmentImages(establishment)
        );

        return res.status(200).json({
            success: true,
            message: "Establishment deleted successfully.",
        });
    } catch (error) {
        console.error("Delete establishment error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to delete establishment.",
        });
    }
};

export const getEstablishmentsByUser = async (req, res) => {
    try {
        const { userId } = req.params;

        // Validate user ID
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid user ID.",
            });
        }

        // Pagination
        const page = Math.max(1, parseInt(req.query.page, 10) || 1);
        const limit = Math.min(
            50,
            Math.max(1, parseInt(req.query.limit, 10) || 12)
        );

        const skip = (page - 1) * limit;

        // Find public establishments belonging to this user
        const filter = {
            userId: new mongoose.Types.ObjectId(userId),
        };

        if (await isPublisherSuspended(userId)) {
            filter._id = { $in: [] }; // suspended publisher: nothing public
        }

        const [establishments, totalEstablishments] = await Promise.all([
            Establishment.find(filter)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),

            Establishment.countDocuments(filter),
        ]);

        const totalPages = Math.ceil(totalEstablishments / limit);

        return res.status(200).json({
            success: true,
            establishments,
            pagination: {
                currentPage: page,
                totalPages,
                totalEstablishments,
                hasNextPage: page < totalPages,
            },
        });
    } catch (error) {
        console.error("Get establishments by user error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to retrieve user establishments.",
            error: error.message,
        });
    }
};