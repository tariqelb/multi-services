export const formatNumber = (value, locale = "en-US") => {
    return Number(value || 0).toLocaleString(locale);
};

export const formatDate = (date, locale = "en-US") => {
    if (!date) return "—";

    const parsedDate = new Date(date);

    return Number.isNaN(parsedDate.getTime())
        ? "—"
        : parsedDate.toLocaleString(locale);
};

export const formatPrice = (price, locale = "en-US") => {
    if (price == null) return "—";

    return `${Number(price).toLocaleString(locale)} MAD`;
};