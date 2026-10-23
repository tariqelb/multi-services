import PropertyAlert from "../../DatabaseModels/Schema/PropertyAlert.js";
import { createAndEmitNotification } from "../../Notification/NotificationService.js";

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

    return {
        matchedUsers: userIds.length,
        notifiedUsers,
        failedNotifications: results.length - notifiedUsers,
    };
};

export default notifyMatchingPropertyAlerts;