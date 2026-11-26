// Date / locale helpers for the External Listing Sources page.

export function getLocale(language) {
    const lang = (language || "en").split("-")[0];
    return { en: "en-GB", fr: "fr-FR", ar: "ar-MA" }[lang] || "en-GB";
}

export function formatDate(value, locale) {
    if (!value) return "—";

    try {
        return new Intl.DateTimeFormat(locale, {
            dateStyle: "medium",
            timeStyle: "short",
        }).format(new Date(value));
    } catch {
        return "—";
    }
}
