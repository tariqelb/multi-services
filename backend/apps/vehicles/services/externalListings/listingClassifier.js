// backend/apps/vehicles/services/externalListings/listingClassifier.js
//
// Vehicle listing websites rarely publish structured data, so the collector
// often gets only a title, a description and a URL. This module reads them
// (French, English, Arabic, Darija) and guesses what the search needs:
//
//   classifyListing(listing) -> {
//       listingType   "sale" | "rent" | "unknown"
//       category      "car" | "moto" | "part" | ""
//       make          "Dacia", "Mercedes-Benz", "Yamaha"... or ""
//       model         words after the make ("Logan", "Classe C") or ""
//       year          number or null
//       mileage       number (km) or null
//       fuel          "diesel" | "petrol" | "hybrid" | "electric" | "lpg" | ""
//       transmission  "manual" | "automatic" | ""
//       city          English name of the city list or ""
//       price         number or null
//   }
//
// Values already set on the listing are kept: only empty ones are guessed.
// Pure functions (no database, no network).

import { CITY_ALIASES, MOROCCAN_CITIES } from "./moroccanCities.js";

export const CATEGORIES = ["car", "moto", "part"];
export const LISTING_TYPES = ["sale", "rent"];

// Car and moto makes sold in Morocco (same names as the publish form, plus a few more).
export const CAR_MAKES = [
    "Alfa Romeo", "Audi", "BMW", "BYD", "Changan", "Chery", "Chevrolet", "Citroen", "Cupra", "Dacia", "DFSK", "DS",
    "Fiat", "Ford", "Geely", "Great Wall", "Haval", "Honda", "Hyundai", "Infiniti", "Isuzu", "Jaguar", "Jeep", "Jetour",
    "Kia", "Lada", "Land Rover", "Lexus", "Mahindra", "Mazda", "Mercedes-Benz", "MG", "Mini", "Mitsubishi", "Nissan",
    "Omoda", "Opel", "Peugeot", "Porsche", "Renault", "Seat", "Skoda", "Smart", "Subaru", "Suzuki", "Tesla", "Toyota",
    "Volkswagen", "Volvo",
];
export const MOTO_MAKES = [
    "Aprilia", "Benelli", "Cannondale", "Docker", "Ducati", "Haojue", "Harley-Davidson", "Kawasaki", "KTM", "Kymco",
    "Lifan", "Loncin", "MBK", "NIU", "Piaggio", "Royal Enfield", "Segway-Ninebot", "Super Soco", "SYM", "Triumph",
    "Vespa", "Yamaha", "Zongshen", "CFMoto", "Voge", "Sanya",
];
// Makes that build both (category not decided by the make alone).
const SHARED_MAKES = new Set(["BMW", "Honda", "Suzuki", "Peugeot"]);
export const MAKES = [...new Set([...CAR_MAKES, ...MOTO_MAKES])];

// Other spellings -> make.
const MAKE_ALIASES = {
    mercedes: "Mercedes-Benz",
    "mercedes benz": "Mercedes-Benz",
    benz: "Mercedes-Benz",
    vw: "Volkswagen",
    volks: "Volkswagen",
    "range rover": "Land Rover",
    landrover: "Land Rover",
    citroën: "Citroen",
    škoda: "Skoda",
    harley: "Harley-Davidson",
    "harley davidson": "Harley-Davidson",
    "royal enfield": "Royal Enfield",
    "cf moto": "CFMoto",
    segway: "Segway-Ninebot",
    ninebot: "Segway-Ninebot",
    "great wall": "Great Wall",
    // Arabic
    "داسيا": "Dacia",
    "رونو": "Renault",
    "بيجو": "Peugeot",
    "مرسيدس": "Mercedes-Benz",
    "تويوتا": "Toyota",
    "هيونداي": "Hyundai",
    "كيا": "Kia",
    "فولكسفاغن": "Volkswagen",
    "سيتروين": "Citroen",
    "فيات": "Fiat",
    "فورد": "Ford",
    "ياماها": "Yamaha",
    "هوندا": "Honda",
};

/** Lower case, no accents, punctuation -> spaces, padded for " word " tests. */
export function normalizeText(value) {
    const text = String(value || "")
        .normalize("NFD")
        .replace(/[̀-ͯ]/g, "")
        .replace(/[ً-ٰٟ]/g, "") // Arabic diacritics
        .replace(/[أإآ]/g, "ا")
        .toLowerCase()
        .replace(/[^\p{L}\p{N}]+/gu, " ")
        .trim();
    return ` ${text} `;
}

