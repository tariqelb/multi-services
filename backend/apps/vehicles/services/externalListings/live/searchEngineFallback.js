// backend/apps/vehicles/services/externalListings/live/searchEngineFallback.js
//
// Fallback for websites whose results page cannot be read (no known search
// address, results loaded with JavaScript, page error): asks the Brave
// Search API for listing pages of that website matching the search.
//
//   BRAVE_SEARCH_API_KEY   key of https://api-dashboard.search.brave.com
//                          (no key: the fallback is off)
//   BRAVE_SEARCH_MAX_SITES maximum websites sent to Brave per search (default 6),
//                          each website = one Brave request.
//
// Brave answers with what it has indexed (pages can be a few days old).

import axios from "axios";

const ENDPOINT = "https://api.search.brave.com/res/v1/web/search";
const TIMEOUT = 8000;

export const isSearchEngineEnabled = () => Boolean(process.env.BRAVE_SEARCH_API_KEY);
export const searchEngineMaxSites = () => Math.max(0, Number(process.env.BRAVE_SEARCH_MAX_SITES) || 6);

// French words used by most Moroccan vehicle websites.
const CATEGORY_WORDS = { car: "voiture", moto: "moto", part: "pièce auto" };
const OFFER_WORDS = { sale: "à vendre", rent: "location" };
const CITY_WORDS = { Marrakesh: "Marrakech", Tanger: "Tanger", Fes: "Fès", Sale: "Salé" };

/** "voiture Dacia Logan à vendre Agadir site:avito.ma" */
export function buildQuery(hostname, criteria) {
    return [
        CATEGORY_WORDS[criteria.category] || "voiture",
        criteria.make || "",
        criteria.model || "",
        OFFER_WORDS[criteria.listingType] || "",
        criteria.city ? CITY_WORDS[criteria.city] || criteria.city : "Maroc",
        `site:${hostname}`,
    ]
        .filter(Boolean)
        .join(" ");
}

const stripTags = (value) => String(value || "").replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();

/**
 * Listing pages of one website found by the search engine.
 * Returns [{ sourceUrl, title, imageUrl, price: null, text }].
 */
export async function searchWebsiteWithEngine(hostname, criteria, { httpGet = axios.get } = {}) {
    const key = process.env.BRAVE_SEARCH_API_KEY;
    if (!key) return [];

    const response = await httpGet(ENDPOINT, {
        timeout: TIMEOUT,
        params: { q: buildQuery(hostname, criteria), count: 20, country: "MA", search_lang: "fr", safesearch: "moderate" },
        headers: { Accept: "application/json", "X-Subscription-Token": key },
    });

    const results = response?.data?.web?.results || [];
    const host = hostname.replace(/^www\./, "");

    return results
        .filter((result) => {
            try {
                const url = new URL(result.url);
                // Pages of that website only, not its home page.
                return url.hostname.replace(/^www\./, "").endsWith(host) && url.pathname.length > 1;
            } catch {
                return false;
            }
        })
        .map((result) => ({
            sourceUrl: result.url,
            title: stripTags(result.title).slice(0, 200),
            imageUrl: result.thumbnail?.original || result.thumbnail?.src || "",
            price: null,
            text: stripTags([result.description, ...(result.extra_snippets || [])].join(" ")).slice(0, 800),
            publishedAt: result.page_age || result.age || null,
        }));
}
