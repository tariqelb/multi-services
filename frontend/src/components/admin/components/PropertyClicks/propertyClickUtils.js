
export const formatDate = (date, locale = "en-US") => {
    if (!date) return "N/A";

    return new Date(date).toLocaleString(locale);
};

export const formatPrice = (price, locale = "en-US") => {
    if (price === undefined || price === null) return "N/A";

    return new Intl.NumberFormat(locale, {
        style: "currency",
        currency: "MAD",
        maximumFractionDigits: 0,
    }).format(price);
};

export const formatNumber = (number, locale = "en-US") => {
    return new Intl.NumberFormat(locale).format(number || 0);
};
