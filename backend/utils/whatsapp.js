// utils/whatsapp.js
//
// The user's WhatsApp number lives next to the phone number:
//   user.whatsappNumber, user.whatsappVerified
// notificationPreferences.whatsapp only holds the switches
// (enabled, propertyAlerts).

export const normalizePhoneNumber = (value = "") =>
    String(value || "").trim().replace(/[\s().-]/g, "");

export const isValidInternationalPhone = (value = "") =>
    /^\+[1-9]\d{6,14}$/.test(value);

/** A number equal to the SMS-verified phone number counts as verified. */
export function isSameAsVerifiedPhone(user, whatsappNumber) {
    const phone = normalizePhoneNumber(user?.phoneNumber);
    const whatsapp = normalizePhoneNumber(whatsappNumber);

    return Boolean(phone) && phone === whatsapp && user?.phoneVerified === true;
}

/** { number, verified } for any user document (lean or hydrated). */
export function getUserWhatsApp(user) {
    const number = normalizePhoneNumber(user?.whatsappNumber);

    return {
        number,
        verified: Boolean(number) && (user?.whatsappVerified === true || isSameAsVerifiedPhone(user, number)),
    };
}

/** Notification switches + the number, as the API returns them. */
export function getWhatsAppPreferencesView(user) {
    const switches = user?.notificationPreferences?.whatsapp || {};
    const { number, verified } = getUserWhatsApp(user);

    return {
        enabled: switches.enabled ?? false,
        propertyAlerts: switches.propertyAlerts ?? false,
        // Read-only copies, kept for older screens. The source is
        // user.whatsappNumber / user.whatsappVerified.
        phoneNumber: number,
        verified,
    };
}
