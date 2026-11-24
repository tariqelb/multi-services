
import multer from "multer";

const ALLOWED_TYPES = [
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif",
    "text/plain",
];

const upload = multer({
    storage: multer.memoryStorage(),

    limits: {
        fileSize: 5 * 1024 * 1024,
        files: 5,
    },

    fileFilter: (req, file, callback) => {
        if (!ALLOWED_TYPES.includes(file.mimetype)) {
            return callback(
                new Error("Unsupported attachment file type.")
            );
        }

        callback(null, true);
    },
});

export const uploadFeedbackAttachments = (req, res, next) => {
    upload.array("attachments", 5)(req, res, (error) => {
        if (!error) return next();

        if (error instanceof multer.MulterError) {
            const message =
                error.code === "LIMIT_FILE_SIZE"
                    ? "Each attachment must be smaller than 5 MB."
                    : error.code === "LIMIT_FILE_COUNT"
                      ? "You can attach a maximum of 5 files."
                      : "Invalid attachment upload.";

            return res.status(400).json({
                success: false,
                message,
            });
        }

        return res.status(400).json({
            success: false,
            message: error.message || "Invalid attachment.",
        });
    });
};
