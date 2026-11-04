export const formatDate = (date) => {
    if (!date) return "N/A";

    return new Date(date).toLocaleString();
};

export const formatPrice = (price) => {
    if (price === undefined || price === null) return "N/A";

    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "MAD",
        maximumFractionDigits: 0,
    }).format(price);
};

export const formatNumber = (number) => {
    return new Intl.NumberFormat("en-US").format(number || 0);
};