// backend/apps/vehicles/services/requests/requestText.js
//
// Short text of a vehicle request for notifications and emails, in the
// user's language: "Dacia Logan to buy in Agadir · up to 90,000 MAD".

const lang = (language) => (["en", "fr", "ar"].includes(language) ? language : "en");

const WORDS = {
    en: { transaction: { buy: "to buy", rent: "to rent" }, category: { car: "Car", moto: "Moto or bike", part: "Spare part" }, in: "in", upTo: "up to", from: "from", mad: "MAD" },
    fr: { transaction: { buy: "à acheter", rent: "à louer" }, category: { car: "Voiture", moto: "Moto ou vélo", part: "Pièce détachée" }, in: "à", upTo: "jusqu'à", from: "à partir de", mad: "MAD" },
    ar: { transaction: { buy: "للشراء", rent: "للكراء" }, category: { car: "سيارة", moto: "دراجة", part: "قطعة غيار" }, in: "في", upTo: "حتى", from: "من", mad: "درهم" },
};

const money = (value) => Number(value).toLocaleString("fr-MA");

/** "Dacia Logan to buy in Agadir" / "Brake pads · Dacia Logan in Agadir" */
export function requestTitle(request, language = "en") {
    const w = WORDS[lang(language)];
    const makeModel = [request.make, request.model].filter(Boolean).join(" ");
    const isPart = request.vehicleCategory === "part";
    const what = isPart ? [request.partName || w.category.part, makeModel].filter(Boolean).join(" · ") : makeModel || w.category[request.vehicleCategory] || "";
    const transaction = isPart ? "" : w.transaction[request.transaction] || "";
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

/** Pages in the app. */
export const requestLink = (request) => `/vehicles/requests/${request._id || request.id}`;
export const BOARD_LINK = "/vehicles/requests/board";
