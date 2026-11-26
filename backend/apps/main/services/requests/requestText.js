// backend/apps/main/services/requests/requestText.js
//
// Short text of a request for notifications and emails, in the user's
// language: "Apartment, Studio to rent in Agadir · up to 5,000 MAD".

const lang = (language) => (["en", "fr", "ar"].includes(language) ? language : "en");

const WORDS = {
    en: {
        property: { rent: "to rent", furnished: "furnished rental", buy: "to buy" },
        vehicle: { buy: "to buy", rent: "to rent" },
        category: { car: "Car", moto: "Moto or bike", part: "Spare part" },
        types: {
            Apartment: "Apartment", House: "House", Villa: "Villa", Studio: "Studio", Room: "Room", Store: "Store", Office: "Office",
            Land: "Land", Warehouse: "Warehouse", "Commercial space": "Commercial space", "Commercial store": "Commercial store", Garage: "Garage", Other: "Property",
        },
        in: "in",
        upTo: "up to",
        from: "from",
        mad: "MAD",
        lookingFor: "Looking for",
    },
    fr: {
        property: { rent: "à louer", furnished: "location meublée", buy: "à acheter" },
        vehicle: { buy: "à acheter", rent: "à louer" },
        category: { car: "Voiture", moto: "Moto ou vélo", part: "Pièce détachée" },
        types: {
            Apartment: "Appartement", House: "Maison", Villa: "Villa", Studio: "Studio", Room: "Chambre", Store: "Magasin", Office: "Bureau",
            Land: "Terrain", Warehouse: "Entrepôt", "Commercial space": "Local commercial", "Commercial store": "Boutique", Garage: "Garage", Other: "Bien",
        },
        in: "à",
        upTo: "jusqu'à",
        from: "à partir de",
        mad: "MAD",
        lookingFor: "Recherche",
    },
    ar: {
        property: { rent: "للكراء", furnished: "كراء مفروش", buy: "للشراء" },
        vehicle: { buy: "للشراء", rent: "للكراء" },
        category: { car: "سيارة", moto: "دراجة", part: "قطعة غيار" },
        types: {
            Apartment: "شقة", House: "منزل", Villa: "فيلا", Studio: "استوديو", Room: "غرفة", Store: "محل", Office: "مكتب",
            Land: "أرض", Warehouse: "مستودع", "Commercial space": "فضاء تجاري", "Commercial store": "متجر", Garage: "مرآب", Other: "عقار",
        },
        in: "في",
        upTo: "حتى",
        from: "من",
        mad: "درهم",
        lookingFor: "يبحث عن",
    },
};

const money = (value) => Number(value).toLocaleString("fr-MA");

/** "Apartment, Studio to rent in Agadir" */
export function requestTitle(request, language = "en") {
    const w = WORDS[lang(language)];

    if (request.service === "property") {
        const types = (request.propertyTypes || []).map((type) => w.types[type] || type).join(", ") || w.types.Other;
        return `${types} ${w.property[request.transaction] || ""} ${w.in} ${request.city}`.replace(/\s+/g, " ").trim();
    }

    const what =
        request.vehicleCategory === "part"
            ? [request.partName || w.category.part, [request.make, request.model].filter(Boolean).join(" ")].filter(Boolean).join(" · ")
            : [request.make, request.model].filter(Boolean).join(" ") || w.category[request.vehicleCategory] || "";
    const transaction = request.vehicleCategory === "part" ? "" : w.vehicle[request.transaction] || "";
    return `${what} ${transaction} ${w.in} ${request.city}`.replace(/\s+/g, " ").trim();
}

/** "up to 5,000 MAD" / "from 2,000 MAD" / "2,000 - 5,000 MAD" / "" */
export function requestBudget(request, language = "en") {
    const w = WORDS[lang(language)];
    const { budgetMin: min, budgetMax: max } = request;
    if (min && max) return `${money(min)} - ${money(max)} ${w.mad}`;
    if (max) return `${w.upTo} ${money(max)} ${w.mad}`;
    if (min) return `${w.from} ${money(min)} ${w.mad}`;
    return "";
}

export function requestSummary(request, language = "en") {
    return [requestTitle(request, language), requestBudget(request, language)].filter(Boolean).join(" · ");
}

/** Page of a request in the app: property under /requests, vehicles under /vehicles/requests. */
export const requestLink = (request) => `${request.service === "vehicle" ? "/vehicles/requests" : "/requests"}/${request._id || request.id}`;
export const boardLink = (service) => (service === "vehicle" ? "/vehicles/requests/board" : "/requests/board");
