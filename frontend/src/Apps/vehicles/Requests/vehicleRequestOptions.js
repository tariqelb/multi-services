// src/Apps/vehicles/Requests/vehicleRequestOptions.js
//
// Vehicle requests ("I am looking for a car, a moto or a spare part"):
// option lists, paths, labels and the form prefill from a search. The
// backend has the same lists in backend/apps/vehicles/utils/requestOptions.js.

import { formatNumber } from "../vehicleFormat";
import i18next from "i18next";
import moroccanCities from "../../../data/moroccanCities";

export const VEHICLE_CATEGORIES = ["car", "moto", "part"];
export const VEHICLE_TRANSACTIONS = ["buy", "rent"];
export const VEHICLE_FUELS = ["diesel", "petrol", "hybrid", "plug_in_hybrid", "electric", "lpg"];
export const VEHICLE_TRANSMISSIONS = ["manual", "automatic"];
export const PART_CATEGORIES = [
    "engine", "transmission", "brakes", "suspension", "electrical", "lighting", "body",
    "interior", "wheels", "exhaust", "cooling", "filters", "accessories", "other",
];
export const CLOSE_REASONS = ["found", "notNeeded", "other"];
export const MAX_ACTIVE_REQUESTS = 5;

/** API: /api/vehicles/requests. Pages: /vehicles/requests. */
export const REQUEST_API = "/vehicles/requests";
export const REQUEST_BASE = "/vehicles/requests";
export const requestPath = (request) => `${REQUEST_BASE}/${request?.id || request?._id}`;
/** Where my requests are listed (My vehicles > Requests). */
export const MY_REQUESTS_PATH = "/vehicles/mine?section=requests";

export const REQUEST_COLOR = "#EA580C";

/** Label helpers (all keys under "requests."). */
export const transactionLabel = (t, request) => t(`requests.transactions.vehicle.${request.transaction}`, request.transaction || "");
export const categoryLabel = (t, category) => t(`requests.categories.${category}`, category);

/** "Dacia Logan" / "Brake pads · Dacia Logan" */
export function requestWhat(t, request) {
    const vehicle = [request.make, request.model].filter(Boolean).join(" ");
    if (request.vehicleCategory === "part") {
        return [request.partName || categoryLabel(t, "part"), vehicle].filter(Boolean).join(" · ");
    }
    return vehicle || categoryLabel(t, request.vehicleCategory);
}

/** City name in Arabic when the app is in Arabic. */
export function cityName(_t, city) {
    const arabic = String(i18next.resolvedLanguage || i18next.language || "").startsWith("ar");
    const found = arabic ? moroccanCities.find((item) => item.en === city) : null;
    return found?.ar || city || "";
}

/** "Dacia Logan to buy in Agadir" */
export function requestTitle(t, request) {
    return t("requests.title", "{{what}} {{transaction}} in {{city}}", {
        what: requestWhat(t, request),
        transaction: request.vehicleCategory === "part" ? "" : transactionLabel(t, request),
        city: cityName(t, request.city),
    }).replace(/\s+/g, " ");
}

export function budgetLabel(t, request, language) {
    const min = request.budgetMin;
    const max = request.budgetMax;
    const money = (value) => `${formatNumber(value, language)} ${t("requests.mad", "MAD")}`;
    if (min && max) return `${money(min)} – ${money(max)}`;
    if (max) return t("requests.upTo", "Up to {{amount}}", { amount: money(max) });
    if (min) return t("requests.from", "From {{amount}}", { amount: money(min) });
    return t("requests.anyBudget", "Budget open");
}

/** Facts line for cards and details. */
export function requestFacts(t, request, language) {
    const years = request.yearFrom || request.yearTo ? [request.yearFrom || "…", request.yearTo || "…"].join(" – ") : "";
    return [
        request.vehicleCategory !== "part" ? categoryLabel(t, request.vehicleCategory) : request.partCategory ? t(`vehiclesApp.options.partCategory.${request.partCategory}`, request.partCategory) : "",
        years,
        request.maxMileage ? t("requests.facts.mileage", "Max {{km}} km", { km: formatNumber(request.maxMileage, language) }) : "",
        request.fuel ? t(`vehiclesApp.options.fuel.${request.fuel}`, request.fuel) : "",
        request.transmission ? t(`vehiclesApp.options.transmission.${request.transmission}`, request.transmission) : "",
    ].filter(Boolean);
}

/** Price of a listing proposed in a reply. */
export const listingPrice = (listing, t, language) => {
    if (listing.price === null || listing.price === undefined) return "";
    const unit = { day: t("requests.details.perDay", "/ day"), month: t("requests.details.perMonth", "/ month"), each: t("vehiclesApp.parts.perUnit", "each") }[listing.priceUnit] || "";
    return `${formatNumber(listing.price, language)} ${t("requests.mad", "MAD")} ${unit}`.trim();
};

/** Days left before the request expires (0 when expired). */
export const daysLeft = (request) => Math.max(0, Math.ceil((new Date(request.expiresAt) - Date.now()) / 86400000));

/* --------------------------------------------------
   Prefill: the form's query (?category=&city=&make=...) from the vehicle
   search's criteria, so "Post a request" opens with what the user was
   searching for.
-------------------------------------------------- */

const budgetOf = (criteria) =>
    criteria.priceMode === "between" ? criteria.priceMax : ["below", "exact"].includes(criteria.priceMode) ? criteria.price : "";

export function vehicleRequestQuery(criteria = {}) {
    const query = new URLSearchParams();
    const services = criteria.services || [];
    const category = services.length === 1 ? services[0] : criteria.partCategory ? "part" : "";
    if (category) query.set("category", category);
    if (criteria.city) query.set("city", criteria.city);
    if (criteria.transaction === "rent") query.set("transaction", "rent");
    else if (criteria.transaction === "sale") query.set("transaction", "buy");
    if (criteria.make) query.set("make", criteria.make);
    if (criteria.model) query.set("model", criteria.model);
    if (budgetOf(criteria)) query.set("budgetMax", budgetOf(criteria));
    if (category === "part" && criteria.q) query.set("q", criteria.q);
    return query.toString();
}
