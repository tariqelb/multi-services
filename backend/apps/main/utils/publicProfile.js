// backend/apps/main/utils/publicProfile.js
//
// Public profile visibility (Settings > Public profile): each user chooses
// what visitors see on their public profiles (property and vehicles).
// Hidden by default: email, phone, WhatsApp, address, and requests.

export { publicSocialLinksOf } from "./socialLinks.js";

export const VISIBILITY_KEYS = ["email", "phone", "whatsapp", "address", "requests"];

/** Fields to select to build the public contact. */
// (socialLinks: the public ones are shown, see utils/socialLinks.js)
export const PUBLIC_CONTACT_FIELDS =
    "email emailVerified phoneNumber phoneVerified whatsappNumber whatsappVerified address publicProfileVisibility socialLinks";

const digits = (value) => String(value || "").replace(/\D/g, "");

/** The user's choices, defaults filled (all false). */
export function visibilityOf(user) {
    const saved = user?.publicProfileVisibility || {};
    return Object.fromEntries(VISIBILITY_KEYS.map((key) => [key, saved[key] === true]));
}

/** Reads the Settings form: only known keys, booleans. */
export function cleanVisibility(body = {}) {
    return Object.fromEntries(VISIBILITY_KEYS.map((key) => [key, body[key] === true || body[key] === "true"]));
}

/**
 * Contact shown on the public profile: only what the user chose to show,
 * and only values they have. null when nothing is shown.
 * { email, emailVerified, phone, phoneVerified, whatsappNumber, whatsappVerified, address }
 */
export function publicContactOf(user) {
    const show = visibilityOf(user);
    const contact = {};

    if (show.email && user?.email) {
        contact.email = user.email;
        contact.emailVerified = Boolean(user.emailVerified);
    }
    if (show.phone && user?.phoneNumber) {
        contact.phone = user.phoneNumber;
        contact.phoneVerified = Boolean(user.phoneVerified);
    }
    if (show.whatsapp && user?.whatsappNumber) {
        contact.whatsappNumber = user.whatsappNumber;
        contact.whatsappVerified = Boolean(user.whatsappVerified && digits(user.whatsappNumber));
    }
    if (show.address && String(user?.address || "").trim()) {
        contact.address = String(user.address).trim();
    }

    return Object.keys(contact).length ? contact : null;
}
