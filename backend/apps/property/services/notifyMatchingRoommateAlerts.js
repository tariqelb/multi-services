
import RoommateAlert from "../models/RoommateAlert.js";
import User from "../../main/models/User.js";

import {
    createAndEmitNotification,
} from "../../main/services/NotificationService.js";

import {
    sendRoommateAlertEmail,
} from "../../main/services/emailService.js";

import {
    sendRoommateAlertSMS,
} from "../../main/services/smsService.js";
import { getWhatsAppPreferencesView } from "../../main/utils/whatsapp.js";

// Unique marker to verify that this exact file is loaded.
console.log(
    "🔥 [RoommateAlerts] LOADED SMS VERSION 2026-11-15"
);

const escapeRegex = (value) =>
    value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const normalizeLanguage = (language) => {
    const normalized = String(language || "en")
        .toLowerCase()
        .split("-")[0]
        .split("_")[0];

    return ["en", "fr", "ar"].includes(normalized)
        ? normalized
        : "en";
};

const notificationTranslations = {
    en: {
        title: "New roommate announcement matches your alert",
        message: (listing) =>
            `${listing.title || "A new announcement"} is available in ${listing.city}.`,
    },

    fr: {
        title: "Une nouvelle annonce de colocation correspond à votre alerte",
        message: (listing) =>
            `${listing.title || "Une nouvelle annonce"} est disponible à ${listing.city}.`,
    },

    ar: {
        title: "إعلان سكن مشترك جديد يطابق التنبيه الخاص بك",
        message: (listing) =>
            `${listing.title || "إعلان جديد"} متاح في ${listing.city}.`,
    },
};

/**
 * Send email notification if enabled.
 */
const sendEmailIfEnabled = async (user, roommateListing) => {
    if (!user?.email) {
        return {
            sent: false,
            reason: "No email address",
        };
    }

    const preferences =
        user.notificationPreferences?.email;

    if (
        preferences?.enabled !== true ||
        preferences?.propertyAlerts !== true
    ) {
        return {
            sent: false,
            reason: "Email property alerts disabled",
        };
    }

    await sendRoommateAlertEmail({
        to: user.email,
        roommateListing,
        language: normalizeLanguage(user.language),
    });

    return {
        sent: true,
    };
};

/**
 * Send SMS notification if enabled.
 *
 * Reuses the existing WhatsApp preference object
 * because it contains the verified phone number.
 */
const sendSMSIfEnabled = async (user, roommateListing) => {
    // Switches + the user's WhatsApp number (user.whatsappNumber).
    const preferences = getWhatsAppPreferencesView(user);

    console.log("\n[Roommate SMS] Checking recipient:", {
        userId: String(user._id),
        language: user.language,
        normalizedLanguage: normalizeLanguage(user.language),
        smsEnabled: preferences?.enabled,
        propertyAlertsEnabled: preferences?.propertyAlerts,
        phoneVerified: preferences?.verified,
        phoneNumberExists: Boolean(preferences?.phoneNumber),
    });

    if (
        preferences?.enabled !== true ||
        preferences?.propertyAlerts !== true
    ) {
        return {
            sent: false,
            reason: "SMS property alerts disabled",
        };
    }

    if (preferences.verified !== true) {
        return {
            sent: false,
            reason: "Phone number not verified",
        };
    }

    if (!preferences.phoneNumber) {
        return {
            sent: false,
            reason: "No phone number configured",
        };
    }

    console.log("[Roommate SMS] Eligible recipient:", {
        userId: String(user._id),
        phoneNumber: preferences.phoneNumber,
        language: normalizeLanguage(user.language),
        listingId: String(roommateListing._id),
    });

    const result = await sendRoommateAlertSMS({
        to: preferences.phoneNumber,
        roommateListing,
        language: normalizeLanguage(user.language),
    });

    console.log("[Roommate SMS] Service result:", {
        userId: String(user._id),
        result,
    });

    return result;
};

/**
 * Find users with matching roommate alerts and notify them.
 */
