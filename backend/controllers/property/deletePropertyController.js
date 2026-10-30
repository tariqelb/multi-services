// import Property from "../../DatabaseModels/Schema/Property.js";
// import fs from "node:fs/promises";
// import path from "node:path";

// export const deleteProperty = async (req, res) => {
//     try {
//         const propertyId = req.params.id;

//         const property = await Property.findById(propertyId);

//         if (!property) {
//             return res.status(404).json({ message: "Property not found." });
//         }

//         // Optional: Delete associated image files from disk
//         if (property.images && Array.isArray(property.images)) {
//             for (const img of property.images) {
//                 try {
//                     // Adjust path according to your uploads folder structure
//                     const filePath = path.join(process.cwd(), img.path);
//                     await fs.unlink(filePath);
//                 } catch (err) {
//                     console.error("Failed to delete file from disk:", err.message);
//                 }
//             }
//         }

//         await Property.findByIdAndDelete(propertyId);

//         return res.status(200).json({
//             message: "Property deleted successfully.",
//             id: propertyId,
//         });
//     } catch (error) {
//         console.error("[Backend] Delete property error:", error);
//         return res.status(500).json({
//             message: "Failed to delete property.",
//             error: error.message,
//         });
//     }
// };


import Property from "../../DatabaseModels/Schema/Property.js";
import { deletePropertyImages } from "../../middleware/propertyUpload.js";

export const deleteProperty = async (req, res) => {
    try {
        const propertyId = req.params.id;

        if (!propertyId) {
            return res.status(400).json({
                message: "Property ID is required.",
            });
        }

        const property = await Property.findById(propertyId);

        if (!property) {
            return res.status(404).json({
                message: "Property not found.",
            });
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
