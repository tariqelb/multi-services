// src/Apps/vehicles/Profile/profileHelpers.js
// Dates, images and names for the vehicle profile pages.

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