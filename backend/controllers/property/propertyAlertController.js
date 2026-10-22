
import mongoose from "mongoose";
import PropertyAlert from "../../DatabaseModels/Schema/PropertyAlert.js";

// Create a property alert
export const createPropertyAlert = async (req, res) => {
    try {
        const userId = req.user?.userId;
        const { city, propertyTypes, listingTypes } = req.body;

        if (!userId) {
            return res.status(401).json({
                message: "Authentication required.",
            });
        }

        if (
            typeof city !== "string" ||
            !city.trim()
        ) {
            return res.status(400).json({
                message: "City is required.",
            });
        }

        if (
            !Array.isArray(propertyTypes) ||
            propertyTypes.length === 0
        ) {
            return res.status(400).json({
                message: "Select at least one property type.",
            });
        }

        if (
            !Array.isArray(listingTypes) ||
            listingTypes.length === 0
        ) {
            return res.status(400).json({
                message: "Select For Sale, For Rent, or both.",
            });
        }

        const propertyAlert = await PropertyAlert.create({
            user: userId,
            city: city.trim(),
            propertyTypes,
            listingTypes,
        });

        return res.status(201).json({
            message: "Property alert created successfully.",
            propertyAlert,
        });
    } catch (error) {
        if (error.name === "ValidationError") {
            return res.status(400).json({
                message: error.message,
            });
        }

        console.error("Create property alert error:", error);

        return res.status(500).json({
            message: "Failed to create property alert.",
        });
    }
};

// Get the logged-in user's property alerts
export const getMyPropertyAlerts = async (req, res) => {
    try {
        const userId = req.user?.userId;

        if (!userId) {
            return res.status(401).json({
                message: "Authentication required.",
            });
        }

        const propertyAlerts = await PropertyAlert.find({
            user: userId,
        })
            .sort({ createdAt: -1 })
            .lean();

        return res.status(200).json({
            count: propertyAlerts.length,
            propertyAlerts,
        });
    } catch (error) {
        console.error("Get property alerts error:", error);

        return res.status(500).json({
            message: "Failed to retrieve property alerts.",
        });
    }
};

// Delete a property alert owned by the logged-in user
export const deletePropertyAlert = async (req, res) => {
    try {
        const userId = req.user?.userId;
        const { id } = req.params;

        if (!userId) {
            return res.status(401).json({
                message: "Authentication required.",
            });
        }

        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({
                message: "Invalid property alert ID.",
            });
        }

        const propertyAlert =
            await PropertyAlert.findOneAndDelete({
                _id: id,
                user: userId,
            });

        if (!propertyAlert) {
            return res.status(404).json({
                message: "Property alert not found.",
            });
        }

        return res.status(200).json({
            message: "Property alert deleted successfully.",
            propertyAlertId: id,
        });
    } catch (error) {
        console.error("Delete property alert error:", error);

        return res.status(500).json({
            message: "Failed to delete property alert.",
        });
    }
};
