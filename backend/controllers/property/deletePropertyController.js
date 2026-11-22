import mongoose from "mongoose";

import Property from "../../DatabaseModels/Schema/Property.js";
import User from "../../DatabaseModels/Schema/User.js";
import { deletePropertyImages } from "../../middleware/propertyUpload.js";

// DELETE /api/property/deleteProperty/:id
// Only the owner of the property or an administrator can delete it.
export const deleteProperty = async (req, res) => {
    try {
        const propertyId = req.params.id;
        const userId = req.user?.userId;

        if (!userId) {
            return res.status(401).json({
                message: "Authentication required.",
            });
        }

        if (!propertyId || !mongoose.Types.ObjectId.isValid(propertyId)) {
            return res.status(400).json({
                message: "A valid property ID is required.",
            });
        }

        const property = await Property.findById(propertyId);

        if (!property) {
            return res.status(404).json({
                message: "Property not found.",
            });
        }

        const isOwner = String(property.userId) === String(userId);

        if (!isOwner) {
            const user = await User.findById(userId).select("role").lean();

            if (user?.role !== "admin") {
                return res.status(403).json({
                    message: "You are not allowed to delete this property.",
                });
            }
        }

        // Remove the property from MongoDB first.
        await Property.findByIdAndDelete(propertyId);

        // Then remove its images from Cloudinary.
        await deletePropertyImages(property.images || []);

        return res.status(200).json({
            message: "Property deleted successfully.",
            id: propertyId,
        });
    } catch (error) {
        console.error("[Backend] Delete property error:", error);

        return res.status(500).json({
            message: "Failed to delete property.",
            error: error.message,
        });
    }
};
