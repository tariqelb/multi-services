// backend/apps/property/services/externalListings/listingClassifier.js
//
// Listing websites rarely publish structured data, so the collector often
// gets only a title, a description and a URL. This module reads them (French,
// English, Arabic, Darija) and guesses what the search needs:
//
//   classifyListing(listing) -> { listingType, propertyType, city, price }
//
//   listingType   "For Sale" | "For Rent" | "Unknown"
//   propertyType  "Apartment", "Villa", ... (same names as the application) or ""
//   city          English name of the city list or ""
//   price         number or null
//
// Values already set on the listing are kept: only empty ones are guessed.
// Pure functions (no database, no network): used when a listing is saved and
// by the search for listings collected before this module existed.

import { CITY_ALIASES, MOROCCAN_CITIES } from "./moroccanCities.js";

export const PROPERTY_TYPES = [
    "Apartment",
    "House",
    "Villa",
    "Studio",
    "Room",
    "Land",
    "Store",
    "Office",
    "Warehouse",
    "Commercial space",
    "Garage",
];

/** Lower case, no accents, punctuation -> spaces, padded for " word " tests. */
export function normalizeText(value) {
    const text = String(value || "")
        .normalize("NFD")
        .replace(/[̀-ͯ]/g, "")
        .replace(/[ً-ٰٟ]/g, "") // Arabic diacritics
        .replace(/[أإآ]/g, "ا")
        .toLowerCase()
        .replace(/[^\p{L}\p{N}]+/gu, " ")
        .trim();
    return ` ${text} `;
}

// Keywords are written normalized (no accents). Order matters: the first
// type found in a text wins when several are present at the same position.
const TYPE_KEYWORDS = [
    ["Studio", ["studio", "studios", "ستوديو", "استوديو"]],
    ["Villa", ["villa", "villas", "فيلا", "فيلات", "فيلة"]],
    ["Apartment", ["appartement", "appartements", "appart", "apartment", "apartments", "flat", "duplex", "triplex", "penthouse", "شقة", "شقق", "الشقة", "دوبلكس"]],
    ["Land", ["terrain", "terrains", "lot de terrain", "land", "plot", "ارض", "الارض", "بقعة", "بقع", "البقعة", "هكتار"]],
    ["Warehouse", ["entrepot", "entrepots", "hangar", "depot", "warehouse", "مستودع", "مخزن"]],
    ["Office", ["bureau", "bureaux", "office", "offices", "plateau de bureau", "مكتب", "مكاتب"]],
    ["Commercial space", ["local commercial", "locaux commerciaux", "fonds de commerce", "fond de commerce", "commercial space", "commerce", "محل تجاري", "تجاري"]],
    ["Store", ["magasin", "magasins", "boutique", "boutiques", "shop", "store", "محل", "حانوت", "دكان"]],
    ["Garage", ["garage", "garages", "parking", "كراج", "مرآب", "مراب"]],
    ["House", ["maison", "maisons", "house", "houses", "riad", "riads", "villa jumelee", "duplex maison", "منزل", "منازل", "رياض", "بيت", "دار للبيع", "دار للكراء"]],
    ["Room", ["chambre a louer", "chambre meublee", "chambre pour", "room for rent", "room", "colocation", "غرفة"]],
];

const RENT_KEYWORDS = [
    "a louer", "louer", "location", "locations", "loue", "loyer", "par mois", "dh mois", "dhs mois", "mad mois", "par nuit", "nuitee",
    "for rent", "to rent", "rent", "rental", "rentals", "per month", "monthly", "per night",
    "للكراء", "كراء", "الكراء", "ايجار", "للايجار", "الايجار", "شهريا", "في الشهر", "kira", "lkra",
];
const SALE_KEYWORDS = [
    "a vendre", "vendre", "vente", "ventes", "vend", "achat", "acheter", "prix de vente",
    "for sale", "sale", "buy", "sell",
    "للبيع", "بيع", "البيع", "شراء",
];

// City names that are also ordinary words: only trusted in the city field
// or in Arabic ("Sale" = Salé, but "sale" is also "for sale").
const AMBIGUOUS_CITY_WORDS = new Set(["sale"]);

const keywordList = (words) => words.map((word) => normalizeText(word));

const TYPE_PATTERNS = TYPE_KEYWORDS.map(([type, words]) => [type, keywordList(words)]);
const RENT_PATTERNS = keywordList(RENT_KEYWORDS);
const SALE_PATTERNS = keywordList(SALE_KEYWORDS);

