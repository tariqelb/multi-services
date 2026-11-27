// src/Apps/DailyWorker/workerFormat.js
//
// Texts shown for a worker: price, cities, days, availability.

import moroccanCities from "../../data/moroccanCities";

const DAY_KEYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];

export const formatNumber = (value, lang) => {
    try {
        return new Intl.NumberFormat(lang === "ar" ? "ar-MA" : lang === "fr" ? "fr-MA" : "en-US").format(value);
    } catch {
        return String(value);
    }
};

export function cityName(city, lang) {
    const found = moroccanCities.find((item) => item.en.toLowerCase() === String(city || "").toLowerCase());
    return found && lang === "ar" ? found.ar || found.en : city || "";
}

/** "250 MAD / day", "From 300 MAD per job", "On quote"... */
export function priceText(t, offer, lang) {
    if (!offer) return "";
    const amount = offer.price != null ? `${formatNumber(offer.price, lang)} ${t("workersApp.price.currency", "MAD")}` : "";
    switch (offer.priceType) {
        case "day":
            return t("workersApp.price.perDay", "{{amount}} / day", { amount });
        case "hour":
            return t("workersApp.price.perHour", "{{amount}} / hour", { amount });
        case "m2":
            return t("workersApp.price.perM2", "{{amount}} / m²", { amount });
        case "task":
            return amount ? t("workersApp.price.taskFrom", "From {{amount}} per job", { amount }) : t("workersApp.price.task", "Price per job");
        default:
            return t("workersApp.price.quote", "On quote");
    }
}

/** "All of Morocco" or "Agadir, Inezgane +3". */
export function coverageText(t, worker, lang, max = 3) {
    if (worker?.coverage === "morocco") return t("workersApp.coverage.morocco", "All of Morocco");
    const cities = (worker?.cities?.length ? worker.cities : [worker?.baseCity]).filter(Boolean);
    const total = worker?.citiesCount || cities.length;
    const shown = cities.slice(0, max).map((city) => cityName(city, lang));
    return total > shown.length ? `${shown.join(", ")} +${total - shown.length}` : shown.join(", ");
}

export const dayLabel = (t, day) =>
    t(`workersApp.days.${day}`, { mon: "Mon", tue: "Tue", wed: "Wed", thu: "Thu", fri: "Fri", sat: "Sat", sun: "Sun" }[day] || day);

/** "Every day", "Mon – Sat", or "Mon, Wed, Fri". */
export function daysText(t, days = []) {
    const sorted = DAY_KEYS.filter((day) => days.includes(day));
    if (!sorted.length) return "";
    if (sorted.length === 7) return t("workersApp.days.everyDay", "Every day");
    const first = DAY_KEYS.indexOf(sorted[0]);
    const consecutive = sorted.every((day, index) => DAY_KEYS.indexOf(day) === first + index);
    if (consecutive && sorted.length >= 3) return `${dayLabel(t, sorted[0])} – ${dayLabel(t, sorted[sorted.length - 1])}`;
    return sorted.map((day) => dayLabel(t, day)).join(", ");
}

export const hoursText = (hours) => (hours?.start && hours?.end ? `${hours.start} – ${hours.end}` : "");

export function formatDate(value, lang) {
    if (!value) return "";
    try {
        return new Intl.DateTimeFormat(lang === "ar" ? "ar-MA" : lang === "fr" ? "fr-FR" : "en-GB", { day: "numeric", month: "short" }).format(new Date(value));
    } catch {
        return "";
    }
}

/** { label, tone } of the availability badge. */
export function availabilityBadge(t, availability, lang) {
    if (!availability || availability.availableNow) return { label: t("workersApp.availability.available", "Available"), tone: "success" };
    if (availability.busyUntil) {
        return {
            label: t("workersApp.availability.busyUntil", "Busy until {{date}}", { date: formatDate(availability.busyUntil, lang) }),
            tone: "warning",
        };
    }
    return { label: t("workersApp.availability.busy", "Busy"), tone: "warning" };
}

export const paymentTimingLabel = (t, value) =>
    ({
        daily: t("workersApp.payment.daily", "Paid at the end of each day"),
        end: t("workersApp.payment.end", "Paid when the job is finished"),
        agreed: t("workersApp.payment.agreed", "Payment as agreed"),
    })[value] || "";

export const materialsLabel = (t, value) =>
    ({
        client: t("workersApp.materials.client", "Client buys the materials"),
        included: t("workersApp.materials.included", "Materials included"),
        either: t("workersApp.materials.either", "Materials: either way"),
    })[value] || "";

export const languageLabel = (t, value) =>
    ({ ar: t("workersApp.languages.ar", "Arabic"), fr: t("workersApp.languages.fr", "French"), en: t("workersApp.languages.en", "English") })[value] || value;

export const experienceText = (t, years) =>
    years > 0 ? t("workersApp.experience.years", "{{count}} years of experience", { count: years }) : t("workersApp.experience.beginner", "Starting out");

export const fullName = (worker) => [worker?.firstName, worker?.lastName].filter(Boolean).join(" ");

export const workplaceLabel = (t, kind) =>
    ({
        workshop: t("workersApp.workplace.workshop", "Workshop"),
        shop: t("workersApp.workplace.shop", "Shop"),
        garage: t("workersApp.workplace.garage", "Garage"),
    })[kind] || t("workersApp.workplace.place", "Workplace");

export const genderLabel = (t, gender) =>
    ({ male: t("workersApp.gender.male", "Man"), female: t("workersApp.gender.female", "Woman") })[gender] || "";
