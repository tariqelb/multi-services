// src/Apps/vehicles/Search/vehicleSearchFormat.js
// Labels shared by the vehicle search cards, the map tooltips and the side panel.

import { formatCity as formatVehicleCity, formatNumber, optionLabel } from "../vehicleFormat";
import { compatibilityLabel } from "../SpareParts/sparePartOptions";

export const KIND_COLORS = {
    car: "#2563EB",
    moto: "#EA580C",
    part: "#0D9488",
};

export const formatCity = (result, language) => formatVehicleCity(result, language);

export function formatPrice(result, t, language) {
    if (result.price === null || result.price === undefined) {
        return t("vehiclesApp.price.onRequest", "Price on request");
    }

    const amount = `${formatNumber(result.price, language)} ${t("vehiclesApp.price.currency", "MAD")}`;
    if (result.priceUnit === "day") return t("vehiclesApp.price.perDay", "{{amount}} / day", { amount });
    if (result.priceUnit === "each") return `${amount} ${t("vehiclesApp.parts.perUnit", "each")}`;
    return amount;
}

/** Offer / type line: "For sale · SUV", "Brakes · Car"... */
export function formatType(result, t) {
    const details = result.details || {};

    if (result.kind === "part") {
        return [optionLabel(t, "partCategory", details.partCategory), optionLabel(t, "partVehicleType", details.vehicleType)]
            .filter(Boolean)
            .join(" · ");
    }

    return [
        optionLabel(t, "listingType", result.listingType),
        result.kind === "moto" ? optionLabel(t, "motoType", details.motoType) : "",
    ]
        .filter(Boolean)
        .join(" · ");
}

/** Small facts: year, mileage, fuel... or fits, condition, brand. */
export function formatFacts(result, t, language) {
    const details = result.details || {};

    if (result.kind === "part") {
        return [
            compatibilityLabel(details, t),
            optionLabel(t, "partCondition", details.condition),
            details.brand,
        ].filter(Boolean);
    }

    return [
        [details.make, details.model].filter(Boolean).join(" "),
        details.year ? String(details.year) : "",
        details.mileage ? `${formatNumber(details.mileage, language)} km` : "",
        optionLabel(t, "fuel", details.fuel === "none" ? "" : details.fuel),
        optionLabel(t, "transmission", details.transmission),
    ].filter(Boolean);
}
