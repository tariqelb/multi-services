// backend/apps/vehicles/services/vehicleAlertNotifier.js
//
// A vehicle was published: every ACTIVE alert it matches (archived alerts
// are silent) notifies its owner, once per user:
//   - in-app notification (always),
//   - email when the user's email notifications and "vehicle alerts" are on,
//   - WhatsApp when the user's WhatsApp notifications and "vehicle alerts"
//     are on, the number is verified and WhatsApp is configured.
// The publisher is never notified about their own vehicle.

import VehicleAlert from "../models/VehicleAlert.js";
import User from "../../main/models/User.js";
import { createAndEmitNotification } from "../../main/services/NotificationService.js";
import { sendVehicleAlertEmail } from "../../main/services/emailService.js";
import { sendWhatsAppAlert } from "../../main/services/whatsappService.js";
import { getUserWhatsApp } from "../../main/utils/whatsapp.js";

const escapeRegex = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// Type names for the email / WhatsApp message, in the user's language.
const TYPE_LABELS = {
    en: {
        city_car: "City car", sedan: "Sedan", suv: "SUV", "4x4": "4x4", estate: "Estate", coupe: "Coupe", convertible: "Convertible",
        minivan: "Minivan", van: "Van", pickup: "Pickup", motorcycle: "Motorcycle", scooter: "Scooter", bicycle: "Bicycle",
        kick_scooter: "Kick scooter", tricycle: "Tricycle", car: "Vehicle", moto: "Moto or bike",
    },
    fr: {
        city_car: "Citadine", sedan: "Berline", suv: "SUV", "4x4": "4x4", estate: "Break", coupe: "Coupé", convertible: "Cabriolet",
        minivan: "Monospace", van: "Utilitaire", pickup: "Pick-up", motorcycle: "Moto", scooter: "Scooter", bicycle: "Vélo",
        kick_scooter: "Trottinette", tricycle: "Triporteur", car: "Véhicule", moto: "Moto ou vélo",
    },
    ar: {
        city_car: "سيارة مدينة", sedan: "سيدان", suv: "SUV", "4x4": "رباعية الدفع", estate: "ستيشن", coupe: "كوبيه", convertible: "مكشوفة",
        minivan: "ميني فان", van: "فان", pickup: "بيك أب", motorcycle: "دراجة نارية", scooter: "سكوتر", bicycle: "دراجة هوائية",
        kick_scooter: "تروتينيت", tricycle: "تريبورتور", car: "مركبة", moto: "دراجة",
    },
};
const WHATSAPP_HEADINGS = {
    en: "New vehicle matching your alert",
    fr: "Nouveau véhicule correspondant à votre alerte",
    ar: "مركبة جديدة تطابق تنبيهك",
};
const lang = (language) => (["en", "fr", "ar"].includes(language) ? language : "en");

export function vehicleTypeLabel(vehicle, language) {
    const labels = TYPE_LABELS[lang(language)];
    const isMoto = vehicle.category === "moto";
    return labels[isMoto ? vehicle.motoType : vehicle.bodyType] || labels[isMoto ? "moto" : "car"];
}

/** MongoDB filter of the active alerts a vehicle matches. */
export function matchingAlertsFilter(vehicle) {
    const category = vehicle.category === "moto" ? "moto" : "car";
    const typeField = category === "moto" ? "motoTypes" : "bodyTypes";
    const type = category === "moto" ? vehicle.motoType : vehicle.bodyType;
    const make = String(vehicle.make || "").trim().toLowerCase();
    const price = Number(vehicle.price);
    const city = String(vehicle.city || "").trim();

    return {
        isArchived: { $ne: true },
        user: { $ne: vehicle.userId },
        listingTypes: vehicle.listingType,
        categories: category,
        $and: [
            { $or: [{ city: "" }, { city: null }, ...(city ? [{ city: { $regex: `^${escapeRegex(city)}$`, $options: "i" } }] : [])] },
            { $or: [{ [typeField]: { $size: 0 } }, ...(type ? [{ [typeField]: type }] : [])] },
            { $or: [{ makeKeys: { $size: 0 } }, { makeKeys: { $exists: false } }, ...(make ? [{ makeKeys: make }] : [])] },
            { $or: [{ maxPrice: null }, ...(Number.isFinite(price) && price > 0 ? [{ maxPrice: { $gte: price } }] : [])] },
        ],
    };
}

