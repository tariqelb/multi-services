// src/Apps/Property/Search/searchFormat.js
// Labels shared by the result cards, the map tooltips and the side panel.

import moroccanCities from "../../../data/moroccanCities";

const TYPE_KEYS = {
    apartment: "apartment",
    house: "house",
    villa: "villa",
    studio: "studio",
    room: "room",
    store: "store",
    office: "office",
    land: "land",
    warehouse: "warehouse",
    "commercial space": "commercialSpace",
    "commercial store": "commercialStore",
    garage: "garage",
    other: "other",
};

export const KIND_COLORS = {
    property: "#2563EB",
    furnished: "#7C3AED",
    roommate: "#059669",
    establishment: "#D97706",
};

/** "property" | "furnished" | "roommate" | "establishment" (colour + label). */
export const resultKind = (result) =>
    result.kind === "property" && result.link?.startsWith("/furnishedproperties") ? "furnished" : result.kind;

export function formatPrice(result, t, language) {
    if (result.price === null || result.price === undefined) {
        return t("search.card.priceOnRequest", "Price on request");
    }

    const amount = `${Number(result.price).toLocaleString(language)} ${t("search.card.currency", "MAD")}`;

    const unit = {
        total: "",
        month: t("search.card.perMonth", "/ month"),
        night: t("search.card.perNight", "/ night"),
        person_month: t("search.card.perPersonMonth", "/ person / month"),
    }[result.priceUnit];

    const from = result.kind === "establishment" ? `${t("search.card.from", "From")} ` : "";

    return `${from}${amount}${unit ? ` ${unit}` : ""}`;
}

export function formatType(result, t) {
    if (result.kind === "establishment") {
        return t(`search.accommodationTypes.${String(result.propertyType).toLowerCase()}`, result.propertyType);
    }

    const key = TYPE_KEYS[String(result.propertyType || "").toLowerCase()];
    return key ? t(`properties.categories.${key}`, result.propertyType) : result.propertyType || "";
}

export function formatCity(result, language) {
    const city = moroccanCities.find((item) => item.en.toLowerCase() === String(result.city).toLowerCase());
    const name = city && String(language).startsWith("ar") ? city.ar || city.en : result.city;
    return [result.neighborhood, name].filter(Boolean).join(", ");
}

/** Small facts line: rooms, surface, places left, stars... */
export function formatFacts(result, t) {
    const facts = [];
    const details = result.details || {};

    if (result.kind === "roommate") {
        facts.push(
            details.full
                ? t("search.card.full", "Full")
                : t("search.card.places", "{{count}} place(s) left", { count: details.availablePlaces ?? 0 })
        );
    }

    if (result.kind === "establishment" && details.classification) {
        const stars = String(details.classification).match(/^\d+/)?.[0];
        facts.push(stars ? `${stars}★` : details.classification);
    }

    if (details.rooms) facts.push(t("search.card.rooms", "{{count}} rooms", { count: details.rooms }));
    if (details.surface) facts.push(`${details.surface} m²`);

    return facts;
}
