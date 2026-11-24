// backend/apps/property/services/externalListings/live/resultPageReader.js
//
// Reads the listing cards of a website's results page (HTML), without
// knowing the website: works on the usual markup of listing websites.
//
//   readResultPage(html, pageUrl, { hosts, linkPattern }) -> [card]
//   readResultPageWithNext(...) -> { cards, nextUrl }   (nextUrl: next results page or null)
//   card = { sourceUrl, title, imageUrl, price, text }
//
// 1. Structured data (JSON-LD ItemList / listings with url + name).
// 2. Cards: a link to another page of the website, inside a block that holds
//    a picture and a title, and no other listing link (the card).
// Pages that load their results with JavaScript have no cards in their
// HTML: they give an empty list (the caller then uses the search engine).

import * as cheerio from "cheerio";

const MAX_CARDS = 100;
const ASSET = /\.(jpe?g|png|gif|webp|svg|ico|css|js|json|xml|pdf|zip|mp4|woff2?)$/i;
// First path words of pages that are never one listing.
const NOT_LISTING = new Set([
    "login", "logout", "register", "signup", "signin", "account", "profile", "dashboard", "admin",
    "contact", "about", "terms", "privacy", "faq", "blog", "help", "search", "recherche", "page",
    "category", "categories", "tag", "tags", "publish", "deposer", "agences", "agence", "agents",
    "cgu", "mentions-legales", "a-propos", "conditions", "politique", "connexion", "inscription",
]);
const PRICE = /(\d{1,3}(?:[\s.  ]\d{3})+|\d{3,9})(?:[.,]\d{1,2})?\s*(?:dh|dhs|mad|dirhams?|درهم)/iu;

const clean = (value, max = 300) => String(value || "").replace(/\s+/g, " ").trim().slice(0, max);

