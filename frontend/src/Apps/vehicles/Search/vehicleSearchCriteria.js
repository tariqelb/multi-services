// src/Apps/vehicles/Search/vehicleSearchCriteria.js
// Vehicle search criteria: defaults and option lists (same idea as the
// property search, for cars, motos & bikes and spare parts).

export const EMPTY_CRITERIA = {
    services: [],
    city: "",
    transaction: "",
    make: "",
    model: "",
    condition: "",
    fuel: "",
    minYear: "",
    partCategory: "",
    priceMode: "",
    price: "",
    priceMax: "",
    q: "",
    sort: "mixed",
};

export const SERVICES = ["car", "moto", "part"];

const THIS_YEAR = new Date().getFullYear();
export const YEAR_OPTIONS = [0, 2, 5, 8, 10, 15, 20].map((back) => THIS_YEAR - back);

/** Criteria that are not the default (badge on the panel). */
export function countActive(criteria) {
    return [
        criteria.services.length > 0,
        criteria.city,
        criteria.transaction,
        criteria.make,
        criteria.model,
        criteria.condition,
        criteria.fuel,
        criteria.minYear,
        criteria.partCategory,
        criteria.priceMode && (criteria.price !== "" || criteria.priceMax !== ""),
        criteria.q,
    ].filter(Boolean).length;
}

/** Which kinds the chosen services allow (to show only useful fields). */
export function possibleKinds(criteria) {
    const chosen = criteria.services.length ? criteria.services : SERVICES;
    return {
        vehicles: chosen.includes("car") || chosen.includes("moto"),
        parts: chosen.includes("part"),
        onlyMotos: chosen.length === 1 && chosen[0] === "moto",
    };
}