const keywordList = (words) => words.map((word) => normalizeText(word));

// Spare parts first: "phare Clio 4" is a part, not a car.
const PART_KEYWORDS = keywordList([
    "piece", "pieces", "piece detachee", "pieces detachees", "pieces auto", "spare part", "spare parts", "part for",
    "pneu", "pneus", "jante", "jantes", "phare", "phares", "retroviseur", "pare choc", "parechoc", "capot", "portiere",
    "moteur complet", "boite de vitesse", "embrayage", "plaquette", "plaquettes", "disque de frein", "amortisseur",
    "radiateur", "batterie", "alternateur", "demarreur", "turbo", "injecteur", "feu arriere", "calandre", "siege", "sieges",
    "قطع الغيار", "قطع غيار", "قطعة", "عجلات", "اطارات", "جنط", "محرك", "بطارية",
]);
const MOTO_KEYWORDS = keywordList([
    "moto", "motos", "motocycle", "motocyclette", "motorcycle", "motorbike", "scooter", "scooters", "cyclomoteur",
    "quad", "trottinette", "velo", "velos", "bicycle", "vtt", "tricycle", "triporteur", "c50", "c 50",
    "دراجة", "دراجات", "موطور", "موتور", "سكوتر", "تريبورتور",
]);
const CAR_KEYWORDS = keywordList([
    "voiture", "voitures", "vehicule", "auto", "automobile", "berline", "citadine", "suv", "4x4", "pick up", "pickup",
    "utilitaire", "fourgon", "camionnette", "monospace", "break", "coupe", "cabriolet", "car", "cars",
    "سيارة", "سيارات", "طوموبيل",
]);

const RENT_KEYWORDS = keywordList([
    "a louer", "louer", "location", "locations", "loue", "par jour", "dh jour", "dhs jour", "mad jour", "par mois",
    "for rent", "to rent", "rent", "rental", "rent a car", "per day", "daily",
    "للكراء", "كراء", "الكراء", "ايجار", "للايجار", "في اليوم",
]);
const SALE_KEYWORDS = keywordList([
    "a vendre", "vendre", "vente", "vend", "occasion", "achat", "acheter", "prix de vente",
    "for sale", "sale", "buy", "sell", "used",
    "للبيع", "بيع", "البيع", "مستعملة",
]);

// City names that are also ordinary words: only trusted in the city field or in Arabic.
const AMBIGUOUS_CITY_WORDS = new Set(["sale"]);

// [normalized name, English name], longest names first.
const CITY_PATTERNS = (() => {
    const entries = [];
    for (const [en, ar] of MOROCCAN_CITIES) {
        entries.push([normalizeText(en), en]);
        if (ar) entries.push([normalizeText(ar), en]);
        const short = en.replace(/\s*\(.*\)\s*/, "");
        if (short !== en) entries.push([normalizeText(short), en]);
    }
    for (const [alias, en] of Object.entries(CITY_ALIASES)) entries.push([normalizeText(alias), en]);
    return entries.filter(([name]) => name.trim().length >= 3).sort((a, b) => b[0].length - a[0].length);
})();

// [normalized name, make], longest first ("land rover" before "rover").
const MAKE_PATTERNS = (() => {
    const entries = MAKES.map((make) => [normalizeText(make), make]);
    for (const [alias, make] of Object.entries(MAKE_ALIASES)) entries.push([normalizeText(alias), make]);
    // "Mercedes-Benz" is also written "Mercedes Benz".
    entries.push([normalizeText("mercedes benz"), "Mercedes-Benz"]);
    return entries.sort((a, b) => b[0].length - a[0].length);
})();

/** Position of the first keyword found in a normalized text (or -1). */
function firstIndex(text, patterns) {
    let best = -1;
    for (const pattern of patterns) {
        const index = text.indexOf(pattern);
        if (index !== -1 && (best === -1 || index < best)) best = index;
    }
    return best;
}

/** URL path as words. */
function urlWords(sourceUrl) {
    try {
        return normalizeText(decodeURIComponent(new URL(sourceUrl).pathname));
    } catch {
        return " ";
    }
}

/** Texts from the most to the least reliable. */
function textsOf(listing) {
    return [normalizeText(listing.title), urlWords(listing.sourceUrl), normalizeText(String(listing.description || "").slice(0, 800))];
}

