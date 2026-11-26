// backend/apps/vehicles/services/externalListings/vehicleCheck.js
//
// Is this page really a vehicle listing (car, moto or spare part)?
//
// General classifieds websites (Maroc Annuaire, Maroc Annonces...) also
// publish apartments, villas and land. Their pages share the same address
// pattern as their vehicle ads, so the collector checks each page before
// saving it:
//
//   checkVehicleListing(listing) -> { ok, reason, vehicleScore, propertyScore }
//       reason: "" | "no-title" | "property" | "not-vehicle"
//   looksLikePropertyUrl(url)   -> true for "/immobilier/...", "/appartement-..."
//
// Pure functions (no database, no network).

import { CAR_MAKES, MOTO_MAKES, classifyListing, normalizeText } from "./listingClassifier.js";

const words = (list) => list.map((word) => normalizeText(word));

// Real estate words (French, English, Arabic, Darija).
const PROPERTY_WORDS = words([
    "appartement", "appartements", "appart", "studio", "studios", "villa", "villas", "maison", "maisons", "duplex",
    "triplex", "riad", "riads", "terrain", "terrains", "lotissement", "immobilier", "immobiliere", "immeuble",
    "local commercial", "bureau a louer", "plateau bureau", "chambre", "chambres", "salon", "salons", "cuisine equipee",
    "salle de bain", "salles de bain", "sdb", "m2", "m²", "metres carres", "superficie", "colocation", "location meublee",
    "meuble a louer", "residence", "etage", "terrasse", "piscine", "jardin", "titre foncier", "syndic", "ascenseur",
    "apartment", "apartments", "house", "bedroom", "bedrooms", "real estate", "flat for rent", "land for sale",
    "شقة", "شقق", "فيلا", "منزل", "دار للبيع", "بقعة", "بقعة ارضية", "ارض", "عقار", "عقارات", "غرفة", "غرف", "صالون",
    "محل تجاري", "مكتب", "رياض", "شقة للكراء",
]);

// Vehicle words (strong ones only: "piece" alone also means "room").
const VEHICLE_WORDS = words([
    "voiture", "voitures", "vehicule", "vehicules", "automobile", "berline", "citadine", "suv", "4x4", "pick up",
    "pickup", "utilitaire", "fourgon", "camionnette", "monospace", "cabriolet", "moto", "motos", "scooter",
    "motocyclette", "quad", "cyclomoteur", "piece auto", "pieces auto", "piece detachee", "pieces detachees",
    "pieces de rechange", "piece d origine", "pneu", "pneus", "jante", "jantes", "phare", "phares", "retroviseur",
    "pare choc", "parechoc", "plaquettes de frein", "disque de frein", "amortisseur", "amortisseurs", "embrayage",
    "radiateur", "alternateur", "demarreur", "turbo", "injecteur", "injecteurs", "calandre", "feu arriere",
    "boite de vitesse", "moteur complet", "kit chaine", "pot d echappement", "kilometrage", "boite manuelle", "boite automatique",
    "diesel", "essence", "hybride", "dedouane", "premiere main", "carte grise", "kilometres", "car", "cars",
    "motorcycle", "motorbike", "used car", "mileage", "gearbox",
    "سيارة", "سيارات", "طوموبيل", "دراجة نارية", "موتور", "قطع الغيار", "قطع غيار", "مازوط", "ليصانص", "كيلومتر",
]);

// Address words of real estate sections.
const PROPERTY_URL_WORDS = words([
    "immobilier", "immobiliere", "immo", "appartement", "appartements", "appartements a vendre", "appartements a louer",
    "villa", "villas", "maison", "maisons", "terrain", "terrains", "riad", "studio", "bureaux", "locaux", "real estate",
    "apartment", "apartments", "colocation", "location vacances", "عقار", "شقة",
]);
const VEHICLE_URL_WORDS = words([
    "voiture", "voitures", "voitures d occasion", "vehicule", "vehicules", "auto", "autos", "moto", "motos",
    "occasion", "pieces", "car", "cars", "location de voiture", "سيارة", "سيارات",
]);

