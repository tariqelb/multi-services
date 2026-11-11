

import multer from "multer";
import { randomUUID } from "node:crypto";
import path from "node:path";
import { Readable } from "node:stream";

import cloudinary from "../config/cloudinary.js";

const allowedMimeTypes = [
    "image/jpeg",
    "image/png",
    "image/webp",
];

const allowedExtensions = [
    ".jpg",
    ".jpeg",
    ".png",
    ".webp",
];

const fileFilter = (req, file, cb) => {
    const extension = path.extname(file.originalname).toLowerCase();

    if (
        allowedMimeTypes.includes(file.mimetype) &&
        allowedExtensions.includes(extension)
    ) {
        return cb(null, true);
    }

    cb(new Error("Only JPG, PNG, and WEBP images are allowed."));
};

const propertyUpload = multer({
    storage: multer.memoryStorage(),
    fileFilter,
    limits: {
        files: 15,
        fileSize: 5 * 1024 * 1024,
    },
});

// Upload one image to Cloudinary.
function uploadSingleImage(file) {
    return new Promise((resolve, reject) => {
        const publicId = randomUUID();

        const uploadStream = cloudinary.uploader.upload_stream(
            {
                folder: "multi-services/properties",
                public_id: publicId,
                resource_type: "image",
            },
            (error, result) => {
                if (error) {
                    return reject(error);
                }

                resolve({
                    filename: result.public_id,
                    path: result.secure_url,
                });
            }
        );

        Readable.from(file.buffer).pipe(uploadStream);
    });
}

// Upload all images and clean up successful uploads if any upload fails.
export async function uploadPropertyImages(files = []) {
    const uploadedImages = [];

    try {
        for (const file of files) {
            const image = await uploadSingleImage(file);
            uploadedImages.push(image);
        }

        return uploadedImages;
    } catch (error) {
        await deletePropertyImages(uploadedImages);
        throw error;
    }
}

// Delete Cloudinary images using their public IDs.
export async function deletePropertyImages(images = []) {
    const results = await Promise.allSettled(
        images.map(async (image) => {
            const publicId =
                typeof image === "string"
                    ? image
                    : image?.filename;

            if (!publicId) return;

            const result = await cloudinary.uploader.destroy(publicId, {
                resource_type: "image",
            });

            if (result.result === "error") {
                throw new Error(
                    `Cloudinary could not delete ${publicId}`
                );
            }
        })
    );

    results.forEach((result) => {
        if (result.status === "rejected") {
            console.error(
                "[Cloudinary] Image deletion failed:",
                result.reason?.message
            );
        }
    });
}
// Middleware for roommate listing images.
export const uploadRoommateImages = propertyUpload.array("images", 15);
export default propertyUpload;
