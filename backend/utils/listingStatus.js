// utils/listingStatus.js
//
// Status rules shared by properties and roommate announcements.
//   - For Sale  -> Available | Sold | Inactive
//   - For Rent  -> Available | Rented | Inactive
//   - Inactive listings stay viewable but show no contact (phone, email,
//     WhatsApp) to visitors. The owner and administrators still see it.

export const PROPERTY_STATUSES_BY_LISTING_TYPE = {
    "For Sale": ["Available", "Sold", "Inactive"],
    "For Rent": ["Available", "Rented", "Inactive"],
};

export const getAllowedPropertyStatuses = (listingType) =>
    PROPERTY_STATUSES_BY_LISTING_TYPE[listingType] || ["Available", "Inactive"];

export const isPropertyStatusAllowed = (listingType, status) =>
    getAllowedPropertyStatuses(listingType).includes(status);

/** Status to keep when the listing type changes (Sold <-> Rented make no sense). */
export const statusForListingType = (listingType, status) =>
    isPropertyStatusAllowed(listingType, status) ? status : "Available";

// ---------------------------------------------------------------------------
// Contact visibility
// ---------------------------------------------------------------------------

export const isPropertyContactClosed = (property) => property?.status === "Inactive";

export const isRoommateContactClosed = (listing) => listing?.status === "Inactive";

const sameId = (a, b) => Boolean(a && b) && String(a?._id || a) === String(b?._id || b);

/** Property without its contact details, flagged with contactHidden. */
export function withoutPropertyContact(property) {
    return {
        ...property,
        phone: "",
        whatsappNumber: "",
        email: "",
        showEmail: false,
        contactVerified: { phone: false, whatsapp: false, email: false },
        contactHidden: true,
    };
}

/** Lists: no phone / email in bulk (the details page has them). */
export function withoutListContact(property) {
    const { phone, email, whatsappNumber, ...rest } = property || {};
    return rest;
}

// ---------------------------------------------------------------------------
// Current contact + "verified" badges
//
// Listings show the owner's CURRENT numbers (not the ones copied when the
// listing was published). A number is "verified" only if it is the one
// the owner verified.
// ---------------------------------------------------------------------------

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

/** Property with the owner's current contact (owner may be null: kept as is). */
export function withOwnerContact(property, owner) {
    if (!owner) {
        return {
            ...property,
            contactVerified: { phone: false, whatsapp: false, email: false },
        };
    }

    return {
        ...property,
        ...contactFromOwner(owner, property),
        firstName: owner.firstName || property.firstName,
        lastName: owner.lastName || property.lastName,
    };
}

/**
 * Property as a visitor sees it. viewerId / isAdmin: the requester.
 */
export function propertyForViewer(property, { viewerId = null, isAdmin = false } = {}) {
    if (!property || !isPropertyContactClosed(property)) return property;
    if (isAdmin || sameId(property.userId, viewerId)) return property;

    return withoutPropertyContact(property);
}

/** Roommate announcement as a visitor sees it (owner phone/WhatsApp removed). */
export function roommateForViewer(listing, { viewerId = null, isAdmin = false } = {}) {
    if (!listing || !isRoommateContactClosed(listing)) return listing;
    if (isAdmin || sameId(listing.userId, viewerId)) return listing;

    const owner = listing.userId && typeof listing.userId === "object"
        ? { ...listing.userId, phoneNumber: "", whatsappNumber: "" }
        : listing.userId;

    return {
        ...listing,
        userId: owner,
        whatsappNumber: "",
        phoneNumber: "",
        contactVerified: { phone: false, whatsapp: false },
        contactHidden: true,
    };
}
