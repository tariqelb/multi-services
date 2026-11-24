// src/Apps/vehicles/vehicleOptions.js
//
// Values allowed for a vehicle listing (same lists as the backend:
// backend/apps/vehicles/utils/vehicleOptions.js). Labels come from translations:
// vehiclesApp.options.<group>.<value>.

// Two sections: cars (and vans, pick-ups...) and motos (two / three wheels).
export const CATEGORIES = ["car", "moto"];
export const MOTO_TYPES = ["motorcycle", "scooter", "bicycle", "kick_scooter", "tricycle"];
export const MOTORIZED_MOTO_TYPES = ["motorcycle", "scooter", "tricycle"];
export const MOTO_FUELS = ["petrol", "electric"];
export const NON_MOTORIZED_FUELS = ["none", "electric"];

/** Cars, motorcycles, scooters and tricycles have an engine; bicycles and kick scooters may not. */
export const isMotorized = (category, motoType) => category !== "moto" || MOTORIZED_MOTO_TYPES.includes(motoType);

export const PUBLISHER_TYPES = ["owner", "agency", "showroom"];
export const BUSINESS_TYPES = ["agency", "showroom"];
export const LISTING_TYPES = ["sale", "rent"];
export const CONDITIONS = ["used", "new"];
export const FUELS = ["diesel", "petrol", "hybrid", "plug_in_hybrid", "electric", "lpg"];
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

export const STATUSES_BY_LISTING_TYPE = {
    sale: ["Available", "Sold", "Inactive"],
    rent: ["Available", "Rented", "Inactive"],
};

export const MAX_IMAGES = 15;
export const DESCRIPTION_MAX = 5000;

// Additional details (title + value) written by the publisher.
export const MAX_CUSTOM_FIELDS = 20;
export const CUSTOM_LABEL_MAX = 40;
export const CUSTOM_VALUE_MAX = 120;

let nextRowId = 0;
export const newCustomRow = (label = "", value = "") => ({ id: `row-${(nextRowId += 1)}`, label, value });

// Make list value for "Other" (then the publisher types the make).
export const OTHER_MAKE = "__other";

// Makes and models common in Morocco. Any other make / model can be typed.
export const VEHICLE_CATALOG = {
    Dacia: ["Logan", "Sandero", "Sandero Stepway", "Duster", "Lodgy", "Dokker", "Spring", "Jogger"],
    Renault: ["Clio", "Megane", "Captur", "Kadjar", "Kangoo", "Express", "Austral", "Arkana", "Symbol", "Talisman", "Koleos"],
    Peugeot: ["208", "2008", "301", "308", "3008", "5008", "508", "Partner", "Rifter", "Expert", "Boxer"],
    Citroen: ["C3", "C3 Aircross", "C4", "C5 Aircross", "C-Elysee", "Berlingo", "Jumpy", "Jumper"],
    Volkswagen: ["Polo", "Golf", "Jetta", "Passat", "T-Roc", "Tiguan", "Touareg", "Caddy", "Amarok", "Transporter"],
    Hyundai: ["i10", "i20", "Accent", "Elantra", "Tucson", "Santa Fe", "Creta", "Kona", "H1"],
    Kia: ["Picanto", "Rio", "Ceed", "Sportage", "Sorento", "Seltos", "Stonic", "Niro"],
    Toyota: ["Yaris", "Corolla", "C-HR", "RAV4", "Land Cruiser", "Prado", "Hilux", "Rush"],
    Fiat: ["Panda", "500", "Tipo", "Doblo", "Fiorino", "Ducato"],
    Ford: ["Fiesta", "Focus", "Kuga", "Puma", "Ranger", "Transit"],
    Skoda: ["Fabia", "Scala", "Octavia", "Kamiq", "Karoq", "Kodiaq", "Superb"],
    Seat: ["Ibiza", "Leon", "Arona", "Ateca", "Tarraco"],
    Opel: ["Corsa", "Astra", "Crossland", "Grandland", "Mokka", "Combo"],
    Nissan: ["Micra", "Qashqai", "Juke", "X-Trail", "Navara"],
    Suzuki: ["Alto", "Celerio", "Swift", "Dzire", "Baleno", "Vitara", "Jimny"],
    Mitsubishi: ["Space Star", "ASX", "Outlander", "Pajero", "L200"],
    "Mercedes-Benz": ["A-Class", "C-Class", "E-Class", "S-Class", "CLA", "GLA", "GLC", "GLE", "G-Class", "Vito", "Sprinter"],
    BMW: ["Series 1", "Series 2", "Series 3", "Series 5", "Series 7", "X1", "X3", "X5", "X6"],
    Audi: ["A1", "A3", "A4", "A6", "Q2", "Q3", "Q5", "Q7", "Q8"],
    "Land Rover": ["Defender", "Discovery", "Discovery Sport", "Range Rover", "Range Rover Evoque", "Range Rover Sport"],
    Jeep: ["Renegade", "Compass", "Wrangler", "Grand Cherokee"],
    MG: ["MG3", "MG ZS", "MG HS", "MG5", "MG4"],
    Chery: ["Tiggo 2", "Tiggo 4", "Tiggo 7", "Tiggo 8", "Arrizo 5"],
    Geely: ["Coolray", "Emgrand", "Tugella"],
    BYD: ["Atto 3", "Dolphin", "Seal", "Song Plus"],
    Honda: ["Jazz", "Civic", "HR-V", "CR-V"],
    Mazda: ["Mazda2", "Mazda3", "CX-3", "CX-5"],
    Porsche: ["911", "Macan", "Cayenne", "Panamera", "Taycan"],
    Tesla: ["Model 3", "Model Y", "Model S", "Model X"],
};

