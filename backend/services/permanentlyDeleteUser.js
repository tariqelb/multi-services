
// import fs from "node:fs/promises";
// import path from "node:path";

// import User from "../DatabaseModels/Schema/User.js";
// import Property from "../DatabaseModels/Schema/Property.js";
// import SavedProperty from "../DatabaseModels/Schema/SavedProperty.js";
// import PropertyAlert from "../DatabaseModels/Schema/PropertyAlert.js";
// import Notification from "../DatabaseModels/Schema/Notification.js";

// const UPLOADS_ROOT = path.resolve("uploads");

// /**
//  * Remove a local uploaded file only if it is inside the uploads directory.
//  */
// async function removeUploadedFile(imagePath) {
//     if (!imagePath || typeof imagePath !== "string") {
//         return;
//     }

//     // External URLs are not local files.
//     if (/^https?:\/\//i.test(imagePath)) {
//         return;
//     }

//     const relativePath = imagePath
//         .replace(/\\/g, "/")
//         .replace(/^\/+/, "");

//     if (!relativePath.startsWith("uploads/")) {
//         return;
//     }

//     const absolutePath = path.resolve(relativePath);
//     const relativeToRoot = path.relative(
//         UPLOADS_ROOT,
//         absolutePath
//     );

//     // Prevent path traversal outside uploads/.
//     if (
//         relativeToRoot.startsWith("..") ||
//         path.isAbsolute(relativeToRoot)
//     ) {
//         return;
//     }

//     try {
//         await fs.unlink(absolutePath);
//     } catch (error) {
//         if (error.code !== "ENOENT") {
//             throw error;
//         }
//     }
// }

// /**
//  * Permanently delete an expired account and associated data.
//  */
// export async function permanentlyDeleteUser(userId) {
//     const user = await User.findById(userId);

//     if (!user) {
//         return;
//     }

//     // Never delete an account without an expired deletion request.
//     if (
//         !user.scheduledDeletionAt ||
//         new Date(user.scheduledDeletionAt) > new Date()
//     ) {
//         return;
//     }

//     // Find all properties published by this user.
//     const properties = await Property.find({
//         userId,
//     }).select("_id images");

//     const propertyIds = properties.map(
//         (property) => property._id
//     );

//     // Remove saved references to this user's properties for all users.
//     if (propertyIds.length > 0) {
//         await SavedProperty.deleteMany({
//             propertyId: { $in: propertyIds },
//         });
//     }

//     // Remove saved properties belonging to the deleting user.
//     await SavedProperty.deleteMany({ userId });

//     // Delete property images.
//     for (const property of properties) {
//         for (const image of property.images || []) {
//             const imagePath =
//                 typeof image === "string"
//                     ? image
//                     : image?.path;

//             await removeUploadedFile(imagePath);
//         }
//     }

//     // Delete the user's published properties.
//     await Property.deleteMany({ userId });

//     // Delete property alerts created by this user.
//     await PropertyAlert.deleteMany({
//         user: userId,
//     });

//     // Delete notifications received by this user.
//     await Notification.deleteMany({
//         userId,
//     });

//     // Delete the user last.
//     await User.deleteOne({ _id: userId });
// }

import User from "../DatabaseModels/Schema/User.js";
import Property from "../DatabaseModels/Schema/Property.js";
import SavedProperty from "../DatabaseModels/Schema/SavedProperty.js";
import PropertyAlert from "../DatabaseModels/Schema/PropertyAlert.js";
import Notification from "../DatabaseModels/Schema/Notification.js";

import { deletePropertyImages } from "../middleware/propertyUpload.js";

/**
 * Permanently delete an expired account and its associated data.
 */
export async function permanentlyDeleteUser(userId) {
    const user = await User.findById(userId);

    if (!user) {
        return;
    }

    // Never delete an account without an expired deletion request.
    if (
        !user.scheduledDeletionAt ||
        new Date(user.scheduledDeletionAt) > new Date()
    ) {
        return;
    }

    // Find all properties published by this user.
    const properties = await Property.find({
        userId,
    }).select("_id images");

    const propertyIds = properties.map(
        (property) => property._id
    );

    // Remove saved references to this user's properties for all users.
    if (propertyIds.length > 0) {
        await SavedProperty.deleteMany({
            propertyId: { $in: propertyIds },
        });
    }

    // Remove saved properties belonging to the deleting user.
    await SavedProperty.deleteMany({ userId });

    // Delete property images from Cloudinary.
    for (const property of properties) {
        await deletePropertyImages(property.images || []);
    }

    // Delete the user's published properties.
    await Property.deleteMany({ userId });

    // Delete property alerts created by this user.
    await PropertyAlert.deleteMany({
        user: userId,
    });

    // Delete notifications received by this user.
    await Notification.deleteMany({
        userId,
    });

    // Delete the user last.
    await User.deleteOne({ _id: userId });

    console.log(
        `[AccountDeletion] User ${userId} and associated data deleted.`
    );
}
