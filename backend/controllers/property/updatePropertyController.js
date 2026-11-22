// controllers/property/updatePropertyController.js
//
// PUT /api/property/:id   (multipart/form-data, owner or administrator)
//
// Same fields and rules as publishing. Photos:
//   images        new files to add
//   removeImages  JSON array of filenames (or paths) of photos to remove
// Contact details (name, email, phone) are refreshed from the owner's
// profile. Status is changed with PATCH /property/editstatus/:id.

import { confirmedNow } from "../../services/listingExpiry.js";
import mongoose from "mongoose";

import Property from "../../DatabaseModels/Schema/Property.js";
import User from "../../DatabaseModels/Schema/User.js";
import { deletePropertyImages, uploadPropertyImages } from "../../middleware/propertyUpload.js";
import { getUserWhatsApp } from "../../utils/whatsapp.js";
import { resolveFurnishingStatus } from "../../utils/furnishing.js";
import { isPropertyStatusAllowed, statusForListingType } from "../../utils/listingStatus.js";
import { extractGoogleMapsLocation, parseBoolean } from "./propertyController.js";

const MAX_IMAGES = 15;
const ROLES = ["Owner", "Real Estate Agent", "Agency"];
const LISTING_TYPES = ["For Sale", "For Rent"];
const NUMERIC_FIELDS = ["price", "surface", "rooms", "salons", "bathrooms", "floor", "syndicateFees", "deposit", "mediatorFee"];
const TEXT_FIELDS = { title: 200, propertyType: 60, city: 100, neighborhood: 150, fullAddress: 300 };

const badRequest = (message, field) => {
    const error = new Error(message);
    error.status = 400;
    error.field = field;
    return error;
};

