
import mongoose from "mongoose";
import SavedProperty from "../../DatabaseModels/Schema/SavedProperty.js";
import Property from "../../DatabaseModels/Schema/Property.js";

// Save or restore a property
export const saveProperty = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { propertyId } = req.params;

        if (!mongoose.isValidObjectId(propertyId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid property ID",
            });
        }

        const property = await Property.findById(propertyId);

        if (!property) {
            return res.status(404).json({
                success: false,
                message: "Property not found",
            });
        }

        const propertyInfo = {
            title: property.title || "",
            price: property.price || 0,
            listingType: property.listingType || "",
            propertyType: property.propertyType || "",
            city: property.city || "",
            neighborhood: property.neighborhood || "",
            image:
                typeof property.images?.[0] === "string"
                    ? property.images[0]
                    : property.images?.[0]?.path || "",
        };

        const now = new Date();

        const savedProperty = await SavedProperty.findOneAndUpdate(
            { userId, propertyId },
            {
                $set: {
                    propertyInfo,
                    isSaved: true,
                    savedAt: now,
                    unsavedAt: null,
                },
                $setOnInsert: {
                    userId,
                    propertyId,
                },
                $push: {
                    activityHistory: {
                        action: "saved",
                        at: now,
                    },
                },
            },
            {
                new: true,
                upsert: true,
                runValidators: true,
                setDefaultsOnInsert: true,
            }
        );

        return res.status(200).json({
            success: true,
            message: "Property saved successfully",
            savedProperty,
        });
    } catch (error) {
        console.error("Save property error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to save property",
        });
    }
};

// Unsave a property without deleting its history
export const unsaveProperty = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { propertyId } = req.params;

        if (!mongoose.isValidObjectId(propertyId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid property ID",
            });
        }

        const now = new Date();

        const savedProperty = await SavedProperty.findOneAndUpdate(
            {
                userId,
                propertyId,
                isSaved: { $ne: false },
            },
            {
                $set: {
                    isSaved: false,
                    unsavedAt: now,
                },
                $push: {
                    activityHistory: {
                        action: "unsaved",
                        at: now,
                    },
                },
            },
            {
                new: true,
            }
        );

        if (!savedProperty) {
            return res.status(404).json({
                success: false,
                message: "Saved property not found",
            });
        }

        return res.status(200).json({
            success: true,
            message: "Property removed from saved properties",
        });
    } catch (error) {
        console.error("Unsave property error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to unsave property",
        });
    }
};

// Get the current user's saved properties
export const getSavedProperties = async (req, res) => {
    try {
        const userId = req.user.userId;

        const savedProperties = await SavedProperty.find({
            userId,
            isSaved: { $ne: false },
        })
            .sort({ savedAt: -1 })
            .populate(
                "propertyId",
                "title price listingType propertyType city neighborhood images status surface rooms bathrooms createdAt"
            )
            .lean();

        return res.status(200).json({
            success: true,
            count: savedProperties.length,
            savedProperties,
        });
    } catch (error) {
        console.error("Get saved properties error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to retrieve saved properties",
        });
    }
};