// Motos, scooters, bicycles, kick scooters and tricycles common in Morocco.
export const MOTO_CATALOG = {
    Honda: ["CB125F", "CB500F", "CBR650R", "Africa Twin", "PCX 125", "SH 125", "Forza 350"],
    Yamaha: ["MT-07", "MT-09", "Tracer 9", "YZF-R3", "TMAX", "XMAX", "NMAX"],
    Suzuki: ["GSX-S750", "V-Strom 650", "Burgman 400", "Address 125"],
    Kawasaki: ["Z650", "Z900", "Ninja 400", "Versys 650"],
    BMW: ["R 1250 GS", "F 900 R", "C 400 X"],
    KTM: ["Duke 125", "Duke 390", "Duke 790", "390 Adventure"],
    Ducati: ["Monster", "Scrambler", "Multistrada"],
    "Harley-Davidson": ["Sportster", "Street Bob", "Fat Boy"],
    Triumph: ["Trident 660", "Street Triple", "Tiger 900"],
    "Royal Enfield": ["Classic 350", "Meteor 350", "Himalayan"],
    Benelli: ["TRK 502", "Leoncino 500"],
    Aprilia: ["SR GT", "RS 660", "Tuono 660"],
    Vespa: ["Primavera", "Sprint", "GTS 300"],
    Piaggio: ["Liberty", "Beverly", "MP3"],
    Peugeot: ["Kisbee", "Django", "Tweet", "Pulsion"],
    Kymco: ["Agility", "Like", "People S", "Downtown"],
    SYM: ["Symphony", "Jet 14", "Joymax"],
    MBK: ["Booster", "Nitro", "Ovetto"],
    Docker: [],
    Haojue: [],
    Loncin: [],
    Lifan: [],
    Zongshen: [],
    "Super Soco": ["CUx", "TC Max"],
    NIU: ["NQi", "MQi", "KQi"],
    Xiaomi: ["Electric Scooter 4", "Electric Scooter 4 Pro"],
    "Segway-Ninebot": ["Max G30", "F40", "E2"],
    Decathlon: ["Btwin Riverside", "Rockrider ST 100", "Elops"],
    Giant: [],
    Trek: [],
    Specialized: [],
    Cannondale: [],
    Scott: [],
};

export const MOTO_MAKES = Object.keys(MOTO_CATALOG).sort((a, b) => a.localeCompare(b));

export const VEHICLE_MAKES = Object.keys(VEHICLE_CATALOG).sort((a, b) => a.localeCompare(b));

export const makesFor = (category) => (category === "moto" ? MOTO_MAKES : VEHICLE_MAKES);

