// src/Apps/vehicles/vehicleFormat.js
// Display helpers shared by the vehicles pages.

import moroccanCities from "../../data/moroccanCities";

export const optionLabel = (t, group, value) =>
    value ? t(`vehiclesApp.options.${group}.${value}`, String(value).replace(/_/g, " ")) : "";

export const optionList = (t, group, values) => values.map((value) => ({ value, label: optionLabel(t, group, value) }));

const numberFormat = (language) => new Intl.NumberFormat(String(language || "fr").startsWith("ar") ? "ar-MA" : "fr-MA");

export function formatNumber(value, language) {
    if (value === null || value === undefined || value === "") return "";
    return numberFormat(language).format(Number(value));
}

/** "185 000 MAD" or "300 MAD / day". */
export function formatVehiclePrice(vehicle, t, language) {
    if (!vehicle?.price) return t("vehiclesApp.price.onRequest", "Price on request");
    const amount = `${formatNumber(vehicle.price, language)} ${t("vehiclesApp.price.currency", "MAD")}`;
    return vehicle.listingType === "rent" ? t("vehiclesApp.price.perDay", "{{amount}} / day", { amount }) : amount;
}

export function formatCity(vehicle, language) {
    const city = moroccanCities.find((item) => item.en.toLowerCase() === String(vehicle?.city || "").toLowerCase());
    const name = city && String(language).startsWith("ar") ? city.ar || city.en : vehicle?.city;
    return [vehicle?.neighborhood, name].filter(Boolean).join(", ");
}

export function formatDate(value, language) {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    return date.toLocaleDateString(String(language || "fr").startsWith("ar") ? "ar-MA" : language, {
        year: "numeric",
        month: "long",
        day: "numeric",
    });
}

export const vehicleName = (vehicle) => [vehicle?.make, vehicle?.model].filter(Boolean).join(" ");

export const STATUS_TONES = { Available: "success", Sold: "error", Rented: "warning", Inactive: "default" };

export function getYoutubeVideoId(url) {
    try {
        const parsed = new URL(url);
        const host = parsed.hostname.toLowerCase().replace(/^www\./, "");
        let id = "";
        if (host === "youtu.be") id = parsed.pathname.slice(1).split("/")[0];
        else if (["youtube.com", "m.youtube.com", "youtube-nocookie.com"].includes(host)) {
            if (parsed.pathname === "/watch") id = parsed.searchParams.get("v") || "";
            else if (/^\/(embed|shorts)\//.test(parsed.pathname)) id = parsed.pathname.split("/")[2] || "";
        }
        return /^[a-zA-Z0-9_-]{11}$/.test(id) ? id : null;
    } catch {
        return null;
    }
}
