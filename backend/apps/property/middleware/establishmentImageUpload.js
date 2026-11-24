
import { randomUUID } from "node:crypto";
import { Readable } from "node:stream";

import cloudinary from "../../../config/cloudinary.js";

function uploadSingleImage(file) {
    return new Promise((resolve, reject) => {
        const publicId = randomUUID();

        const uploadStream = cloudinary.uploader.upload_stream(
            {
                folder: "multi-services/establishments",
                public_id: publicId,
                resource_type: "image",
            },
            (error, result) => {
                if (error) return reject(error);

                resolve({
                    filename: result.public_id,
                    path: result.secure_url,
                });
            }
        );

        Readable.from(file.buffer).pipe(uploadStream);
    });
}

export async function uploadEstablishmentImages(files = []) {
    const uploadedImages = [];

    try {
        for (const file of files) {
            const image = await uploadSingleImage(file);
            uploadedImages.push(image);
        }

        return uploadedImages;
    } catch (error) {
        await deleteEstablishmentImages(uploadedImages);
        throw error;
    }
}

export async function deleteEstablishmentImages(images = []) {
    const results = await Promise.allSettled(
        images.map(async (image) => {
            const publicId =
                typeof image === "string"
                    ? image
                    : image?.filename;

            if (!publicId) return;

            await cloudinary.uploader.destroy(publicId, {
                resource_type: "image",
            });
        })
    );

    results.forEach((result) => {
        if (result.status === "rejected") {
            console.error(
                "[Cloudinary] Establishment image deletion failed:",
                result.reason?.message
            );
        }
    });
}
