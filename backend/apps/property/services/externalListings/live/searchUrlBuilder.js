// backend/apps/property/services/externalListings/live/searchUrlBuilder.js
//
// Builds the address of a website's own search / results page from the
// user's search (city, property type, sale or rent).
//
// Each website has a "search" block in supportedSources.json:
//
//   "search": {
//     "offers": ["For Sale", "For Rent"],          // what the website lists (optional)
//     "allCities": "maroc",                         // {city} value for "all cities" (optional)
//     "templates": [                                // most precise first
//       { "url": "/fr/{transaction}/{type}/{city}" },
//       { "url": "/fr/acheter/immo-{city}", "listingType": "For Sale" }
//     ],
//     "maps": {
//       "transaction": { "For Sale": "vendre", "For Rent": "louer", "any": "tout" },
//       "type": { "Apartment": "appartement", "Villa": "villa" },
//       "city": { "Marrakesh": "marrakech" }       // other cities: slug of the name
//     }
//   }
//
// Placeholders: {city} (slug of the city, or maps.city), and any other
// {name} read from maps[name] with the chosen value (transaction values are
// "For Sale" / "For Rent" / "any", type values are the property types,
// {cityId}-like names are read with the city name).
//
// Rules:
//   - a placeholder in the PATH must get a value, otherwise the template is
//     not usable for this search;
//   - a query parameter whose placeholder has no value because the user
//     chose "all" is removed ("?city=&type=x" -> "?type=x");
//   - a value the user chose but the website does not know (no entry in the
//     map) makes the template unusable: the next template is tried.
//
// The first usable template wins. When the user wants sale AND rent and
// the template only fits one offer, one address per offer is built.

const PLACEHOLDER = /\{([a-zA-Z]+)\}/g;
const OFFERS = ["For Sale", "For Rent"];

// Usual French spellings of the city list names.
const DEFAULT_CITY_SLUGS = {
    Marrakesh: "marrakech",
    "Dar Bouazza (Tamaris)": "dar-bouazza",
    "M'diq": "mdiq",
    "Aït Melloul": "ait-melloul",
};

/** "Ksar El Kebir" -> "ksar-el-kebir", "Aït Melloul" -> "ait-melloul" */
export function slugify(value) {
    return String(value || "")
        .normalize("NFD")
        .replace(/[̀-ͯ]/g, "")
        .replace(/\(.*?\)/g, "")
        .toLowerCase()
        .replace(/['’]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
}

/** Value of one placeholder, or undefined when the website cannot express it. "" = not chosen. */
function placeholderValue(name, criteria, search, listingType) {
    const maps = search.maps || {};

    if (name === "city") {
        if (!criteria.city) return search.allCities ?? "";
        return maps.city?.[criteria.city] ?? DEFAULT_CITY_SLUGS[criteria.city] ?? slugify(criteria.city);
    }

    const map = maps[name];
    if (!map) return undefined;

    if (name === "transaction" || name === "deal" || name.endsWith("Offer")) {
        if (!listingType) return map.any ?? "";
        return map[listingType];
    }
    if (name === "type" || name.endsWith("Type") || name.endsWith("TypeId") || name === "typeId") {
        if (!criteria.propertyType) return map.any ?? "";
        return map[criteria.propertyType];
    }
    if (name.startsWith("city")) {
        if (!criteria.city) return map.any ?? "";
        return map[criteria.city];
    }
    return undefined;
}

/** Fill one template for one offer (null when not usable). */
function fillTemplate(origin, template, criteria, search, listingType) {
    const raw = String(template.url || "");
    const [pathPart, queryPart = ""] = raw.split("?");
    const used = { city: false, type: false, listingType: false };

    const mark = (name, value) => {
        if (!value) return;
        if (name === "city" || name.startsWith("city")) used.city = Boolean(criteria.city);
        if (name === "type" || name.toLowerCase().includes("type")) used.type = Boolean(criteria.propertyType);
        if (name === "transaction" || name === "deal" || name.endsWith("Offer")) used.listingType = Boolean(listingType);
    };

    // Path: every placeholder needs a value.
    let ok = true;
    const path = pathPart.replace(PLACEHOLDER, (_match, name) => {
        const value = placeholderValue(name, criteria, search, listingType);
        if (value === undefined || value === "") {
            ok = false;
            return "";
        }
        mark(name, value);
        return encodeURIComponent(String(value)).replace(/%2F/gi, "/");
    });
    if (!ok) return null;

    // Query: parameters of values not chosen are dropped.
    const params = [];
    for (const pair of queryPart.split("&").filter(Boolean)) {
        const [key, valueTemplate = ""] = pair.split("=");
        let skip = false;
        const value = valueTemplate.replace(PLACEHOLDER, (_match, name) => {
            const filled = placeholderValue(name, criteria, search, listingType);
            if (filled === undefined) {
                ok = false;
                return "";
            }
            if (filled === "") skip = true;
            mark(name, filled);
            return encodeURIComponent(String(filled));
        });
        if (!skip) params.push(`${key}=${value}`);
    }
    if (!ok) return null;

    const url = new URL(path || "/", origin);
    url.search = params.length ? `?${params.join("&")}` : "";

    return {
        url: url.href,
        listingType: listingType || "",
        // What the website already filtered: trusted for its results.
        filtered: {
            city: used.city,
            propertyType: used.type,
            listingType: used.listingType || Boolean(template.listingType),
        },
    };
}

/**
 * Addresses to open on a website for a search (0, 1 or 2: sale and rent).
 * criteria: { city, propertyType, listingType } (English values, "" = all).
 */
export function buildSearchUrls(source, criteria) {
    const search = source?.search;
    if (!search?.templates?.length) return [];

    const origin = `https://${source.hostnames[0]}`;
    const offers = search.offers?.length ? search.offers : OFFERS;

    // The website does not list this offer (e.g. rentals only).
    if (criteria.listingType && !offers.includes(criteria.listingType)) return [];

    const wanted = criteria.listingType ? [criteria.listingType] : offers.length === 1 ? offers : [""];

    for (const template of search.templates) {
        if (template.listingType && criteria.listingType && template.listingType !== criteria.listingType) continue;

        // A template made for one offer: one address per offer wanted.
        const perOffer = wanted[0] === "" && (template.listingType || templateNeedsOffer(template, search))
            ? offers.filter((offer) => !template.listingType || offer === template.listingType)
            : wanted;

        const built = [];
        for (const offer of perOffer) {
            const forOffer = template.listingType || offer;
            const filled = fillTemplate(origin, template, criteria, search, forOffer);
            if (filled) built.push(filled);
        }
        if (built.length) {
            // The other offer of a one-offer template comes from the next template for that offer.
            if (!criteria.listingType && template.listingType && offers.length > 1) {
                const other = offers.find((offer) => offer !== template.listingType);
                const rest = buildSearchUrls(
                    { ...source, search: { ...search, templates: search.templates.filter((item) => item.listingType === other) } },
                    { ...criteria, listingType: other },
                );
                return [...built, ...rest];
            }
            return built;
        }
    }
    return [];
}

/** {transaction} in the path without an "any" value: one address per offer. */
function templateNeedsOffer(template, search) {
    const [pathPart] = String(template.url || "").split("?");
    const names = [...pathPart.matchAll(PLACEHOLDER)].map((match) => match[1]);
    return names.some((name) => (name === "transaction" || name === "deal" || name.endsWith("Offer")) && !search.maps?.[name]?.any);
}