export const modelsForMake = (make, category = "car") => {
    const catalog = category === "moto" ? MOTO_CATALOG : VEHICLE_CATALOG;
    const key = Object.keys(catalog).find((item) => item.toLowerCase() === String(make || "").trim().toLowerCase());
    return key ? catalog[key] : [];
};

/** Form values for a new vehicle (every value is what the inputs hold). */
export const EMPTY_VEHICLE_FORM = {
    category: "car",
    motoType: "",
    publisherType: "owner",
    businessName: "",
    businessAddress: "",
    mapLink: "",
    listingType: "sale",
    condition: "used",

    make: "",
    makeOther: false,
    model: "",
    version: "",
    year: "",
    mileage: "",
    fuel: "",
    transmission: "",
    bodyType: "",
    seats: "5",
    doors: "",
    fiscalPower: "",
    engineSize: "",
    engineCc: "",
    rangeKm: "",
    exteriorColor: "",
    interiorColor: "",

    firstHand: false,
    previousOwners: "",
    accidentFree: false,
    serviceHistory: false,
    origin: "",
    vignettePaid: false,
    technicalInspectionUntil: "",
    equipment: [],
    customFields: [],

    price: "",
    negotiable: false,
    creditAvailable: false,
    tradeInAccepted: false,
    insuranceValidUntil: "",

    pricePerDay: "",
    pricePerWeek: "",
    pricePerMonth: "",
    deposit: "",
    minDays: "1",
    insurance: "",
    insuranceExcess: "",
    mileagePolicy: "unlimited",
    kmPerDay: "",
    minDriverAge: "",
    minLicenseYears: "",
    withDriver: false,
    delivery: false,

    title: "",
    description: "",
    city: "",
    neighborhood: "",
    youtubeVideoUrl: "",
    showEmail: false,
};

const asText = (value) => (value === null || value === undefined ? "" : String(value));
const asDate = (value) => (value ? String(value).slice(0, 10) : "");

/** Saved vehicle -> form values (edit mode). */
export function vehicleToForm(vehicle) {
    const form = { ...EMPTY_VEHICLE_FORM };
    for (const key of Object.keys(EMPTY_VEHICLE_FORM)) {
        if (vehicle[key] === undefined) continue;
        form[key] = typeof EMPTY_VEHICLE_FORM[key] === "boolean" ? Boolean(vehicle[key]) : Array.isArray(EMPTY_VEHICLE_FORM[key]) ? [...(vehicle[key] || [])] : asText(vehicle[key]);
    }
    form.technicalInspectionUntil = asDate(vehicle.technicalInspectionUntil);
    form.category = vehicle.category === "moto" ? "moto" : "car";
    form.makeOther = Boolean(vehicle.make) && !makesFor(form.category).includes(vehicle.make);
    form.customFields = (vehicle.customFields || []).map((field) => newCustomRow(field.label, field.value));
    form.businessName = vehicle.business?.name || "";
    form.businessAddress = vehicle.business?.address || "";

    const sale = vehicle.sale || {};
    const rent = vehicle.rent || {};
    if (vehicle.listingType === "rent") {
        form.price = "";
        form.pricePerDay = asText(vehicle.price);
    }
    Object.assign(form, {
        negotiable: Boolean(sale.negotiable),
        creditAvailable: Boolean(sale.creditAvailable),
        tradeInAccepted: Boolean(sale.tradeInAccepted),
        insuranceValidUntil: asDate(sale.insuranceValidUntil),
        pricePerWeek: asText(rent.pricePerWeek),
        pricePerMonth: asText(rent.pricePerMonth),
        deposit: asText(rent.deposit),
        minDays: asText(rent.minDays || 1),
        insurance: asText(rent.insurance),
        insuranceExcess: asText(rent.insuranceExcess),
        mileagePolicy: rent.mileagePolicy || "unlimited",
        kmPerDay: asText(rent.kmPerDay),
        minDriverAge: asText(rent.minDriverAge),
        minLicenseYears: asText(rent.minLicenseYears),
        withDriver: Boolean(rent.withDriver),
        delivery: Boolean(rent.delivery),
    });
    return form;
}