export async function notifyMatchingVehicleAlerts(vehicle, io, deps = {}) {
    const {
        AlertModel = VehicleAlert,
        UserModel = User,
        notify = createAndEmitNotification,
        sendEmail = sendVehicleAlertEmail,
        sendWhatsApp = sendWhatsAppAlert,
    } = deps;

    if (!vehicle?._id || !vehicle.userId || vehicle.status !== "Available") {
        return { matchedUsers: 0, notifications: 0, emails: 0, whatsapp: 0 };
    }

    const alerts = await AlertModel.find(matchingAlertsFilter(vehicle)).select("_id user").lean();
    const alertIdsByUser = new Map();
    for (const alert of alerts) {
        const key = String(alert.user);
        if (!alertIdsByUser.has(key)) alertIdsByUser.set(key, []);
        alertIdsByUser.get(key).push(alert._id);
    }
    const userIds = [...alertIdsByUser.keys()];
    if (!userIds.length) return { matchedUsers: 0, notifications: 0, emails: 0, whatsapp: 0 };

    // Suspended accounts get nothing.
    const users = (
        await UserModel.find({ _id: { $in: userIds } })
            .select("email language notificationPreferences phoneNumber phoneVerified whatsappNumber whatsappVerified accountStatus")
            .lean()
    ).filter((user) => !user.accountStatus || user.accountStatus === "active");
    const frontend = (process.env.FRONTEND_URL || "https://multi-services-frontend.vercel.app").replace(/\/$/, "");
    const url = `${frontend}/vehicles/${vehicle._id}`;
    const summary = { matchedUsers: users.length, notifications: 0, emails: 0, whatsapp: 0 };

    await Promise.allSettled(
        users.map(async (user) => {
            const language = lang(user.language);
            const typeLabel = vehicleTypeLabel(vehicle, language);

            // In-app notification.
            try {
                await notify(io, {
                    userId: String(user._id),
                    type: "vehicle_match",
                    title: "New vehicle matches your alert",
                    message: `${vehicle.title} is available in ${vehicle.city}.`,
                    link: `/vehicles/${vehicle._id}`,
                    data: {
                        vehicleId: String(vehicle._id),
                        category: vehicle.category || "car",
                        city: vehicle.city,
                        listingType: vehicle.listingType,
                        type: vehicle.category === "moto" ? vehicle.motoType : vehicle.bodyType,
                    },
                });
                summary.notifications += 1;
            } catch (error) {
                console.error("[VehicleAlerts] Notification failed:", error.message);
            }

            // Email.
            const email = user.notificationPreferences?.email || {};
            if (user.email && email.enabled !== false && email.vehicleAlerts !== false) {
                try {
                    await sendEmail({ to: user.email, language, vehicle: { ...vehicle, typeLabel } });
                    summary.emails += 1;
                } catch (error) {
                    console.error("[VehicleAlerts] Email failed:", error.message);
                }
            }

            // WhatsApp.
            const whatsapp = user.notificationPreferences?.whatsapp || {};
            const { number, verified } = getUserWhatsApp(user);
            if (whatsapp.enabled === true && whatsapp.vehicleAlerts === true && verified) {
                try {
                    const price = vehicle.price ? `${Number(vehicle.price).toLocaleString("fr-MA")} MAD` : "";
                    const result = await sendWhatsApp({
                        to: number,
                        language,
                        heading: WHATSAPP_HEADINGS[language],
                        title: `${vehicle.title} (${typeLabel})`,
                        details: [vehicle.city, price].filter(Boolean).join(" · "),
                        url,
                    });
                    if (result?.sent) summary.whatsapp += 1;
                } catch (error) {
                    console.error("[VehicleAlerts] WhatsApp failed:", error.response?.data?.error?.message || error.message);
                }
            }
        }),
    );

    // How often each alert matched.
    const matchedAlertIds = users.flatMap((user) => alertIdsByUser.get(String(user._id)) || []);
    if (matchedAlertIds.length) {
        await AlertModel.updateMany({ _id: { $in: matchedAlertIds } }, { $inc: { matchCount: 1 }, $set: { lastMatchedAt: new Date() } });
    }
    return summary;
}

export default notifyMatchingVehicleAlerts;
