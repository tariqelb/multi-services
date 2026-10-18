import express from "express";
import authMiddleware from "../../middleware/authMiddleware.js";
import propertyUpload from "../../middleware/propertyUpload.js";

import { createProperty } from "../../controllers/property/propertyController.js";
import { getProperties } from "../../controllers/property/getProperties.js";
import { getPropertyById } from "../../controllers/property/getPropertyById.js";
import { deleteProperty } from "../../controllers/property/deletePropertyController.js";
import { editPropertyStatus } from "../../controllers/property/editPropertyStatusController.js";

const router = express.Router();

router.post(
    "/insert",

    // Authenticate the user before uploading files
    authMiddleware,

    // Log before Multer
    (req, res, next) => {
        console.log("\n[Route] Property insert endpoint reached");
        console.log("[Route] URL:", req.originalUrl);
        console.log("[Route] Authenticated user:", req.user);
        console.log("[Route] Content-Type:", req.headers["content-type"]);
        next();
    },

    // Upload images
    propertyUpload.array("images", 15),

    // Log after Multer
    (req, res, next) => {
        console.log("[After Multer] File count:", req.files?.length ?? 0);
        console.log(
            "[After Multer] Files:",
            (req.files || []).map((file) => ({
                fieldname: file.fieldname,
                originalname: file.originalname,
                filename: file.filename,
                size: file.size,
                path: file.path,
            }))
        );
        next();
    },

    createProperty

);

router.get("/getlist", getProperties);
router.get("/:id", getPropertyById);
router.delete("/deleteProperty/:id", authMiddleware, deleteProperty);
router.patch("/editstatus/:id", authMiddleware, editPropertyStatus);


export default router;