export function isValidYoutubeUrl(value) {
    try {
        const url = new URL(value);
        const host = url.hostname.toLowerCase().replace(/^www\./, "");
        let id = "";

        if (host === "youtu.be") {
            id = url.pathname.slice(1).split("/")[0];
        } else if (["youtube.com", "m.youtube.com", "youtube-nocookie.com"].includes(host)) {
            if (url.pathname === "/watch") id = url.searchParams.get("v") || "";
            else if (/^\/(embed|shorts)\//.test(url.pathname)) id = url.pathname.split("/")[2] || "";
        }

        return /^[a-zA-Z0-9_-]{11}$/.test(id);
    } catch {
        return false;
    }
}

function parseRemoveImages(value) {
    if (value === undefined || value === null || value === "") return [];

    let list = value;

    if (typeof value === "string") {
        try {
            list = JSON.parse(value);
        } catch {
            throw badRequest("Invalid image removal data.", "removeImages");
        }
    }

    if (!Array.isArray(list)) throw badRequest("Invalid image removal data.", "removeImages");

    return list.map(String);
}

/**
 * Validate the submitted fields against the current property.
 * Only fields present in the body change; the result is a $set object.
 */
export async function buildPropertyUpdates(body, current, { extractLocation = extractGoogleMapsLocation } = {}) {
    const has = (field) => Object.hasOwn(body, field);
    const updates = {};

    if (has("role")) {
        if (!ROLES.includes(body.role)) throw badRequest("Invalid role.", "role");
        updates.role = body.role;
    }

    for (const [field, max] of Object.entries(TEXT_FIELDS)) {
        if (!has(field)) continue;

        const value = String(body[field] ?? "").trim();

        if (["title", "propertyType", "city"].includes(field) && !value) {
            throw badRequest(`${field} is required.`, field);
        }

        if (value.length > max) throw badRequest(`${field} is too long.`, field);

        updates[field] = value;
    }

    if (has("description")) {
        if (typeof body.description !== "string") throw badRequest("Description must be a string.", "description");
        updates.description = body.description.trim();
    }

    for (const field of NUMERIC_FIELDS) {
        if (!has(field)) continue;

        const raw = body[field];

        if (raw === "" || raw === null || raw === undefined) {
            if (field === "price" || field === "surface") throw badRequest(`${field} is required.`, field);
            updates[field] = 0;
            continue;
        }

        const number = Number(raw);

        if (!Number.isFinite(number) || number < 0) {
            throw badRequest(`${field} must be a valid non-negative number.`, field);
        }

        if (field === "surface" && number <= 0) throw badRequest("Surface must be greater than zero.", "surface");

        updates[field] = number;
    }

    for (const field of ["rentWithContract", "mortgageAgreement", "showEmail"]) {
        if (!has(field)) continue;

        try {
            updates[field] = parseBoolean(body[field], field);
        } catch (error) {
            throw badRequest(error.message, field);
        }
    }

    // Listing type and rental details.
    const listingType = has("listingType") ? body.listingType : current.listingType;

    if (!LISTING_TYPES.includes(listingType)) {
        throw badRequest("Listing type must be For Sale or For Rent.", "listingType");
    }

    if (has("listingType")) updates.listingType = listingType;

    // Sold is for sale, Rented is for rent: switching type resets it.
    if (current.status && !isPropertyStatusAllowed(listingType, current.status)) {
        updates.status = statusForListingType(listingType, current.status);
    }

    if (listingType === "For Rent") {
        const rentalPeriod = String((has("rentalPeriod") ? body.rentalPeriod : current.rentalPeriod) || "").trim();

        if (!["Daily", "Monthly"].includes(rentalPeriod)) {
            throw badRequest("Please select a valid rental period.", "rentalPeriod");
        }

        updates.rentalPeriod = rentalPeriod;
    } else {
        updates.rentalPeriod = null;
    }

    // Furnishing status: homes only (sale or rent), null for other types.
    const propertyType = has("propertyType") ? body.propertyType : current.propertyType;
    const furnishing = resolveFurnishingStatus(
        propertyType,
        has("furnishingStatus") ? body.furnishingStatus : current.furnishingStatus
    );

    if (furnishing.error) throw badRequest(furnishing.error, "furnishingStatus");

    updates.furnishingStatus = furnishing.value;

    // Map link: coordinates are extracted again only when it changed.
    if (has("mapLink")) {
        const mapLink = String(body.mapLink || "").trim();

        if (mapLink !== (current.mapLink || "")) {
            updates.mapLink = mapLink;
            updates.location = mapLink ? await extractLocation(mapLink) : { lat: null, lng: null };
        }
    }

    if (has("youtubeVideoUrl")) {
        const video = String(body.youtubeVideoUrl || "").trim();

        if (video && !isValidYoutubeUrl(video)) {
            throw badRequest("Please provide a valid YouTube video link.", "youtubeVideoUrl");
        }

        updates.youtubeVideoUrl = video;
    }

    return updates;
}

export const updateProperty = async (req, res) => {
    let uploadedImages = [];

    try {
        const { id } = req.params;
        const userId = req.user?.userId;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: "Invalid property ID." });
        }

        const property = await Property.findById(id);

        if (!property) {
            return res.status(404).json({ message: "Property not found." });
        }

        const isOwner = String(property.userId) === String(userId);

        if (!isOwner) {
            const requester = await User.findById(userId).select("role").lean();

            if (requester?.role !== "admin") {
                return res.status(403).json({ message: "You are not allowed to edit this property." });
            }
        }

        let updates;

        try {
            updates = await buildPropertyUpdates(req.body || {}, property);
        } catch (error) {
            return res.status(error.status || 400).json({ message: error.message, field: error.field });
        }

        // Photos.
        const toRemove = new Set(parseRemoveImages(req.body?.removeImages));
        const removedImages = property.images.filter(
            (image) => toRemove.has(image.filename) || toRemove.has(image.path)
        );
        const keptImages = property.images.filter(
            (image) => !toRemove.has(image.filename) && !toRemove.has(image.path)
        );
        const files = req.files || [];

        if (keptImages.length + files.length > MAX_IMAGES) {
            return res.status(400).json({ message: `A maximum of ${MAX_IMAGES} images is allowed.`, field: "images" });
        }

        if (files.length) uploadedImages = await uploadPropertyImages(files);

        // Contact details follow the owner's profile.
        if (isOwner) {
            const owner = await User.findById(userId)
                .select("firstName lastName email phoneNumber phoneVerified whatsappNumber whatsappVerified")
                .lean();

            if (owner) {
                const whatsapp = getUserWhatsApp(owner);

                updates.firstName = owner.firstName || property.firstName;
                updates.lastName = owner.lastName || property.lastName;
                updates.email = owner.email || property.email;
                if (whatsapp.number && whatsapp.verified) updates.phone = whatsapp.number;
            }
        }

        // Editing confirms the listing (60-day expiry starts again).
        Object.assign(property, updates, confirmedNow());
        property.images = [...keptImages, ...uploadedImages];

        await property.save();

        // Delete removed photos only once the database is updated.
        if (removedImages.length) {
            try {
                await deletePropertyImages(removedImages);
            } catch (imageError) {
                console.error("[UpdateProperty] Removed image cleanup error:", imageError);
            }
        }

        return res.status(200).json({
            message: "Property updated successfully.",
            property,
        });
    } catch (error) {
        console.error("[UpdateProperty] Error:", error);

        if (uploadedImages.length) {
            try {
                await deletePropertyImages(uploadedImages);
            } catch (cleanupError) {
                console.error("[UpdateProperty] Image cleanup error:", cleanupError);
            }
        }

        if (error.status === 400 || error.name === "ValidationError" || error.name === "CastError") {
            return res.status(400).json({ message: error.message || "Invalid property data.", field: error.field });
        }

        return res.status(500).json({ message: "Failed to update property." });
    }
};
