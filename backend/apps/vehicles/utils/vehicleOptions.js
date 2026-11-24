// backend/apps/vehicles/utils/vehicleOptions.js
//
// Allowed values for a vehicle listing. The frontend has the same lists
// (src/Apps/vehicles/vehicleOptions.js) for the form and the filters.

// Two sections: cars (and vans, pick-ups...) and motos (two / three wheels).
export const CATEGORIES = ["car", "moto"];
export const MOTO_TYPES = ["motorcycle", "scooter", "bicycle", "kick_scooter", "tricycle"];
// Moto types with an engine (bicycles and kick scooters may be electric, or not motorized).
export const MOTORIZED_MOTO_TYPES = ["motorcycle", "scooter", "tricycle"];
export const MOTO_FUELS = ["petrol", "electric"];
export const NON_MOTORIZED_FUELS = ["none", "electric"];

export const PUBLISHER_TYPES = ["owner", "agency", "showroom"];
export const BUSINESS_TYPES = ["agency", "showroom"];

export const LISTING_TYPES = ["sale", "rent"];

// Same rules as properties: Sold only for sale, Rented only for rent.
export const STATUSES_BY_LISTING_TYPE = {
    sale: ["Available", "Sold", "Inactive"],
    rent: ["Available", "Rented", "Inactive"],
};

export const CONDITIONS = ["new", "used"];
export const FUELS = ["diesel", "petrol", "hybrid", "plug_in_hybrid", "electric", "lpg"];
export const ALL_FUELS = [...FUELS, "none"];
export const TRANSMISSIONS = ["manual", "automatic"];
export const BODY_TYPES = ["city_car", "sedan", "suv", "4x4", "estate", "coupe", "convertible", "minivan", "van", "pickup"];
export const COLORS = ["white", "black", "grey", "silver", "blue", "red", "green", "beige", "brown", "yellow", "orange", "other"];
export const ORIGINS = ["morocco", "imported", "foreign_plates"];
export const RENT_INSURANCES = ["third_party", "comprehensive"];
export const MILEAGE_POLICIES = ["unlimited", "limited"];

export const EQUIPMENT = [
    "air_conditioning",
    "automatic_climate",
    "gps",
    "reverse_camera",
    "parking_sensors",
    "bluetooth",
    "carplay_android_auto",
    "cruise_control",
    "sunroof",
    "leather_seats",
    "heated_seats",
    "alloy_wheels",
    "abs",
    "esp",
    "airbags",
    "isofix",
    "keyless",
    "led_lights",
    "four_wheel_drive",
    "start_stop",
];

export const MOTO_EQUIPMENT = [
    "abs",
    "disc_brakes",
    "top_case",
    "side_cases",
    "windshield",
    "alarm",
    "gps",
    "usb_charger",
    "heated_grips",
    "led_lights",
    "suspension",
    "basket",
    "removable_battery",
    "helmet_included",
    "lock_included",
];

export const equipmentFor = (category) => (category === "moto" ? MOTO_EQUIPMENT : EQUIPMENT);

export const MAX_IMAGES = 15;

// Extra details (title + value) a publisher can add.
export const MAX_CUSTOM_FIELDS = 20;
export const CUSTOM_LABEL_MAX = 40;
export const CUSTOM_VALUE_MAX = 120;

export const getAllowedStatuses = (listingType) => STATUSES_BY_LISTING_TYPE[listingType] || ["Available", "Inactive"];

/** Status to keep when the listing type changes (Sold <-> Rented make no sense). */
export const statusForListingType = (listingType, status) =>
    getAllowedStatuses(listingType).includes(status) ? status : "Available";
