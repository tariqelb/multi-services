// backend/apps/main/utils/ownerContact.js
//
// Listings show the owner's CURRENT phone / WhatsApp / email (not the ones
// copied when the listing was published). A number is "verified" only if it
// is the one the owner verified. Shared by every service.

export const OWNER_CONTACT_FIELDS =
    "firstName lastName email emailVerified phoneNumber phoneVerified whatsappNumber whatsappVerified profileImage";

const digits = (value) => String(value || "").replace(/\D/g, "");

export function contactFromOwner(owner, fallback = {}) {
    const phone = String(owner?.phoneNumber || fallback.phone || "").trim();
    const whatsappNumber = String(owner?.whatsappNumber || "").trim();
    const email = String(owner?.email || fallback.email || "").trim();

    return {
        phone,
        whatsappNumber,
        email,
        contactVerified: {
            phone: Boolean(owner?.phoneVerified && phone && digits(phone) === digits(owner.phoneNumber)),
            whatsapp: Boolean(owner?.whatsappVerified && whatsappNumber && digits(whatsappNumber) === digits(owner.whatsappNumber)),
            email: Boolean(owner?.emailVerified && email && email.toLowerCase() === String(owner.email).toLowerCase()),
        },
    };
}
