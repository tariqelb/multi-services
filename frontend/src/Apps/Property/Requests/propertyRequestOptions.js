// src/Apps/Property/Requests/propertyRequestOptions.js
//
// Property requests ("I am looking for a property"): option lists, paths,
// labels and the form prefill from a search. The backend has the same lists
// in backend/apps/property/utils/requestOptions.js.

import i18next from "i18next";
import moroccanCities from "../../../data/moroccanCities";

export const PROPERTY_TRANSACTIONS = ["rent", "furnished", "buy"];
export const PROPERTY_TYPES = [
    "Apartment", "House", "Villa", "Studio", "Room", "Store", "Office", "Land",
    "Warehouse", "Commercial space", "Commercial store", "Garage", "Other",
];
export const PROPERTY_FEATURES = ["parking", "elevator", "terrace", "garden", "pool", "airConditioning", "seaView", "petsAllowed"];
export const CLOSE_REASONS = ["found", "notNeeded", "other"];
export const MAX_ACTIVE_REQUESTS = 5;

/** API: /api/property/requests. Pages: /requests. */
export const REQUEST_API = "/property/requests";
export const REQUEST_BASE = "/requests";
export const requestPath = (request) => `${REQUEST_BASE}/${request?.id || request?._id}`;
/** Where my requests are listed (My Publication > Requests). */
export const MY_REQUESTS_PATH = "/mypublication?tab=requests";

export const REQUEST_COLOR = "#2563EB";

const formatNumber = (value, language) =>
    new Intl.NumberFormat(String(language || "fr").startsWith("ar") ? "ar-MA" : "fr-MA").format(Number(value));

/** Label helpers (all keys under "requests."). */
export const transactionLabel = (t, request) => t(`requests.transactions.property.${request.transaction}`, request.transaction || "");
export const propertyTypeLabel = (t, type) => t(`requests.types.${type}`, type);

/** "Apartment, Studio" */
export const requestWhat = (t, request) =>
    (request.propertyTypes || []).map((type) => propertyTypeLabel(t, type)).join(", ") || t("requests.anyProperty", "Any property");

/** City name in Arabic when the app is in Arabic. */
export function cityName(_t, city) {
    const arabic = String(i18next.resolvedLanguage || i18next.language || "").startsWith("ar");
    const found = arabic ? moroccanCities.find((item) => item.en === city) : null;
    return found?.ar || city || "";
}

/** "Apartment, Studio to rent in Agadir" */
export function requestTitle(t, request) {
    return t("requests.title", "{{what}} {{transaction}} in {{city}}", {
        what: requestWhat(t, request),
        transaction: transactionLabel(t, request),
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
    return [
        request.minRooms ? t("requests.facts.rooms", "{{count}}+ rooms", { count: request.minRooms }) : "",
        request.minSurface ? t("requests.facts.surface", "{{count}}+ m²", { count: request.minSurface }) : "",
        request.moveInDate ? t("requests.facts.moveIn", "From {{date}}", { date: new Date(request.moveInDate).toLocaleDateString(language) }) : "",
        ...(request.features || []).map((feature) => t(`requests.features.${feature}`, feature)),
    ].filter(Boolean);
}

/** Price of a listing proposed in a reply. */
export const listingPrice = (listing, t, language) => {
    if (listing.price === null || listing.price === undefined) return "";
    const unit = { day: t("requests.details.perDay", "/ day"), month: t("requests.details.perMonth", "/ month") }[listing.priceUnit] || "";
    return `${formatNumber(listing.price, language)} ${t("requests.mad", "MAD")} ${unit}`.trim();
};

/** Days left before the request expires (0 when expired). */
export const daysLeft = (request) => Math.max(0, Math.ceil((new Date(request.expiresAt) - Date.now()) / 86400000));

/* --------------------------------------------------
   Prefill: the form's query (?city=&transaction=&types=...) from the
   property search's criteria, so "Post a request" opens with what the user
   was searching for.
-------------------------------------------------- */

const PROPERTY_TYPE_OF = {
    apartment: "Apartment", house: "House", villa: "Villa", studio: "Studio", room: "Room", store: "Store", office: "Office",
    land: "Land", warehouse: "Warehouse", commercialspace: "Commercial space", commercialstore: "Commercial store", garage: "Garage",
};

const budgetOf = (criteria) =>
    criteria.priceMode === "between" ? criteria.priceMax : ["below", "exact"].includes(criteria.priceMode) ? criteria.price : "";

export function propertyRequestQuery(criteria = {}) {
    const onlyFurnished = criteria.services?.length === 1 && criteria.services[0] === "furnished";
    const query = new URLSearchParams();
    if (criteria.city) query.set("city", criteria.city);
    if (criteria.transaction === "sale") query.set("transaction", "buy");
    else if (onlyFurnished) query.set("transaction", "furnished");
    else if (criteria.transaction === "rent") query.set("transaction", "rent");
    const type = PROPERTY_TYPE_OF[String(criteria.propertyType || "").toLowerCase()] || (criteria.propertyType && Object.values(PROPERTY_TYPE_OF).includes(criteria.propertyType) ? criteria.propertyType : "");
    if (type) query.set("types", type);
    if (budgetOf(criteria)) query.set("budgetMax", budgetOf(criteria));
    if (criteria.minRooms) query.set("minRooms", criteria.minRooms);
    return query.toString();
}