export function guessListingType(listing) {
    const unit = normalizeText(listing.priceUnit);
    if (/ (day|daily|jour|journee|month|mois|week|semaine) /.test(unit)) return "rent";

    for (const text of textsOf(listing)) {
        const rent = firstIndex(text, RENT_KEYWORDS);
        const sale = firstIndex(text, SALE_KEYWORDS);
        if (rent === -1 && sale === -1) continue;
        if (sale === -1) return "rent";
        if (rent === -1) return "sale";
        return rent < sale ? "rent" : "sale";
    }
    return "unknown";
}

export function guessMake(listing) {
    for (const text of textsOf(listing)) {
        let best = null;
        for (const [name, make] of MAKE_PATTERNS) {
            const index = text.indexOf(name);
            if (index !== -1 && (!best || index < best.index)) best = { make, index, length: name.length };
        }
        if (best) return best;
    }
    return null;
}

/** "Dacia Logan 1.5 dCi 2019" -> "Logan" (one or two words after the make). */
function guessModel(listing, found) {
    if (!found) return "";
    const text = normalizeText(listing.title);
    // The make as written in the title ("mercedes" for Mercedes-Benz).
    const names = MAKE_PATTERNS.filter(([, make]) => make === found.make).map(([name]) => name);
    const name = names.find((item) => text.includes(item));
    if (!name) return "";
    const after = text.slice(text.indexOf(name) + name.length).trim().split(" ");
    const words = [];
    for (const word of after) {
        if (!word || /^(19|20)\d\d$/.test(word) || /^(diesel|essence|hybride|electrique|automatique|manuelle|a|vendre|louer|occasion|km|dh|dhs)$/.test(word)) break;
        if (/^\d+(\.\d+)?$/.test(word) && words.length) break;
        words.push(word);
        if (words.length === 2) break;
    }
    // "classe c" -> "Classe C", "logan" -> "Logan"
    return words.map((word) => (word.length <= 3 && /\d/.test(word) ? word.toUpperCase() : word.charAt(0).toUpperCase() + word.slice(1))).join(" ").slice(0, 40);
}

export function guessCategory(listing, make = "") {
    for (const text of textsOf(listing)) {
        const part = firstIndex(text, PART_KEYWORDS);
        const moto = firstIndex(text, MOTO_KEYWORDS);
        const car = firstIndex(text, CAR_KEYWORDS);
        const found = [["part", part], ["moto", moto], ["car", car]].filter(([, index]) => index !== -1);
        if (!found.length) continue;
        // A part names the vehicle it fits ("Phare Clio 4", "Pneu moto"): parts win.
        if (part !== -1) return "part";
        found.sort((a, b) => a[1] - b[1]);
        return found[0][0];
    }
    if (make && !SHARED_MAKES.has(make)) {
        if (MOTO_MAKES.includes(make)) return "moto";
        if (CAR_MAKES.includes(make)) return "car";
    }
    return "";
}

/** A year between 1970 and next year, not a price ("2019", "modèle 2015"). */
export function guessYear(listing) {
    const limit = new Date().getFullYear() + 1;
    for (const value of [listing.title, String(listing.description || "").slice(0, 1500), urlWords(listing.sourceUrl)]) {
        // Not a price or a mileage ("2000 DH", "2015 km").
        const pattern = /(?:^|[^\d])((?:19[7-9]|20[0-4])\d)(?![\d.  ]*\d)(?!\s*(?:dh|dhs|mad|km|kms|درهم|كلم))(?=[^\d]|$)/giu;
        let match;
        while ((match = pattern.exec(String(value || "")))) {
            const year = Number(match[1]);
            if (year >= 1970 && year <= limit) return year;
        }
    }
    return null;
}

/** "120 000 km", "85.000km", "75000 كلم" -> number. */
export function guessMileage(listing) {
    const pattern = /(\d{1,3}(?:[\s.  ]\d{3})+|\d{1,7})\s*(?:km|kms|kilometres?|kilomètres?|كلم|كم)(?![a-z])/iu;
    for (const value of [listing.title, String(listing.description || "").slice(0, 2000)]) {
        const match = pattern.exec(String(value || ""));
        if (!match) continue;
        const number = Number(match[1].replace(/[\s.  ]/g, ""));
        if (Number.isFinite(number) && number >= 0 && number <= 2000000) return number;
    }
    return null;
}

export function guessFuel(listing) {
    const text = textsOf(listing).join(" ");
    if (/ (hybride rechargeable|plug in|phev) /.test(text)) return "hybrid";
    if (/ (hybride|hybrid|هجين) /.test(text)) return "hybrid";
    if (/ (electrique|electric|ev|كهربائية|كهربائي) /.test(text)) return "electric";
    if (/ (diesel|gasoil|dci|tdi|hdi|crdi|cdi|ديزل|كازوال|مازوط) /.test(text)) return "diesel";
    if (/ (essence|petrol|gasoline|tce|tsi|بنزين|ليصانص) /.test(text)) return "petrol";
    if (/ (gpl|lpg) /.test(text)) return "lpg";
    return "";
}

