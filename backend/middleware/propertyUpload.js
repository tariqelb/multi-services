
import multer from 'multer';
import path from 'node:path';
import fs from 'node:fs';
import { randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uploadDir = path.resolve(
    __dirname,
    '../uploads/properties'
);

fs.mkdirSync(uploadDir, { recursive: true });

const allowedMimeTypes = [
    'image/jpeg',
    'image/png',
    'image/webp',
];

const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp'];

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },

    filename: (req, file, cb) => {
        const extension = path.extname(file.originalname).toLowerCase();

        cb(null, `${randomUUID()}${extension}`);
    },
});

const fileFilter = (req, file, cb) => {
    const extension = path.extname(file.originalname).toLowerCase();

    if (
        allowedMimeTypes.includes(file.mimetype) &&
        allowedExtensions.includes(extension)
    ) {
        return cb(null, true);
    }

    cb(new Error('Only JPG, PNG, and WEBP images are allowed.'));
};

const propertyUpload = multer({
    storage,
    fileFilter,
    limits: {
        files: 15,
        fileSize: 5 * 1024 * 1024,
    },
});

export default propertyUpload;