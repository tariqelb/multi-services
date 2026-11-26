// backend/apps/property/services/requests/requestText.js
//
// Short text of a property request for notifications and emails, in the
// user's language: "Apartment, Studio to rent in Agadir · up to 5,000 MAD".

const lang = (language) => (["en", "fr", "ar"].includes(language) ? language : "en");

const WORDS = {
    en: {
        transaction: { rent: "to rent", furnished: "furnished rental", buy: "to buy" },
        types: {
            Apartment: "Apartment", House: "House", Villa: "Villa", Studio: "Studio", Room: "Room", Store: "Store", Office: "Office",
            Land: "Land", Warehouse: "Warehouse", "Commercial space": "Commercial space", "Commercial store": "Commercial store", Garage: "Garage", Other: "Property",
        },
        in: "in",
        upTo: "up to",
        from: "from",
        mad: "MAD",
    },
    fr: {
        transaction: { rent: "à louer", furnished: "location meublée", buy: "à acheter" },
        types: {
            Apartment: "Appartement", House: "Maison", Villa: "Villa", Studio: "Studio", Room: "Chambre", Store: "Magasin", Office: "Bureau",
            Land: "Terrain", Warehouse: "Entrepôt", "Commercial space": "Local commercial", "Commercial store": "Boutique", Garage: "Garage", Other: "Bien",
        },
        in: "à",
        upTo: "jusqu'à",
        from: "à partir de",
        mad: "MAD",
    },
    ar: {
        transaction: { rent: "للكراء", furnished: "كراء مفروش", buy: "للشراء" },
        types: {
            Apartment: "شقة", House: "منزل", Villa: "فيلا", Studio: "استوديو", Room: "غرفة", Store: "محل", Office: "مكتب",
            Land: "أرض", Warehouse: "مستودع", "Commercial space": "فضاء تجاري", "Commercial store": "متجر", Garage: "مرآب", Other: "عقار",
        },
        in: "في",
        upTo: "حتى",
        from: "من",
        mad: "درهم",
    },
};

const money = (value) => Number(value).toLocaleString("fr-MA");

/** "Apartment, Studio to rent in Agadir" */
export function requestTitle(request, language = "en") {
    const w = WORDS[lang(language)];
    const types = (request.propertyTypes || []).map((type) => w.types[type] || type).join(", ") || w.types.Other;
    return `${types} ${w.transaction[request.transaction] || ""} ${w.in} ${request.city}`.replace(/\s+/g, " ").trim();
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

/** Pages in the app. */
export const requestLink = (request) => `/requests/${request._id || request.id}`;
export const BOARD_LINK = "/requests/board";
