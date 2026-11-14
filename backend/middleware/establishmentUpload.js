
import multer from "multer";
import path from "node:path";

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

const upload = multer({
    storage: multer.memoryStorage(),

    limits: {
        files: 100,
        fileSize: 5 * 1024 * 1024,
    },

    fileFilter: (req, file, callback) => {
        const extension = path.extname(file.originalname).toLowerCase();

        if (
            !allowedMimeTypes.includes(file.mimetype) ||
            !allowedExtensions.includes(extension)
        ) {
            return callback(
                new Error("Only JPG, PNG, and WEBP images are allowed.")
            );
        }

        callback(null, true);
    },
});

export const uploadEstablishmentFiles = (req, res, next) => {
    upload.any()(req, res, (error) => {
        if (error) {
            const message =
                error instanceof multer.MulterError
                    ? error.code === "LIMIT_FILE_SIZE"
                        ? "Each image must be smaller than 5 MB."
                        : error.code === "LIMIT_FILE_COUNT"
                            ? "Too many images uploaded."
                            : "Invalid image upload."
                    : error.message || "Invalid image upload.";

            return res.status(400).json({
                success: false,
                message,
            });
        }

        const files = req.files || [];

        const coverPhotos = files.filter(
            (file) => file.fieldname === "coverPhoto"
        );

        const galleryPhotos = files.filter(
            (file) => file.fieldname === "gallery"
        );

        const roomPhotos = files.filter(
            (file) => /^roomPhotos_\d+$/.test(file.fieldname)
        );

        const invalidFields = files.filter(
            (file) =>
                file.fieldname !== "coverPhoto" &&
                file.fieldname !== "gallery" &&
                !/^roomPhotos_\d+$/.test(file.fieldname)
        );

        if (invalidFields.length) {
            return res.status(400).json({
                success: false,
                message: "Invalid image field.",
            });
        }

        if (coverPhotos.length > 1) {
            return res.status(400).json({
                success: false,
                message: "Only one cover photo is allowed.",
            });
        }

        if (galleryPhotos.length > 30) {
            return res.status(400).json({
                success: false,
                message: "Maximum 30 gallery photos allowed.",
            });
        }

        const roomCounts = {};

        for (const file of roomPhotos) {
            roomCounts[file.fieldname] =
                (roomCounts[file.fieldname] || 0) + 1;

            if (roomCounts[file.fieldname] > 15) {
                return res.status(400).json({
                    success: false,
                    message: "Maximum 15 photos allowed per room type.",
                });
            }
        }

        next();
    });
};
