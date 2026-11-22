import express from "express";
import { confirmStillAvailable } from "../../controllers/listingExpiryController.js";
import authMiddleware from "../../middleware/authMiddleware.js";
import optionalAuthMiddleware from "../../middleware/optionalAuthMiddleware.js";
import adminMiddleware from "../../middleware/adminMiddleware.js";
import propertyUpload from "../../middleware/propertyUpload.js";

import { createProperty } from "../../controllers/property/propertyController.js";
import { getProperties } from "../../controllers/property/getProperties.js";
import { getPropertyById } from "../../controllers/property/getPropertyById.js";
import { deleteProperty } from "../../controllers/property/deletePropertyController.js";
import { editPropertyStatus } from "../../controllers/property/editPropertyStatusController.js";
import { getAdminListings } from "../../controllers/property/getAdminListings.js";
import { updateProperty } from "../../controllers/property/updatePropertyController.js";
import { getPropertyClickAnalytics, trackPropertyClick } from "../../controllers/property/propertyClickController.js";


import {
    saveProperty,
    unsaveProperty,
    getSavedProperties,
} from "../../controllers/property/savedPropertyController.js";

import { getUserProperties } from "../../controllers/property/getUserProperties.js";

// Property alert controllers
import {
    createPropertyAlert,
    getMyPropertyAlerts,
    archivePropertyAlert,
    restorePropertyAlert,
} from "../../controllers/property/propertyAlertController.js";

const router = express.Router();


// Admin only: lists every publication with the publisher's email.
// (The admin page now uses GET /api/dashboard/publications.)
router.get(
    "/admin-listings",
    authMiddleware,
    adminMiddleware,
    getAdminListings
);

// Admin statistics.
router.get("/clicks", authMiddleware, adminMiddleware, getPropertyClickAnalytics);

router.post("/:id/click", trackPropertyClick);
// Insert a property
router.post(
    "/insert",
    authMiddleware,
    (req, res, next) => {
        console.log("\n[Route] Property insert endpoint reached");
        console.log("[Route] URL:", req.originalUrl);
        console.log("[Route] Authenticated user:", req.user);
        console.log("[Route] Content-Type:", req.headers["content-type"]);
        next();
    },
    propertyUpload.array("images", 15),
    (req, res, next) => {
        console.log("[After Multer] File count:", req.files?.length ?? 0);

        console.log(
            "[After Multer] Files:",
            (req.files || []).map((file) => ({
                fieldname: file.fieldname,
                originalname: file.originalname,
                mimetype: file.mimetype,
                size: file.size,
            }))
        );

        next();
    },
    createProperty
);

// Property routes
router.get("/saved", authMiddleware, getSavedProperties);
router.get("/getlist", getProperties);
router.get("/user-listings", authMiddleware, getUserProperties);
router.delete("/deleteProperty/:id", authMiddleware, deleteProperty);
router.patch("/editstatus/:id", authMiddleware, editPropertyStatus);
router.post("/:id/still-available", authMiddleware, confirmStillAvailable("property"));

// Edit a property (owner or administrator). Same fields as /insert.
router.put(
    "/:id",
    authMiddleware,
    propertyUpload.array("images", 15),
    updateProperty
);
router.post("/save/:propertyId", authMiddleware, saveProperty);
router.delete("/unsave/:propertyId", authMiddleware, unsaveProperty);

// Property alert routes
// Property alert routes.
router.post("/alerts", authMiddleware, createPropertyAlert);
router.get("/alerts", authMiddleware, getMyPropertyAlerts);

// DELETE now archives instead of permanently deleting.
router.delete("/alerts/:id", authMiddleware, archivePropertyAlert);

// Restore an archived alert.
router.patch("/alerts/:id/restore", authMiddleware, restorePropertyAlert);

// Keep this dynamic route after the specific routes
router.get("/:id", optionalAuthMiddleware, getPropertyById);

export default router;