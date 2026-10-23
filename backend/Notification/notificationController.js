import Notification from "../DatabaseModels/Schema/Notification.js";

export const getMyNotifications = async (req, res, next) => {
    try {
        const userId = req.user.userId;

        const [notifications, unreadCount] = await Promise.all([
            Notification.find({ userId })
                .sort({ createdAt: -1 })
                .limit(50)
                .lean(),

            Notification.countDocuments({
                userId,
                isRead: false,
            }),
        ]);

        return res.status(200).json({
            notifications,
            unreadCount,
        });
    } catch (error) {
        next(error);
    }
};

export const markNotificationAsRead = async (
    req,
    res,
    next
) => {
    try {
        const notification = await Notification.findOneAndUpdate(
            {
                _id: req.params.id,
                userId: req.user.userId,
            },
            {
                $set: { isRead: true },
            },
            {
                new: true,
                runValidators: true,
            }
        );

        if (!notification) {
            return res.status(404).json({
                message: "Notification not found.",
            });
        }

        return res.status(200).json({
            message: "Notification marked as read.",
            notification,
        });
    } catch (error) {
        if (error.name === "CastError") {
            return res.status(400).json({
                message: "Invalid notification ID.",
            });
        }

        next(error);
    }
};

export const markAllNotificationsAsRead = async (
    req,
    res,
    next
) => {
    try {
        const result = await Notification.updateMany(
            {
                userId: req.user.userId,
                isRead: false,
            },
            {
                $set: { isRead: true },
            }
        );

        return res.status(200).json({
            message: "All notifications marked as read.",
            modifiedCount: result.modifiedCount,
        });
    } catch (error) {
        next(error);
    }
};

export const deleteNotification = async (req, res, next) => {
    try {
        const notification = await Notification.findOneAndDelete({
            _id: req.params.id,
            userId: req.user.userId,
        });

        if (!notification) {
            return res.status(404).json({
                message: "Notification not found.",
            });
        }

        return res.status(200).json({
            message: "Notification deleted.",
            notificationId: notification._id,
        });
    } catch (error) {
        if (error.name === "CastError") {
            return res.status(400).json({
                message: "Invalid notification ID.",
            });
        }

        next(error);
    }
};