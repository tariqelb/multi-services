// backend/apps/main/middleware/imageUpload.js
//
// Image uploads to Cloudinary, shared by every service.
//
//   const carImages = createImageUpload({ folder: "multi-services/cars" });
//   router.post("/", carImages.middleware, handler);      // req.files
//   const images = await carImages.uploadImages(req.files); // [{ filename, path }]
//   await carImages.deleteImages(images);

import multer from "multer";
import { randomUUID } from "node:crypto";
import path from "node:path";
import { Readable } from "node:stream";

import cloudinary from "../../../config/cloudinary.js";

const ALLOWED_TYPES = {
    "image/jpeg": [".jpg", ".jpeg"],
    "image/png": [".png"],
    "image/webp": [".webp"],
};

export function createImageUpload({ folder, field = "images", maxFiles = 15, maxFileSize = 5 * 1024 * 1024 }) {
    const upload = multer({
        storage: multer.memoryStorage(),
        limits: { files: maxFiles, fileSize: maxFileSize },
        fileFilter: (req, file, cb) => {
            const extension = path.extname(file.originalname).toLowerCase();
            if (ALLOWED_TYPES[file.mimetype]?.includes(extension)) return cb(null, true);
            cb(new Error("Only JPG, PNG, and WEBP images are allowed."));
        },
    });

    const uploadOne = (file) =>
        new Promise((resolve, reject) => {
            const stream = cloudinary.uploader.upload_stream(
                { folder, public_id: randomUUID(), resource_type: "image" },
                (error, result) => (error ? reject(error) : resolve({ filename: result.public_id, path: result.secure_url }))
            );
            Readable.from(file.buffer).pipe(stream);
        });

    async function deleteImages(images = []) {
        const results = await Promise.allSettled(
            images.map(async (image) => {
                const publicId = typeof image === "string" ? image : image?.filename;
                if (!publicId) return;
                const result = await cloudinary.uploader.destroy(publicId, { resource_type: "image" });
                if (result.result === "error") throw new Error(`Cloudinary could not delete ${publicId}`);
            })
        );
        results.forEach((result) => {
            if (result.status === "rejected") console.error("[Cloudinary] Image deletion failed:", result.reason?.message);
        });
    }

    /** Upload in order; if one fails, the ones already uploaded are removed. */
    async function uploadImages(files = []) {
        const uploaded = [];
        try {
            for (const file of files) uploaded.push(await uploadOne(file));
            return uploaded;
        } catch (error) {
            await deleteImages(uploaded);
            throw error;
        }
    }

    return { middleware: upload.array(field, maxFiles), uploadImages, deleteImages, maxFiles };
}
