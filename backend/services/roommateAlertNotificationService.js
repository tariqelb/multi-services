import RoommateAlert from "../DatabaseModels/Schema/RoommateAlert.js";
import User from "../DatabaseModels/Schema/User.js";

import {
    createAndEmitNotification,
} from "../Notification/NotificationService.js";

import {
    sendRoommateAlertEmail,
} from "./emailService.js";

const escapeRegex = (value) =>
    value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");


export const sendRoommateEmailIfEnabled = async (
    alert,
    roommateListing
) => {
    const user = await User.findById(alert.user)
        .select("email notificationPreferences");

    if (!user?.email) {
        return {
            sent: false,
            reason: "No email address",
        };
    }

    const emailPreferences =
        user.notificationPreferences?.email;

    if (
        emailPreferences?.enabled !== true ||
        emailPreferences?.roommateAlerts !== true
    ) {
        return {
            sent: false,
            reason: "Roommate email alerts disabled",
        };
    }

    await sendRoommateAlertEmail({
        to: user.email,
        roommateListing,
    });

    return { sent: true };
};


const notifyMatchingRoommateAlerts = async (
    roommateListing,
    io
) => {
    console.log("\n========== ROOMMATE ALERT DEBUG ==========");

    console.log("Listing ID:", String(roommateListing._id));
    console.log("Publisher:", String(roommateListing.userId));
    console.log("City:", roommateListing.city);
    console.log("Purpose:", roommateListing.purpose);
    console.log("Property type:", roommateListing.propertyType);
    console.log("Rental period:", roommateListing.rentalPeriod);

    const city = roommateListing.city?.trim();

    if (
        !city ||
        !roommateListing.purpose ||
        !roommateListing.propertyType ||
        !roommateListing.userId
    ) {
        console.log("Missing required matching fields.");

        return {
            matchedUsers: 0,
            notifiedUsers: 0,
            emailsSent: 0,
        };
    }

    // An empty rentalPeriods array means any rental period.
    const rentalPeriodFilter = roommateListing.rentalPeriod
        ? {
            $or: [
                { rentalPeriods: { $size: 0 } },
                { rentalPeriods: roommateListing.rentalPeriod },
            ],
        }
        : {
            rentalPeriods: { $size: 0 },
        };

    const matchingAlerts = await RoommateAlert.find({
        user: { $ne: roommateListing.userId },
        isArchived: { $ne: true },

        city: {
            $regex: `^${escapeRegex(city)}$`,
            $options: "i",
        },

        propertyTypes: roommateListing.propertyType,
        purposes: roommateListing.purpose,

        ...rentalPeriodFilter,
    })
        .select("user city propertyTypes purposes rentalPeriods")
        .lean();

    console.log("Matching alerts found:", matchingAlerts.length);

    const userIds = [
        ...new Set(
            matchingAlerts.map((alert) => String(alert.user))
        ),
    ];

    // Send in-app notifications.
    const notificationResults = await Promise.allSettled(
        userIds.map((userId) =>
            createAndEmitNotification(io, {
                userId,
                type: "roommate_match",
                title: "New roommate announcement matches your alert",
                message: `${roommateListing.title} is available in ${roommateListing.city}.`,
                link: `/roommates/${roommateListing._id}`,
                data: {
                    roommateListingId: String(roommateListing._id),
                    city: roommateListing.city,
                    purpose: roommateListing.purpose,
                    propertyType: roommateListing.propertyType,
                    rentalPeriod: roommateListing.rentalPeriod,
                },
            })
        )
    );

    notificationResults.forEach((result, index) => {
        if (result.status === "fulfilled") {
            console.log(
                `Roommate notification saved for ${userIds[index]}`
            );
        } else {
            console.error(
                `Roommate notification failed for ${userIds[index]}:`,
                result.reason
            );
        }
    });

    const notifiedUsers = notificationResults.filter(
        (result) => result.status === "fulfilled"
    ).length;

    // Deduplicate alerts by user before sending emails.
    const uniqueAlertsByUser = new Map();

    for (const alert of matchingAlerts) {
        const userId = String(alert.user);

        if (!uniqueAlertsByUser.has(userId)) {
            uniqueAlertsByUser.set(userId, alert);
        }
    }

    // Send emails independently of in-app notifications.
    const emailResults = await Promise.allSettled(
        [...uniqueAlertsByUser.values()].map(async (alert) => {
            const result = await sendRoommateEmailIfEnabled(
                alert,
                roommateListing
            );

            console.log(
                `[RoommateAlertEmail] User ${alert.user}:`,
                result
            );

            return result;
        })
    );

    emailResults.forEach((result) => {
        if (result.status === "rejected") {
            console.error(
                "[RoommateAlertEmail] Failed:",
                result.reason?.message ?? result.reason
            );
        }
    });

    const emailsSent = emailResults.filter(
        (result) =>
            result.status === "fulfilled" &&
            result.value.sent
    ).length;

    console.log("Notifications saved:", notifiedUsers);
    console.log("Emails sent:", emailsSent);
    console.log("==========================================\n");

    return {
        matchedUsers: userIds.length,
        notifiedUsers,
        failedNotifications:
            notificationResults.length - notifiedUsers,
        emailsSent,
        failedEmails: emailResults.filter(
            (result) => result.status === "rejected"
        ).length,
    };
};

export default notifyMatchingRoommateAlerts;