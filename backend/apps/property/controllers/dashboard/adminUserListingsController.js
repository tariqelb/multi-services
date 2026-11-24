// backend/apps/property/controllers/dashboard/adminUserListingsController.js
//
// Admin user page, property tabs: publications, alerts, saved properties, feedback.
// The account itself (details, status) is handled by the main service.

import Property from "../../models/Property.js";
import SavedProperty from "../../models/SavedProperty.js";
import Feedback from "../../models/Feedback.js";
import PropertyAlert from "../../models/PropertyAlert.js";

import { getAdminUserOrRespond } from "../../../main/controllers/admin/adminUsersController.js";

// GET /api/property/dashboard/users/:userId/publications
export const getAdminUserPublications = async (req, res) => {
    try {
        const user = await getAdminUserOrRespond(req.params.userId, res);

        if (!user) return;

        const publications = await Property.find({
            userId: req.params.userId,
        })
            .sort({ createdAt: -1 })
            .lean();

        return res.status(200).json({
            success: true,
            count: publications.length,
            publications,
        });
    } catch (error) {
        console.error("Get admin user publications error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to retrieve user publications.",
        });
    }
};

// GET /api/property/dashboard/users/:userId/alerts
export const getAdminUserAlerts = async (req, res) => {
    try {
        const user = await getAdminUserOrRespond(req.params.userId, res);

        if (!user) return;

        const alerts = await PropertyAlert.find({
            user: req.params.userId,
        })
            .sort({ createdAt: -1 })
            .lean();

        return res.status(200).json({
            success: true,
            count: alerts.length,
            alerts,
        });
    } catch (error) {
        console.error("Get admin user alerts error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to retrieve user alerts.",
        });
    }
};

// GET /api/property/dashboard/users/:userId/saved-properties
export const getAdminUserSavedProperties = async (req, res) => {
    try {
        const user = await getAdminUserOrRespond(req.params.userId, res);

        if (!user) return;

        const savedProperties = await SavedProperty.find({
            userId: req.params.userId,
            isSaved: true,
        })
            .populate({
                path: "propertyId",
                select: "title price listingType propertyType city neighborhood status images",
            })
            .sort({ savedAt: -1 })
            .lean();

        return res.status(200).json({
            success: true,
            count: savedProperties.length,
            savedProperties,
        });
    } catch (error) {
        console.error("Get admin user saved properties error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to retrieve saved properties.",
        });
    }
};

// GET /api/property/dashboard/users/:userId/feedback
export const getAdminUserFeedback = async (req, res) => {
    try {
        const user = await getAdminUserOrRespond(req.params.userId, res);

        if (!user) return;

        const feedback = await Feedback.find({
            userId: req.params.userId,
        })
            .select(
                "email type subject description priority reportedUser pageUrl status attachments createdAt updatedAt"
            )
            .sort({ createdAt: -1 })
            .lean();

        return res.status(200).json({
            success: true,
            count: feedback.length,
            feedback,
        });
    } catch (error) {
        console.error("Get admin user feedback error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to retrieve user feedback.",
        });
    }
};

