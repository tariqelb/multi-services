import mongoose from "mongoose";
import PropertyAlert from "../../DatabaseModels/Schema/PropertyAlert.js";

// Create a property alert.
export const createPropertyAlert = async (req, res) => {
    try {
        const userId = req.user?.userId;
        const { city, propertyTypes, listingTypes } = req.body;

        if (!userId) {
            return res.status(401).json({
                message: "Authentication required.",
            });
        }

        if (typeof city !== "string" || !city.trim()) {
            return res.status(400).json({
                message: "City is required.",
            });
        }

        if (!Array.isArray(propertyTypes) || propertyTypes.length === 0) {
            return res.status(400).json({
                message: "Select at least one property type.",
            });
        }

        if (!Array.isArray(listingTypes) || listingTypes.length === 0) {
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

// Get the logged-in user's active alerts by default.
// Pass ?includeArchived=true to retrieve archived alerts too.
export const getMyPropertyAlerts = async (req, res) => {
    try {
        const userId = req.user?.userId;

        if (!userId) {
            return res.status(401).json({
                message: "Authentication required.",
            });
        }

        const includeArchived =
            req.query.includeArchived === "true";

        const filter = { user: userId };

        if (!includeArchived) {
           filter.isArchived = { $ne: true };
        }

        const propertyAlerts = await PropertyAlert.find(filter)
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

// Archive an alert instead of permanently deleting it.
// Kept under the existing DELETE route for frontend compatibility.
export const archivePropertyAlert = async (req, res) => {
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

        const propertyAlert = await PropertyAlert.findOneAndUpdate(
            {
                _id: id,
                user: userId,
                isArchived: { $ne: true },
            },
            {
                $set: {
                    isArchived: true,
                    archivedAt: new Date(),
                },
            },
            {
                new: true,
            }
        );

        if (!propertyAlert) {
            return res.status(404).json({
                message: "Active property alert not found.",
            });
        }

        return res.status(200).json({
            message: "Property alert archived successfully.",
            propertyAlert,
        });
    } catch (error) {
        console.error("Archive property alert error:", error);

        return res.status(500).json({
            message: "Failed to archive property alert.",
        });
    }
};

// Restore an archived alert.
export const restorePropertyAlert = async (req, res) => {
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

        const propertyAlert = await PropertyAlert.findOneAndUpdate(
            {
                _id: id,
                user: userId,
                isArchived: true,
            },
            {
                $set: {
                    isArchived: false,
                    archivedAt: null,
                },
            },
            {
                new: true,
            }
        );

        if (!propertyAlert) {
            return res.status(404).json({
                message: "Archived property alert not found.",
            });
        }

        return res.status(200).json({
            message: "Property alert restored successfully.",
            propertyAlert,
        });
    } catch (error) {
        console.error("Restore property alert error:", error);

        return res.status(500).json({
            message: "Failed to restore property alert.",
        });
    }
};

// Backward-compatible export if another file still imports this name.
export const deletePropertyAlert = archivePropertyAlert;