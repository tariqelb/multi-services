// admin/components/shared/analyticsUtils.js
// Formatting helpers shared by every dashboard section.

export const RANGE_OPTIONS = [
    { value: "7d", key: "last7Days", fallback: "Last 7 days" },
    { value: "30d", key: "last30Days", fallback: "Last 30 days" },
    { value: "90d", key: "last90Days", fallback: "Last 90 days" },
    { value: "365d", key: "last12Months", fallback: "Last 12 months" },
    { value: "all", key: "allTime", fallback: "All time" },
];

export const CHART_COLORS = [
    "#2563EB",
    "#16A34A",
    "#F59E0B",
    "#9333EA",
    "#EC4899",
    "#0891B2",
    "#EA580C",
    "#64748B",
];

export const getLocale = (language) => {
    const locales = {
        en: "en-GB",
        fr: "fr-FR",
        ar: "ar-MA",
    };

    return locales[language?.split("-")[0]] || "en-GB";
};

export const formatNumber = (value, locale) =>
    new Intl.NumberFormat(locale).format(Number(value) || 0);

export const formatCompact = (value, locale) =>
    new Intl.NumberFormat(locale, {
        notation: "compact",
        maximumFractionDigits: 1,
    }).format(Number(value) || 0);

export const formatPercent = (value, locale) =>
    `${new Intl.NumberFormat(locale, {
        maximumFractionDigits: 1,
    }).format(Number(value) || 0)}%`;

export const formatDecimal = (value, locale, digits = 1) =>
    new Intl.NumberFormat(locale, {
        maximumFractionDigits: digits,
    }).format(Number(value) || 0);

export const formatPrice = (value, locale, currency = "MAD") =>
    value
        ? `${formatNumber(Math.round(value), locale)} ${currency}`
        : "—";

export function formatDuration(seconds = 0) {
    const total = Math.max(0, Math.floor(Number(seconds) || 0));
    const hours = Math.floor(total / 3600);
    const minutes = Math.floor((total % 3600) / 60);
    const remaining = total % 60;

    if (hours > 0) return `${hours}h ${minutes}m`;
    if (minutes > 0) return `${minutes}m ${remaining}s`;

    return `${remaining}s`;
}

export const formatDateTime = (date, locale) => {
    if (!date) return "—";

    const parsed = new Date(date);

    if (Number.isNaN(parsed.getTime())) return "—";

    return new Intl.DateTimeFormat(locale, {
        dateStyle: "medium",
        timeStyle: "short",
    }).format(parsed);
};

export const formatDate = (date, locale) => {
    if (!date) return "—";

    const parsed = new Date(date);

    if (Number.isNaN(parsed.getTime())) return "—";

    return new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(
        parsed
    );
};

export const formatTime = (date, locale) => {
    if (!date) return "—";

    return new Intl.DateTimeFormat(locale, {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
    }).format(new Date(date));
};

// Bucket keys from the API: "YYYY-MM-DD" (days) or "YYYY-MM" (months).
export const formatBucketLabel = (key, locale) => {
    if (!key) return "";

    if (key.length === 7) {
        return new Intl.DateTimeFormat(locale, {
            month: "short",
            year: "2-digit",
        }).format(new Date(`${key}-15T12:00:00`));
    }

    return new Intl.DateTimeFormat(locale, {
        month: "short",
        day: "numeric",
    }).format(new Date(`${key}T12:00:00`));
};

export const formatHour = (hour) => `${String(hour).padStart(2, "0")}h`;

export const getFullName = (person) =>
    `${person?.firstName || ""} ${person?.lastName || ""}`.trim();

export const getInitials = (name = "") =>
    name
        .split(/\s+/)
        .filter(Boolean)
        .map((part) => part[0])
        .join("")
        .slice(0, 2)
        .toUpperCase() || "?";

// Translate API values such as "For Sale" with a safe fallback.
export const translateValue = (t, namespace, value) => {
    if (!value) return t("analytics.unknown", "Unknown");

    const key = String(value)
        .toLowerCase()
        .replace(/[\s-]+/g, "_");

    return t(`${namespace}.${key}`, value);
};

// Highest value in a list (for proportional progress bars).
export const maxOf = (items = [], key) =>
    items.reduce((max, item) => Math.max(max, Number(item[key]) || 0), 0);