// Schema.org types that settle the question.
const VEHICLE_SCHEMA_TYPES = new Set(["car", "vehicle", "motorcycle", "motorizedbicycle", "busorcoach"]);
const PROPERTY_SCHEMA_TYPES = new Set([
    "apartment", "house", "singlefamilyresidence", "residence", "accommodation", "realestatelisting", "room",
    "landmarksorhistoricalbuildings", "lodgingbusiness",
]);

const ALL_MAKES = [...new Set([...CAR_MAKES, ...MOTO_MAKES])];

function count(text, patterns) {
    let found = 0;
    for (const pattern of patterns) if (text.includes(pattern)) found += 1;
    return found;
}

function pathWords(url) {
    try {
        const parsed = new URL(url);
        return normalizeText(decodeURIComponent(parsed.pathname + " " + parsed.search));
    } catch {
        return " ";
    }
}

/** "/immobilier/...", "/appartements-a-vendre/..." without any vehicle word. */
export function looksLikePropertyUrl(url) {
    const path = pathWords(url);
    return count(path, PROPERTY_URL_WORDS) > 0 && count(path, VEHICLE_URL_WORDS) === 0;
}

/** A title that only repeats the website name or the default title. */
export function isGenericTitle(listing = {}) {
    const title = normalizeText(listing.title).trim();
    if (!title || title.length < 4) return true;
    const generic = [
        "vehicle listing",
        listing.sourceName,
        listing.sourceDomain,
        String(listing.sourceDomain || "").replace(/^www\./, "").split(".")[0],
    ]
        .filter(Boolean)
        .map((value) => normalizeText(value).trim());
    return generic.includes(title);
}

/**
 * Decide whether a listing (as extracted, or as stored) is a vehicle ad.
 *
 * Vehicle signs: a make, vehicle words, mileage, fuel or gearbox, a
 * schema.org Car / Vehicle type, a vehicle section in the address.
 * Property signs: real estate words, a real estate section in the address,
 * a schema.org Apartment / House type.
 */
export function checkVehicleListing(listing = {}) {
    const empty = { vehicleScore: 0, propertyScore: 0 };

    if (isGenericTitle(listing)) {
        return { ok: false, reason: "no-title", ...empty };
    }

    const schemaType = String(listing.schemaType || "").toLowerCase();
    const title = normalizeText(listing.title);
    const description = normalizeText(String(listing.description || "").slice(0, 1500));
    const path = pathWords(listing.sourceUrl);

    // Guess from the text only: values the classifier would have guessed
    // anyway are not trusted twice.
    const guessed = classifyListing({
        title: listing.title,
        description: listing.description,
        sourceUrl: listing.sourceUrl,
        make: ALL_MAKES.includes(listing.make) ? listing.make : "",
    });

    let vehicleScore = 0;
    if (VEHICLE_SCHEMA_TYPES.has(schemaType)) vehicleScore += 4;
    if (guessed.make) vehicleScore += 3;
    vehicleScore += Math.min(count(title, VEHICLE_WORDS), 2) * 2;
    vehicleScore += Math.min(count(description, VEHICLE_WORDS), 3);
    vehicleScore += count(path, VEHICLE_URL_WORDS) ? 2 : 0;
    if (guessed.fuel) vehicleScore += 1;
    if (guessed.transmission) vehicleScore += 1;
    if (guessed.mileage) vehicleScore += 1;

    let propertyScore = 0;
    if (PROPERTY_SCHEMA_TYPES.has(schemaType)) propertyScore += 4;
    propertyScore += Math.min(count(title, PROPERTY_WORDS), 2) * 2;
    propertyScore += Math.min(count(description, PROPERTY_WORDS), 3);
    propertyScore += count(path, PROPERTY_URL_WORDS) ? 2 : 0;

    const scores = { vehicleScore, propertyScore };

    if (propertyScore >= 2 && propertyScore >= vehicleScore) {
        return { ok: false, reason: "property", ...scores };
    }
    if (vehicleScore < 2) {
        return { ok: false, reason: "not-vehicle", ...scores };
    }
    return { ok: true, reason: "", ...scores };
}

/** Reasons shown to the administrators. */
export const REJECT_REASONS = {
    "no-title": "No real title on the page (only the website name).",
    property: "Real estate listing, not a vehicle.",
    "not-vehicle": "Not a vehicle listing.",
};
