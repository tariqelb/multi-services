import Notification from "../DatabaseModels/Schema/Notification.js";

export const createAndEmitNotification = async (
    io,
    { userId, type, title, message, link = "", data = {} }
) => {
    console.log("[Notification] Creating notification...");
    console.log("[Notification] Recipient:", String(userId));
    console.log("[Notification] Model collection:", Notification.collection.name);

    const notification = await Notification.create({
        userId,
        type,
        title,
        message,
        link,
        data,
    });

    console.log(
        "[Notification] Saved successfully:",
        String(notification._id)
    );

    const result = notification.toObject();

    io?.to(`user:${userId}`).emit("notification:new", result);

    return result;
};