/** Text of a block with a space between its parts ("Agadir" + "6 500 DH" -> "Agadir 6 500 DH"). */
const textOf = ($, element, max) =>
    clean(
        String($(element).html() || "")
            .replace(/<(script|style)[\s\S]*?<\/\1>/gi, " ")
            .replace(/<[^>]+>/g, " ")
            .replace(/&nbsp;/g, " ")
            .replace(/&amp;/g, "&")
            .replace(/&#39;|&apos;/g, "'")
            .replace(/&quot;/g, '"'),
        max,
    );
const stripWww = (host) => String(host || "").toLowerCase().replace(/^www\./, "");

function absolute(value, base) {
    try {
        const url = new URL(String(value || "").trim(), base);
        if (!/^https?:$/.test(url.protocol)) return null;
        url.hash = "";
        return url;
    } catch {
        return null;
    }
}

/** First real picture of a block (lazy-loading attributes included). */
function imageOf($, element, base) {
    const images = $(element).find("img, source").toArray();
    for (const image of images) {
        const node = $(image);
        const firstOfSet = (value) => String(value || "").split(",")[0]?.trim().split(" ")[0];
        const candidates = [
            node.attr("data-src"),
            node.attr("data-lazy-src"),
            node.attr("data-lazy"),
            node.attr("data-original"),
            node.attr("data-url"),
            node.attr("data-image"),
            node.attr("data-img"),
            node.attr("data-echo"),
            node.attr("lazy-src"),
            firstOfSet(node.attr("data-lazy-srcset")),
            firstOfSet(node.attr("data-srcset")),
            firstOfSet(node.attr("srcset")),
            node.attr("src"),
        ];
        for (const candidate of candidates) {
            if (!candidate || candidate.startsWith("data:")) continue;
            if (/logo|avatar|icon|sprite|placeholder|blank\.gif/i.test(candidate)) continue;
            const url = absolute(candidate, base);
            if (url) return url.href;
        }
    }
    // Lazy-loading scripts often keep the real picture in <noscript>.
    for (const noscript of $(element).find("noscript").toArray()) {
        const match = /<img[^>]+(?:data-src|src)=["']([^"']+)["']/i.exec($(noscript).html() || $(noscript).text() || "");
        if (match && !match[1].startsWith("data:")) {
            const url = absolute(match[1], base);
            if (url) return url.href;
        }
    }
    // Picture kept in a data attribute of a block (data-bg, data-background...).
    for (const node of $(element).find("[data-bg], [data-background], [data-background-image], [data-image-src]").toArray()) {
        const value = $(node).attr("data-bg") || $(node).attr("data-background") || $(node).attr("data-background-image") || $(node).attr("data-image-src");
        const match = /url\(["']?([^"')]+)["']?\)/i.exec(value || "");
        const url = absolute(match ? match[1] : value, base);
        if (url) return url.href;
    }
    // Background image set in a style attribute.
    const styled = $(element).find("[style*='background']").toArray().concat([element]);
    for (const node of styled) {
        const match = /url\(["']?([^"')]+)["']?\)/i.exec($(node).attr("style") || "");
        if (match) {
            const url = absolute(match[1], base);
            if (url) return url.href;
        }
    }
    return "";
}

function titleOf($, element, anchor) {
    const heading = $(element).find("h1, h2, h3, h4, h5, [class*='title'], [class*='titre']").first();
    return (
        (heading.length ? textOf($, heading.toArray()[0], 200) : "") ||
        clean($(anchor).attr("title"), 200) ||
        clean($(anchor).text(), 200) ||
        clean($(element).find("img").first().attr("alt"), 200)
    );
}

function priceOf(text) {
    const match = PRICE.exec(text);
    if (!match) return null;
    const number = Number(match[1].replace(/[\s.  ]/g, ""));
    return Number.isFinite(number) && number >= 100 && number <= 1e9 ? number : null;
}

/** Could this link be one listing of the website? */
export function looksLikeListingLink(url, page, hosts, linkPattern) {
    if (!url || !hosts.includes(stripWww(url.hostname))) return false;
    if (ASSET.test(url.pathname)) return false;
    if (linkPattern) return linkPattern.test(url.pathname + url.search);

    const segments = url.pathname.split("/").filter(Boolean);
    if (!segments.length) return false;
    if (NOT_LISTING.has(segments[0].toLowerCase()) || NOT_LISTING.has(segments.at(-1).toLowerCase())) return false;
    // The results page itself, its other pages and its filters.
    if (url.pathname.replace(/\/$/, "") === page.pathname.replace(/\/$/, "")) return false;
    if (/^(page|p)$/i.test(segments.at(-2) || "") || /[?&](page|p)=\d+/i.test(url.search)) return false;

    const last = decodeURIComponent(segments.at(-1));
    // A listing page usually has an id or a long descriptive slug.
    return /\d{3,}/.test(last) || last.split("-").length >= 4 || /^\d+$/.test(last);
}

/** JSON-LD listings of the results page. */
function structuredCards($, base, hosts) {
    const cards = [];
    const visit = (node) => {
        if (!node || typeof node !== "object" || cards.length >= MAX_CARDS) return;
        if (Array.isArray(node)) {
            node.forEach(visit);
            return;
        }
        const item = node.item && typeof node.item === "object" ? node.item : node;
        const url = absolute(item.url || item["@id"], base);
        if (url && hosts.includes(stripWww(url.hostname)) && item.name && url.pathname.length > 1) {
            const offer = Array.isArray(item.offers) ? item.offers[0] : item.offers;
            const image = Array.isArray(item.image) ? item.image[0] : item.image;
            cards.push({
                sourceUrl: url.href,
                title: clean(item.name, 200),
                imageUrl: absolute(typeof image === "string" ? image : image?.url, base)?.href || "",
                price: Number(offer?.price) || priceOf(clean(item.description, 500)),
                text: clean(`${item.name} ${item.description || ""} ${item.address?.addressLocality || ""}`, 600),
            });
        }
        for (const key of ["itemListElement", "@graph", "mainEntity", "item"]) {
            if (node[key] && node[key] !== item) visit(node[key]);
        }
        if (node.itemListElement === undefined && item !== node) visit(item);
    };

    $('script[type="application/ld+json"]').each((_index, element) => {
        try {
            visit(JSON.parse($(element).contents().text()));
        } catch {
            // Broken JSON-LD: ignored.
        }
    });
    return cards;
}

/** Address of the next results page, or null. */
function nextPageOf($, page, siteHosts) {
    const sameSite = (url) => url && siteHosts.includes(stripWww(url.hostname)) && url.href !== page.href;

    // 1. rel="next"
    for (const element of $('link[rel~="next"], a[rel~="next"]').toArray()) {
        const url = absolute($(element).attr("href"), page.href);
        if (sameSite(url)) return url.href;
    }
    // 2. A "next" button.
    const NEXT = /^(suivant|suivante|page suivante|next|next page|›|»|>|→|التالي|الصفحة التالية)$/i;
    for (const element of $("a[href]").toArray()) {
        const label = clean($(element).text() || $(element).attr("aria-label") || $(element).attr("title"), 40);
        if (NEXT.test(label) || /next|suivant/i.test(String($(element).attr("aria-label") || "") + String($(element).attr("class") || ""))) {
            const url = absolute($(element).attr("href"), page.href);
            if (sameSite(url)) return url.href;
        }
    }
    // 3. A link to page n+1 (?page=2, ?p=2, /page/2/).
    const currentQuery = Number(page.searchParams.get("page") || page.searchParams.get("p") || page.searchParams.get("pg") || 0);
    const currentPath = Number((/\/page\/(\d+)/i.exec(page.pathname) || [])[1] || 0);
    const wanted = Math.max(currentQuery, currentPath, 1) + 1;
    for (const element of $("a[href]").toArray()) {
        const url = absolute($(element).attr("href"), page.href);
        if (!sameSite(url)) continue;
        const queryPage = Number(url.searchParams.get("page") || url.searchParams.get("p") || url.searchParams.get("pg") || 0);
        const pathPage = Number((/\/page\/(\d+)/i.exec(url.pathname) || [])[1] || 0);
        const samePath = url.pathname.replace(/\/page\/\d+\/?$/i, "/").replace(/\/$/, "") === page.pathname.replace(/\/page\/\d+\/?$/i, "/").replace(/\/$/, "");
        if (samePath && (queryPage === wanted || pathPage === wanted)) return url.href;
    }
    return null;
}

export function readResultPage(html, pageUrl, options = {}) {
    return readResultPageWithNext(html, pageUrl, options).cards;
}

export function readResultPageWithNext(html, pageUrl, { hosts = [], linkPattern = null } = {}) {
    const $ = cheerio.load(String(html || ""));
    const page = new URL(pageUrl);
    const siteHosts = [...new Set([...hosts, page.hostname].map(stripWww))];

    const found = new Map();
    for (const card of structuredCards($, page.href, siteHosts)) {
        if (!found.has(card.sourceUrl)) found.set(card.sourceUrl, card);
    }

    // Links to listings, grouped by address.
    const anchorsByHref = new Map();
    $("a[href]").each((_index, anchor) => {
        const url = absolute($(anchor).attr("href"), page.href);
        if (!looksLikeListingLink(url, page, siteHosts, linkPattern)) return;
        const href = url.href;
        if (!anchorsByHref.has(href)) anchorsByHref.set(href, []);
        anchorsByHref.get(href).push(anchor);
    });

    for (const [href, anchors] of anchorsByHref) {
        if (found.size >= MAX_CARDS) break;
        if (found.has(href)) continue;

        // Climb from the link to the block of the card: it holds a picture
        // and no link to another listing.
        let card = null;
        let node = anchors[0];
        for (let depth = 0; depth < 7 && node; depth += 1) {
            const hrefsInside = new Set(
                $(node)
                    .find("a[href]")
                    .toArray()
                    .map((anchor) => absolute($(anchor).attr("href"), page.href)?.href)
                    .filter((value) => value && anchorsByHref.has(value)),
            );
            if (hrefsInside.size > 1) break;
            const hasPicture = $(node).find("img, picture, noscript, [style*='background'], [data-bg], [data-background], [data-background-image]").length > 0 || /background/i.test($(node).attr("style") || "");
            if (hasPicture && textOf($, node, 2000).length >= 15) card = node;
            node = node.parent;
        }
        if (!card) continue;

        const text = textOf($, card, 800);
        const title = titleOf($, card, anchors[0]);
        if (!title || title.length < 5) continue;

        found.set(href, {
            sourceUrl: href,
            title,
            imageUrl: imageOf($, card, page.href),
            price: priceOf(text),
            text,
        });
    }

    return { cards: [...found.values()].slice(0, MAX_CARDS), nextUrl: nextPageOf($, page, siteHosts) };
}
