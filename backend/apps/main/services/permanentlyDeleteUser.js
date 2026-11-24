// backend/apps/main/services/permanentlyDeleteUser.js

import User from "../models/User.js";
import Notification from "../models/Notification.js";

import { deleteUserData } from "./serviceRegistry.js";

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

    // Each service removes the user's data (listings, images, alerts, saved items...).
    await deleteUserData(userId);

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
