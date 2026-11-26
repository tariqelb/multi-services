// admin/components/shared/analyticsUtils.js
// Formatting helpers shared by every dashboard section.

import moroccanCities from "../../data/moroccanCities";

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

// Shared labels used when a section has no label of its own.
const PROPERTY_TYPE_KEYS = {
    apartment: "apartment",
    house: "house",
    villa: "villa",
    studio: "studio",
    room: "room",
    store: "store",
    office: "office",
    land: "land",
    warehouse: "warehouse",
    commercial_space: "commercialSpace",
    commercial_store: "commercialStore",
    garage: "garage",
    other: "other",
};

const SHARED_VALUE_KEYS = {
    for_sale: "properties.card.forSale",
    for_rent: "properties.card.forRent",
    roommate: "analytics.kinds.roommate",
    roommates: "analytics.kinds.roommate",
    establishment: "analytics.kinds.establishment",
    establishments: "analytics.kinds.establishment",
    property: "analytics.kinds.property",
    properties: "analytics.kinds.property",
};

const isUnknown = (value) =>
    !value || ["unknown", "n/a", "null", "undefined", "other city"].includes(String(value).trim().toLowerCase());

// Translate API values such as "For Sale" with a safe fallback:
// section key -> shared label (property types, listing types) -> raw value.
export const translateValue = (t, namespace, value) => {
    if (isUnknown(value)) return t("analytics.unknown", "Unknown");

    const key = String(value)
        .toLowerCase()
        .replace(/[\s-]+/g, "_");

    const keys = [`${namespace}.${key}`];

    if (PROPERTY_TYPE_KEYS[key]) keys.push(`properties.categories.${PROPERTY_TYPE_KEYS[key]}`);
    if (SHARED_VALUE_KEYS[key]) keys.push(SHARED_VALUE_KEYS[key]);

    return t(keys, { defaultValue: value });
};

// City names from the API: Arabic name in Arabic, "Unknown" translated.
const CITY_LOOKUP = new Map();

const cityKey = (value) =>
    String(value ?? "")
        .trim()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase();

const CITY_ALIASES = [
    ["tangier", "tanger", "tanja"],
    ["marrakesh", "marrakech"],
    ["fez", "fes"],
    ["casablanca", "casa"],
];

moroccanCities.forEach((city) => CITY_LOOKUP.set(cityKey(city.en), city));

export const translateCity = (t, language, value) => {
    if (isUnknown(value)) return t("analytics.unknown", "Unknown");

    const key = cityKey(value);
    const candidates = CITY_ALIASES.find((group) => group.includes(key)) || [key];
    const city = candidates.map((name) => CITY_LOOKUP.get(name)).find(Boolean);

    if (!city) return value;

    return String(language || "").startsWith("ar") ? city.ar || city.en : city.en;
};

// Chart rows [{ name, value }] with translated city names (same names merged).
export const translateCityRows = (t, language, rows = []) => {
    const merged = new Map();

    rows.forEach((row) => {
        const name = translateCity(t, language, row.name);
        const previous = merged.get(name);

        merged.set(
            name,
            previous
                ? Object.fromEntries(
                    Object.entries(row).map(([field, fieldValue]) => [
                        field,
                        typeof fieldValue === "number" ? (previous[field] || 0) + fieldValue : previous[field],
                    ])
                )
                : { ...row, name }
        );
    });

    return [...merged.values()];
};

// Highest value in a list (for proportional progress bars).
export const maxOf = (items = [], key) =>
    items.reduce((max, item) => Math.max(max, Number(item[key]) || 0), 0);