export function guessTransmission(listing) {
    const text = textsOf(listing).join(" ");
    if (/ (automatique|automatic|auto bva|bva|dsg|edc|اوتوماتيك|اوتوماتيكية) /.test(text)) return "automatic";
    if (/ (manuelle|manual|bvm|مانويل|عادية) /.test(text)) return "manual";
    return "";
}

/** English city name of a free text ("Marrakech", "مراكش") or "". */
export function matchCityName(value, { strict = false } = {}) {
    const text = normalizeText(value);
    if (!text.trim()) return "";
    for (const [name, en] of CITY_PATTERNS) {
        if (strict ? text === name : text.includes(name)) return en;
    }
    return "";
}

/** Does the listing name this city (English name of the list) anywhere? */
export function mentionsCity(listing, city) {
    if (!city) return false;
    const names = CITY_PATTERNS.filter(([name, en]) => en === city && !AMBIGUOUS_CITY_WORDS.has(name.trim())).map(([name]) => name);
    const texts = [normalizeText(listing.title), urlWords(listing.sourceUrl), normalizeText(listing.description), normalizeText(listing.city), normalizeText(listing.neighborhood)];
    if (texts.some((text) => names.some((name) => text.includes(name)))) return true;
    return city === "Sale" && /(^|[^\p{L}])sal(?:é|é)(?=[^\p{L}]|$)/iu.test(`${listing.title || ""} ${listing.description || ""}`);
}

export function guessCity(listing) {
    const fromField = matchCityName(listing.city) || matchCityName(listing.neighborhood);
    if (fromField) return fromField;

    const SALE_CITY = /(^|[^\p{L}])sal(?:é|é)(?=[^\p{L}]|$)/iu;
    for (const text of textsOf(listing)) {
        let best = null;
        for (const [name, en] of CITY_PATTERNS) {
            if (AMBIGUOUS_CITY_WORDS.has(name.trim())) continue;
            const index = text.indexOf(name);
            if (index !== -1 && (!best || index < best.index)) best = { en, index };
        }
        if (best) return best.en;
    }
    if (SALE_CITY.test(`${listing.title || ""} ${String(listing.description || "").slice(0, 600)}`)) return "Sale";
    return "";
}

/** "125 000 DH", "4.500 dhs", "80000 درهم" -> number, or null. */
export function guessPrice(listing) {
    const pattern = /(\d{1,3}(?:[\s.  ]\d{3})+|\d{2,9})(?:[.,]\d{1,2})?\s*(?:dh|dhs|mad|dirhams?|درهم|د\.م)/giu;
    for (const value of [listing.title, String(listing.description || "").slice(0, 1500)]) {
        const match = pattern.exec(String(value || ""));
        pattern.lastIndex = 0;
        if (!match) continue;
        const number = Number(match[1].replace(/[\s.  ]/g, ""));
        if (Number.isFinite(number) && number >= 10 && number <= 1e8) return number;
    }
    return null;
}

const hasNumber = (value) => value !== null && value !== undefined && value !== "" && Number.isFinite(Number(value));

/**
 * Fill the missing search fields of a listing.
 * Returns the guessed values; the listing itself is not changed.
 */
export function classifyListing(listing = {}) {
    // A make given by the website ("DACIA", "Mercedes") is matched to the list first.
    const found = MAKES.includes(listing.make)
        ? { make: listing.make }
        : (listing.make && guessMake({ title: listing.make })) || guessMake(listing);
    const make = found?.make || "";
    return {
        listingType: LISTING_TYPES.includes(listing.listingType) ? listing.listingType : guessListingType(listing),
        category: CATEGORIES.includes(listing.category) ? listing.category : guessCategory(listing, make),
        make,
        model: String(listing.model || "").trim() || guessModel(listing, found),
        year: hasNumber(listing.year) ? Number(listing.year) : guessYear(listing),
        mileage: hasNumber(listing.mileage) ? Number(listing.mileage) : guessMileage(listing),
        fuel: listing.fuel || guessFuel(listing),
        transmission: listing.transmission || guessTransmission(listing),
        city: guessCity(listing) || String(listing.city || ""),
        price: hasNumber(listing.price) ? Number(listing.price) : guessPrice(listing),
    };
}
