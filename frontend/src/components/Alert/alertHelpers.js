
import moroccanCities from "../../data/moroccanCities";

export const API_URLS = {
    property: "/property/alerts",
    roommate: "/roommate/alerts",
};

export const ALERT_TYPES = {
    PROPERTY: "property",
    ROOMMATE: "roommate",
};

export const cities = moroccanCities.map((city) => ({
    english: String(city.en || "").trim(),
    arabic: String(city.ar || "").trim(),
}));

export const getCanonicalCity = (value) => {
    const input = String(value || "").trim();

    if (!input) return "";

    const matchedCity = cities.find(
        (city) =>
            city.english.toLowerCase() === input.toLowerCase() ||
            city.arabic === input
    );

    return matchedCity?.english || input;
};

export const getCityLabel = (value, language = "en") => {
    const canonicalCity = getCanonicalCity(value);

    const matchedCity = cities.find(
        (city) =>
            city.english.toLowerCase() ===
            canonicalCity.toLowerCase()
    );

    if (!matchedCity) return canonicalCity;

    return language.startsWith("ar")
        ? matchedCity.arabic || matchedCity.english
        : matchedCity.english;
};

export const filterCityOptions = (options, { inputValue }) => {
    const search = inputValue.trim().toLowerCase();

    if (!search) return options;

    return options.filter((city) =>
        city.english.toLowerCase().includes(search) ||
        city.arabic.toLowerCase().includes(search)
    );
};

export const propertyTypes = [
    "Apartment",
    "House",
    "Villa",
    "Studio",
    "Room",
    "Store",
    "Office",
    "Land",
    "Warehouse",
    "Commercial space",
    "Commercial store",
    "Garage",
    "Other",
];

export const roommatePropertyTypes = [
    "Apartment",
    "House",
    "Villa",
    "Studio",
    "Room",
    "Other",
];

export const listingTypeOptions = ["For Sale", "For Rent"];

export const roommatePurposeOptions = [
    "Share My Property",
    "Find a Room",
    "Rent Together",
];

export const rentalPeriodOptions = ["Daily", "Monthly"];

export const propertyTypeTranslationKeys = {
    Apartment: "apartment",
    House: "house",
    Villa: "villa",
    Studio: "studio",
    Room: "room",
    Store: "store",
    Office: "office",
    Land: "land",
    Warehouse: "warehouse",
    "Commercial space": "commercialSpace",
    "Commercial store": "commercialStore",
    Garage: "garage",
    Other: "other",
};

export const sameArray = (first = [], second = []) =>
    first.length === second.length &&
    first.every((item) => second.includes(item));
