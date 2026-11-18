const API_BASE_URL =
    import.meta.env.VITE_API_URL || "http://localhost:3000";

const localeMap = {
    en: "en-GB",
    fr: "fr-FR",
    ar: "ar-MA",
};

export function getLocale(language = "en") {
    const shortLanguage = language?.split("-")[0] || "en";
    return localeMap[shortLanguage] || "en-GB";
}

export function formatDate(date, language = "en") {
    if (!date) return "";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) return "";

    return new Intl.DateTimeFormat(getLocale(language), {
        day: "numeric",
        month: "long",
        year: "numeric",
    }).format(parsedDate);
}

export function formatPrice(price, language = "en") {
    if (price === null || price === undefined || price === "") return "";

    const numericPrice = Number(price);

    if (Number.isNaN(numericPrice)) return String(price);

    return new Intl.NumberFormat(getLocale(language), {
        maximumFractionDigits: 0,
    }).format(numericPrice);
}

export function getImageUrl(image) {
    if (!image) return null;

    const path =
        typeof image === "string"
            ? image
            : image.path || image.url || image.filename;

    if (!path || typeof path !== "string") return null;

    if (path.startsWith("http://") || path.startsWith("https://")) {
        return path;
    }

    if (path.startsWith("blob:") || path.startsWith("data:")) {
        return path;
    }

    return `${API_BASE_URL.replace(/\/$/, "")}/${path.replace(/^\//, "")}`;
}

export function getPropertyId(property) {
    return property?._id || property?.id || null;
}

export function getPropertyImage(property) {
    const image = property?.images?.[0];

    return getImageUrl(image);
}

export function getRoommateId(listing) {
    return listing?._id || listing?.id || null;
}

export function getRoommateImage(listing) {
    return (
        getImageUrl(listing?.images?.[0]) ||
        getImageUrl(listing?.image) ||
        getImageUrl(listing?.userId?.profileImage) ||
        getImageUrl(listing?.user?.profileImage)
    );
}

export function getEstablishmentId(establishment) {
    return establishment?._id || establishment?.id || null;
}

export function getEstablishmentImage(establishment) {
    return getImageUrl(establishment?.media?.coverPhoto);
}

export function getEstablishmentStartingPrice(establishment) {
    const prices = (establishment?.rooms || [])
        .map((room) => Number(room?.pricePerNight))
        .filter((price) => Number.isFinite(price) && price > 0);

    return prices.length ? Math.min(...prices) : null;
}

export function getUserFullName(user) {
    if (!user) return "";

    const fullName = [user.firstName, user.lastName]
        .filter(Boolean)
        .join(" ")
        .trim();

    return fullName || user.name || user.username || "";
}

export function getReviewAuthor(review) {
    return (
        review?.reviewer ||
        review?.user ||
        review?.userId ||
        review?.author ||
        {}
    );
}