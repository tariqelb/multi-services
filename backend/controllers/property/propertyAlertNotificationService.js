import PropertyAlert from "../../DatabaseModels/Schema/PropertyAlert.js";
import User from "../../DatabaseModels/Schema/User.js";
import { createAndEmitNotification } from "../../Notification/NotificationService.js";
import { sendPropertyAlertEmail } from "../../services/emailService.js";

export const sendEmailIfEnabled = async (alert, property) => {
    // PropertyAlert uses the "user" field for its owner.
    const user = await User.findById(alert.user)
        .select("email notificationPreferences");

    if (!user?.email) {
        return { sent: false, reason: "No email address" };
    }

    const emailPreferences =
        user.notificationPreferences?.email;

    if (
        emailPreferences?.enabled !== true ||
        emailPreferences?.propertyAlerts !== true
    ) {
        return { sent: false, reason: "Email alerts disabled" };
    }

    await sendPropertyAlertEmail({
        to: user.email,
        property,
    });

    return { sent: true };
};


const escapeRegex = (value) =>
    value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const notifyMatchingPropertyAlerts = async (property, io) => {
    console.log("\n========== PROPERTY ALERT DEBUG ==========");
    console.log("Property ID:", String(property._id));
    console.log("Publisher ID:", String(property.userId));
    console.log("City:", JSON.stringify(property.city));
    console.log("Property type:", JSON.stringify(property.propertyType));
    console.log("Listing type:", JSON.stringify(property.listingType));

    const city = property.city?.trim();

    if (
        !city ||
        !property.propertyType ||
        !property.listingType ||
        !property.userId
    ) {
        console.log("Missing required matching fields.");
        return { matchedUsers: 0, notifiedUsers: 0 };
    }

    const matchingAlerts = await PropertyAlert.find({
        user: { $ne: property.userId },
        city: {
            $regex: `^${escapeRegex(city)}$`,
            $options: "i",
        },
        propertyTypes: property.propertyType,
        listingTypes: property.listingType,
    })
        .select("user city propertyTypes listingTypes")
        .lean();

    console.log("Matching alerts found:", matchingAlerts.length);
    console.log(
        "Matching alert details:",
        matchingAlerts.map((alert) => ({
            user: String(alert.user),
            city: alert.city,
            propertyTypes: alert.propertyTypes,
            listingTypes: alert.listingTypes,
        }))
    );

    const userIds = [
        ...new Set(matchingAlerts.map((alert) => String(alert.user))),
    ];

    const results = await Promise.allSettled(
        userIds.map((userId) =>
            createAndEmitNotification(io, {
                userId,
                type: "property_match",
                title: "New property matches your alert",
                message: `${property.title} is available in ${property.city}.`,
                link: `/properties/${property._id}`,
                data: {
                    propertyId: String(property._id),
                    city: property.city,
                    propertyType: property.propertyType,
                    listingType: property.listingType,
                },
            })
        )
    );

    results.forEach((result, index) => {
        if (result.status === "fulfilled") {
            console.log(
                `Notification saved for user ${userIds[index]}`
            );
        } else {
            console.error(
                `Notification failed for user ${userIds[index]}:`,
                result.reason
            );
        }
    });

    const notifiedUsers = results.filter(
        (result) => result.status === "fulfilled"
    ).length;

    console.log("Notifications saved:", notifiedUsers);
    console.log("==========================================\n");

    // Send email alerts independently of in-app notifications.
    const uniqueAlertsByUser = new Map();

    for (const alert of matchingAlerts) {
        const userId = String(alert.user);

        if (!uniqueAlertsByUser.has(userId)) {
            uniqueAlertsByUser.set(userId, alert);
        }
    }

    const emailResults = await Promise.allSettled(
        [...uniqueAlertsByUser.values()].map(async (alert) => {
            const result = await sendEmailIfEnabled(alert, property);

            console.log(
                `[PropertyAlertEmail] User ${alert.user}:`,
                result
            );

            return result;
        })
    );

    emailResults.forEach((result, index) => {
        if (result.status === "rejected") {
            console.error(
                "[PropertyAlertEmail] Failed:",
                result.reason?.message ?? result.reason
            );
        }
    });

    const emailsSent = emailResults.filter(
        (result) =>
            result.status === "fulfilled" &&
            result.value.sent
    ).length;

    console.log("Property alert emails sent:", emailsSent);

    return {
        matchedUsers: userIds.length,
        notifiedUsers,
        failedNotifications: results.length - notifiedUsers,
        emailsSent,
        failedEmails: emailResults.filter(
            (result) => result.status === "rejected"
        ).length,
    };
};

export default notifyMatchingPropertyAlerts;