
import mongoose from "mongoose";
import SavedProperty from "../../DatabaseModels/Schema/SavedProperty.js";
import Property from "../../DatabaseModels/Schema/Property.js";

// Save a property
export const saveProperty = async (req, res) => {
    try {

        const userId = req.user.userId;
        const { propertyId } = req.params;
        console.log("user get saved prop : ", userId, propertyId)
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

        // Return the existing save if it already exists.
        const savedProperty = await SavedProperty.findOneAndUpdate(
            { userId, propertyId },
            {
                $setOnInsert: {
                    userId,
                    propertyId,
                    propertyInfo,
                },
            },
            {
                new: true,
                upsert: true,
                runValidators: true,
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

// Unsave a property
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

        const deletedProperty = await SavedProperty.findOneAndDelete({
            userId,
            propertyId,
        });

        if (!deletedProperty) {
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

        console.log ("saved property called");
        const savedProperties = await SavedProperty.find({ userId })
            .sort({ createdAt: -1 })
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