// [normalized name, English name], longest names first ("Ksar El Kebir" before "Kebir").
const CITY_PATTERNS = (() => {
    const entries = [];
    for (const [en, ar] of MOROCCAN_CITIES) {
        entries.push([normalizeText(en), en]);
        if (ar) entries.push([normalizeText(ar), en]);
        // "Dar Bouazza (Tamaris)" is also written "Dar Bouazza".
        const short = en.replace(/\s*\(.*\)\s*/, "");
        if (short !== en) entries.push([normalizeText(short), en]);
    }
    for (const [alias, en] of Object.entries(CITY_ALIASES)) {
        entries.push([normalizeText(alias), en]);
    }
    return entries
        .filter(([name]) => name.trim().length >= 3)
        .sort((a, b) => b[0].length - a[0].length);
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

/** URL path as words: "/fr/location/appartement-agadir-12" -> " fr location appartement agadir 12 ". */
function urlWords(sourceUrl) {
    try {
        return normalizeText(decodeURIComponent(new URL(sourceUrl).pathname));
    } catch {
        return " ";
    }
}

/** Texts from the most to the least reliable. */
function textsOf(listing) {
    return [
        normalizeText(listing.title),
        urlWords(listing.sourceUrl),
        normalizeText(String(listing.description || "").slice(0, 600)),
    ];
}

export function guessListingType(listing) {
    const unit = normalizeText(listing.priceUnit);
    if (/ (month|monthly|mois|night|nuit|day|jour) /.test(unit)) return "For Rent";

    for (const text of textsOf(listing)) {
        const rent = firstIndex(text, RENT_PATTERNS);
        const sale = firstIndex(text, SALE_PATTERNS);
        if (rent === -1 && sale === -1) continue;
        if (sale === -1) return "For Rent";
        if (rent === -1) return "For Sale";
        return rent < sale ? "For Rent" : "For Sale";
    }
    return "Unknown";
}

export function guessPropertyType(listing) {
    for (const text of textsOf(listing)) {
        let best = null;
        for (const [type, patterns] of TYPE_PATTERNS) {
            const index = firstIndex(text, patterns);
            if (index !== -1 && (!best || index < best.index)) best = { type, index };
        }
        if (best) return best.type;
    }
    return "";
}

/** English city name of a free text ("Marrakech", "مراكش", "agadir ") or "". */
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
    return city === "Sale" && /(^|[^\p{L}])sal(?:é|e\u0301)(?=[^\p{L}]|$)/iu.test(`${listing.title || ""} ${listing.description || ""}`);
}

export function guessCity(listing) {
    // The city field of the website wins when it is a known city.
    const fromField = matchCityName(listing.city) || matchCityName(listing.neighborhood);
    if (fromField) return fromField;

    // "Salé" keeps its accent in the raw text ("sale" alone means "for sale").
    const SALE_CITY = /(^|[^\p{L}])sal(?:é|e\u0301)(?=[^\p{L}]|$)/iu;

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

/** "1 250 000 DH", "4.500 dhs", "8000 درهم" -> number, or null. */
export function guessPrice(listing) {
    const pattern = /(\d{1,3}(?:[\s.  ]\d{3})+|\d{3,9})(?:[.,]\d{1,2})?\s*(?:dh|dhs|mad|dirhams?|درهم|د\.م)/giu;
    for (const value of [listing.title, String(listing.description || "").slice(0, 1500)]) {
        const match = pattern.exec(String(value || ""));
        pattern.lastIndex = 0;
        if (!match) continue;
        const number = Number(match[1].replace(/[\s.  ]/g, ""));
        if (Number.isFinite(number) && number >= 100 && number <= 1e9) return number;
    }
    return null;
}

const hasPrice = (value) => value !== null && value !== undefined && value !== "" && Number.isFinite(Number(value));

/**
 * Fill the missing search fields of a listing.
 * Returns the guessed values; the listing itself is not changed.
 */
export function classifyListing(listing = {}) {
    const listingType = ["For Sale", "For Rent"].includes(listing.listingType) ? listing.listingType : guessListingType(listing);
    const propertyType = PROPERTY_TYPES.includes(listing.propertyType) ? listing.propertyType : guessPropertyType(listing) || String(listing.propertyType || "");
    const city = guessCity(listing) || String(listing.city || "");
    const price = hasPrice(listing.price) ? Number(listing.price) : guessPrice(listing);

    return { listingType, propertyType, city, price };
}
