export const formatNumber = (value) => {
    return Number(value || 0).toLocaleString();
};

export const formatDate = (date) => {
    if (!date) return "Unknown";

    const parsedDate = new Date(date);

    return Number.isNaN(parsedDate.getTime())
        ? "Unknown"
        : parsedDate.toLocaleString();
};

export const formatPrice = (price) => {
    if (price == null) return "Not specified";

    return `${Number(price).toLocaleString()} MAD`;
};