const notifyMatchingRoommateAlerts = async (
    roommateListing,
    io
) => {
    console.log("\n========== ROOMMATE ALERT DEBUG ==========");
    console.log("Handler version: SMS VERSION 2026-11-15");

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
        console.log("[Roommate Alerts] Missing required matching fields.");
        console.log("==========================================\n");

        return {
            matchedUsers: 0,
            notifiedUsers: 0,
            emailsSent: 0,
            smsSent: 0,
            failedNotifications: 0,
            failedEmails: 0,
            failedSMS: 0,
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

    console.log(
        "[Roommate Alerts] Matching alerts found:",
        matchingAlerts.length
    );

    // One notification per user, even if they have multiple matching alerts.
    const uniqueAlertsByUser = new Map();

    for (const alert of matchingAlerts) {
        const userId = String(alert.user);

        if (!uniqueAlertsByUser.has(userId)) {
            uniqueAlertsByUser.set(userId, alert);
        }
    }

    const uniqueAlerts = [...uniqueAlertsByUser.values()];

    const userIds = uniqueAlerts.map(
        (alert) => alert.user
    );

    if (userIds.length === 0) {
        console.log("[Roommate Alerts] No users matched.");
        console.log("==========================================\n");

        return {
            matchedUsers: 0,
            notifiedUsers: 0,
            emailsSent: 0,
            smsSent: 0,
            failedNotifications: 0,
            failedEmails: 0,
            failedSMS: 0,
        };
    }

    // Load recipient language and notification preferences once.
    const users = await User.find({
        _id: { $in: userIds },
    })
        .select("email language notificationPreferences phoneNumber phoneVerified whatsappNumber whatsappVerified accountStatus")
        .lean();

    const usersById = new Map(
        users.map((user) => [
            String(user._id),
            user,
        ])
    );

    const recipients = uniqueAlerts
        .map((alert) => usersById.get(String(alert.user)))
        .filter(Boolean);

    console.log("[Roommate Alerts] Unique recipients:", recipients.length);

    // 1. In-app notifications.
    const notificationResults = await Promise.allSettled(
        recipients.map((user) => {
            const language = normalizeLanguage(user.language);
            const translations = notificationTranslations[language];

            console.log("[Roommate Notification] Recipient:", {
                userId: String(user._id),
                language,
            });

            return createAndEmitNotification(io, {
                userId: String(user._id),
                type: "roommate_match",
                title: translations.title,
                message: translations.message(roommateListing),
                link: `/roommates/${roommateListing._id}`,
                data: {
                    roommateListingId: String(roommateListing._id),
                    city: roommateListing.city,
                    purpose: roommateListing.purpose,
                    propertyType: roommateListing.propertyType,
                    rentalPeriod: roommateListing.rentalPeriod,
                },
            });
        })
    );

    notificationResults.forEach((result, index) => {
        if (result.status === "fulfilled") {
            console.log(
                `[RoommateNotification] Saved for ${recipients[index]._id}`
            );
        } else {
            console.error(
                `[RoommateNotification] Failed for ${recipients[index]._id}:`,
                result.reason?.message ?? result.reason
            );
        }
    });

    const notifiedUsers = notificationResults.filter(
        (result) => result.status === "fulfilled"
    ).length;

    // 2. Email notifications.
    console.log("\n========== ROOMMATE EMAIL NOTIFICATIONS ==========");

    const emailResults = await Promise.allSettled(
        recipients.map(async (user) => {
            const result = await sendEmailIfEnabled(
                user,
                roommateListing
            );

            console.log(
                `[RoommateAlertEmail] User ${user._id}:`,
                result
            );

            return result;
        })
    );

    emailResults.forEach((result, index) => {
        if (result.status === "rejected") {
            console.error(
                `[RoommateAlertEmail] Failed for ${recipients[index]._id}:`,
                result.reason?.message ?? result.reason
            );
        }
    });

    const emailsSent = emailResults.filter(
        (result) =>
            result.status === "fulfilled" &&
            result.value.sent
    ).length;

    const failedEmails = emailResults.filter(
        (result) => result.status === "rejected"
    ).length;

    // 3. SMS notifications.
    console.log("\n========== ROOMMATE SMS NOTIFICATIONS ==========");

    console.log("[Roommate SMS] Recipients diagnostic:");

    recipients.forEach((user) => {
        const preferences = getWhatsAppPreferencesView(user);

        console.log({
            userId: String(user._id),
            language: user.language,
            normalizedLanguage: normalizeLanguage(user.language),
            enabled: preferences?.enabled,
            propertyAlerts: preferences?.propertyAlerts,
            verified: preferences?.verified,
            phoneNumberExists: Boolean(preferences?.phoneNumber),
            phoneNumber: preferences?.phoneNumber || "MISSING",
        });
    });

    const smsResults = await Promise.allSettled(
        recipients.map(async (user) => {
            const result = await sendSMSIfEnabled(
                user,
                roommateListing
            );

            console.log(
                `[RoommateAlertSMS] User ${user._id}:`,
                result
            );

            return result;
        })
    );

    smsResults.forEach((result, index) => {
        if (result.status === "rejected") {
            console.error(
                `[RoommateAlertSMS] Failed for ${recipients[index]._id}:`,
                result.reason?.message ?? result.reason
            );
        }
    });

    const smsSent = smsResults.filter(
        (result) =>
            result.status === "fulfilled" &&
            result.value.sent === true
    ).length;

    const smsSkipped = smsResults.filter(
        (result) =>
            result.status === "fulfilled" &&
            result.value.sent !== true
    ).length;

    const failedSMS = smsResults.filter(
        (result) => result.status === "rejected"
    ).length;

    const failedNotifications =
        notificationResults.filter(
            (result) => result.status === "rejected"
        ).length;

    // Final summary.
    console.log("\n========== ROOMMATE ALERT SUMMARY ==========");
    console.log("Matched users:", recipients.length);
    console.log("In-app notifications saved:", notifiedUsers);
    console.log("Emails accepted:", emailsSent);
    console.log("SMS messages accepted:", smsSent);
    console.log("SMS skipped:", smsSkipped);
    console.log("Failed in-app notifications:", failedNotifications);
    console.log("Failed emails:", failedEmails);
    console.log("Failed SMS messages:", failedSMS);
    console.log("=============================================\n");

    return {
        matchedUsers: recipients.length,
        notifiedUsers,
        emailsSent,
        smsSent,
        smsSkipped,
        failedNotifications,
        failedEmails,
        failedSMS,
    };
};

export default notifyMatchingRoommateAlerts;
