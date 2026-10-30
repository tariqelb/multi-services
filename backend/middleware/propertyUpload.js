
// import multer from 'multer';
// import path from 'node:path';
// import fs from 'node:fs';
// import { randomUUID } from 'node:crypto';
// import { fileURLToPath } from 'node:url';

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

// const uploadDir = path.resolve(
//     __dirname,
//     '../uploads/properties'
// );

// fs.mkdirSync(uploadDir, { recursive: true });

// const allowedMimeTypes = [
//     'image/jpeg',
//     'image/png',
//     'image/webp',
// ];

// const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp'];

// const storage = multer.diskStorage({
//     destination: (req, file, cb) => {
//         cb(null, uploadDir);
//     },

//     filename: (req, file, cb) => {
//         const extension = path.extname(file.originalname).toLowerCase();

//         cb(null, `${randomUUID()}${extension}`);
//     },
// });

// const fileFilter = (req, file, cb) => {
//     const extension = path.extname(file.originalname).toLowerCase();

//     if (
//         allowedMimeTypes.includes(file.mimetype) &&
//         allowedExtensions.includes(extension)
//     ) {
//         return cb(null, true);
//     }

//     cb(new Error('Only JPG, PNG, and WEBP images are allowed.'));
// };

// const propertyUpload = multer({
//     storage,
//     fileFilter,
//     limits: {
//         files: 15,
//         fileSize: 5 * 1024 * 1024,
//     },
// });

// export default propertyUpload;


// import multer from "multer";
// import { randomUUID } from "node:crypto";
// import path from "node:path";
// import cloudinary from "../config/cloudinary.js";
// import { Readable } from "node:stream";

// const allowedMimeTypes = [
//     "image/jpeg",
//     "image/png",
//     "image/webp",
// ];

// const allowedExtensions = [".jpg", ".jpeg", ".png", ".webp"];

// const fileFilter = (req, file, cb) => {
//     const extension = path.extname(file.originalname).toLowerCase();

//     if (
//         allowedMimeTypes.includes(file.mimetype) &&
//         allowedExtensions.includes(extension)
//     ) {
//         return cb(null, true);
//     }

//     cb(new Error("Only JPG, PNG, and WEBP images are allowed."));
// };

// const storage = multer.memoryStorage();

// const propertyUpload = multer({
//     storage,
//     fileFilter,
//     limits: {
//         files: 15,
//         fileSize: 5 * 1024 * 1024,
//     },
// });

// // Upload a buffered image to Cloudinary.
// export function uploadPropertyImages(files = []) {
//     return Promise.all(
//         files.map(
//             (file) =>
//                 new Promise((resolve, reject) => {
//                     const publicId = randomUUID();

//                     const uploadStream = cloudinary.uploader.upload_stream(
//                         {
//                             folder: "multi-services/properties",
//                             public_id: publicId,
//                             resource_type: "image",
//                         },
//                         (error, result) => {
//                             if (error) {
//                                 return reject(error);
//                             }

//                             resolve({
//                                 filename: result.public_id,
//                                 path: result.secure_url,
//                             });
//                         }
//                     );

//                     Readable.from(file.buffer).pipe(uploadStream);
//                 })
//         )
//     );
// }

// // Delete uploaded images from Cloudinary.
// export async function deletePropertyImages(images = []) {
//     await Promise.all(
//         images.map(async (image) => {
//             const publicId =
//                 typeof image === "string"
//                     ? image
//                     : image?.filename;

//             if (!publicId) return;

//             try {
//                 await cloudinary.uploader.destroy(publicId, {
//                     resource_type: "image",
//                 });
//             } catch (error) {
//                 console.error(
//                     "[Cloudinary] Failed to delete image:",
//                     publicId,
//                     error.message
//                 );
//             }
//         })
//     );
// }

// export default propertyUpload;

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

export default propertyUpload;
