// src/Apps/Property/Search/searchCriteria.js
// Search criteria: defaults and option lists.

export const EMPTY_CRITERIA = {
    services: [],
    city: "",
    transaction: "",
    rentalPeriod: "",
    propertyType: "",
    accommodationType: "",
    priceMode: "",
    price: "",
    priceMax: "",
    minRooms: "",
    q: "",
    sort: "mixed",
};

export const SERVICES = ["unfurnished", "furnished", "roommate", "establishment"];

export const PROPERTY_TYPES = [
    ["Apartment", "apartment"],
    ["House", "house"],
    ["Villa", "villa"],
    ["Studio", "studio"],
    ["Room", "room"],
    ["Store", "store"],
    ["Office", "office"],
    ["Land", "land"],
    ["Warehouse", "warehouse"],
    ["Commercial space", "commercialSpace"],
    ["Commercial store", "commercialStore"],
    ["Garage", "garage"],
];

export const ACCOMMODATION_TYPES = ["Hotel", "Riad", "Guesthouse", "Hostel", "Aparthotel"];

/** Criteria that are not the default (badge on the panel). */
export function countActive(criteria) {
    return [
        criteria.services.length > 0,
        criteria.city,
        criteria.transaction,
        criteria.rentalPeriod,
        criteria.propertyType,
        criteria.accommodationType,
        criteria.priceMode && (criteria.price !== "" || criteria.priceMax !== ""),
        criteria.minRooms,
        criteria.q,
    ].filter(Boolean).length;
}
