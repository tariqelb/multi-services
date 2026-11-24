import express from "express";
import { confirmStillAvailable } from "../controllers/listings/listingExpiryController.js";
import authMiddleware from "../../main/middleware/authMiddleware.js";
import optionalAuthMiddleware from "../../main/middleware/optionalAuthMiddleware.js";
import adminAccess from "../../main/middleware/adminAccessMiddleware.js";
import propertyUpload from "../middleware/propertyUpload.js";

import { createProperty } from "../controllers/properties/propertyController.js";
import { getProperties } from "../controllers/properties/getProperties.js";
import { getPropertyById } from "../controllers/properties/getPropertyById.js";
import { deleteProperty } from "../controllers/properties/deletePropertyController.js";
import { editPropertyStatus } from "../controllers/properties/editPropertyStatusController.js";
import { getAdminListings } from "../controllers/properties/getAdminListings.js";
import { updateProperty } from "../controllers/properties/updatePropertyController.js";
import { getPropertyClickAnalytics, trackPropertyClick } from "../controllers/properties/propertyClickController.js";


import {
    saveProperty,
    unsaveProperty,
    getSavedProperties,
} from "../controllers/properties/savedPropertyController.js";

import { getUserProperties } from "../controllers/properties/getUserProperties.js";

// Property alert controllers
import {
    createPropertyAlert,
    getMyPropertyAlerts,
    archivePropertyAlert,
    restorePropertyAlert,
} from "../controllers/properties/propertyAlertController.js";

const router = express.Router();


// Admin only: lists every publication with the publisher's email.
// (The admin page now uses GET /api/property/dashboard/publications.)
router.get(
    "/admin-listings",
    authMiddleware,
    adminAccess("propertyPublications"),
    getAdminListings
);

// Admin statistics.
router.get("/clicks", authMiddleware, adminAccess("propertyStatistics"), getPropertyClickAnalytics);

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