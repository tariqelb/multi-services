
import axios from "axios";
import * as cheerio from "cheerio";

import {
    validateExternalUrl,
} from "./externalListingAccess.js";

const MAX_HTML_BYTES = 2 * 1024 * 1024;
const REQUEST_TIMEOUT = 10000;

const AQARI_HOSTS = new Set([
    "aqari-annonces.com",
    "www.aqari-annonces.com",
]);

const PROPERTY_IMAGE_PATH = "/storage/properties/";

function isDataImage(value) {
    return (
        typeof value === "string" &&
        /^data:image\//i.test(value.trim())
    );
}

function cleanText(value, maxLength = 10000) {
    if (typeof value !== "string") {
        return "";
    }

    return value
        .replace(/<[^>]*>/g, " ")
        .replace(/&nbsp;|&#160;/gi, " ")
        .replace(/&amp;/gi, "&")
        .replace(/&quot;/gi, '"')
        .replace(/&#39;|&apos;/gi, "'")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, maxLength);
}

function resolveUrl(value, baseUrl) {
    if (typeof value !== "string" || !value.trim()) {
        return "";
    }

    try {
        const resolved = new URL(value.trim(), baseUrl);

        if (!["http:", "https:"].includes(resolved.protocol)) {
            return "";
        }

        return resolved.href;
    } catch {
        return "";
    }
}

function findMeta($, selectors) {
    for (const selector of selectors) {
        const value = $(selector).first().attr("content");

        if (value) {
            return cleanText(value);
        }
    }

    return "";
}

function parseJsonLd($) {
    const results = [];

    $('script[type="application/ld+json"]').each(
        (_, element) => {
            try {
                const parsed = JSON.parse($(element).text());

                const collect = (item) => {
                    if (Array.isArray(item)) {
                        item.forEach(collect);
                        return;
                    }

                    if (!item || typeof item !== "object") {
                        return;
                    }

                    results.push(item);

                    if (item["@graph"]) {
                        collect(item["@graph"]);
                    }

                    // Handle common structured-data wrappers.
                    if (item.mainEntity) {
                        collect(item.mainEntity);
                    }
                };

                collect(parsed);
            } catch {
                // Ignore malformed JSON-LD.
            }
        }
    );

    return results;
}

function getImageUrls(value, baseUrl) {
    if (typeof value === "string") {
        const url = resolveUrl(value, baseUrl);
        return url ? [url] : [];
    }

    if (Array.isArray(value)) {
        return value.flatMap((item) =>
            getImageUrls(item, baseUrl)
        );
    }

    if (value && typeof value === "object") {
        return getImageUrls(
            value.url ||
                value.contentUrl ||
                value["@id"] ||
                "",
            baseUrl
        );
    }

    return [];
}

function isAqariHost(hostname) {
    return AQARI_HOSTS.has(hostname.toLowerCase());
}

function isUsefulImage(imageUrl, pageUrl) {
    try {
        const image = new URL(imageUrl);
        const page = new URL(pageUrl);

        if (!["https:", "http:"].includes(image.protocol)) {
            return false;
        }

        // Only accept images hosted on Aqari for Aqari pages.
        if (isAqariHost(page.hostname)) {
            if (!isAqariHost(image.hostname)) {
                return false;
            }

            // Prefer actual property uploads over logos and icons.
            if (
                image.pathname.startsWith(PROPERTY_IMAGE_PATH) &&
                !/logo|favicon|placeholder|default-image|avatar/i.test(
                    image.pathname
                )
            ) {
                return true;
            }

            return false;
        }

        return !/logo|favicon|placeholder|default-image|avatar/i.test(
            image.pathname
        );
    } catch {
        return false;
    }
}
function extractPageImages($, jsonLd, pageUrl) {
    const candidates = [];

    // 1. Open Graph and Twitter metadata.
    candidates.push(
        findMeta($, [
            'meta[property="og:image"]',
            'meta[property="og:image:url"]',
            'meta[property="og:image:secure_url"]',
            'meta[name="twitter:image"]',
            'meta[name="twitter:image:src"]',
            'meta[itemprop="image"]',
        ])
    );

    $('meta[property="og:image"], meta[name="twitter:image"]').each(
        (_, element) => {
            const value =
                $(element).attr("content") ||
                $(element).attr("value");

            if (value) candidates.push(value);
        }
    );

    // 2. Extract images from JSON-LD.
    for (const item of jsonLd || []) {
        candidates.push(
            ...getImageUrls(item.image, pageUrl),
            ...getImageUrls(item.photo, pageUrl),
            ...getImageUrls(item.thumbnailUrl, pageUrl),
            ...getImageUrls(item.contentUrl, pageUrl),
        );

        if (item.offers) {
            candidates.push(
                ...getImageUrls(item.offers.image, pageUrl)
            );
        }

        // Support nested graph entities.
        if (Array.isArray(item["@graph"])) {
            for (const entity of item["@graph"]) {
                candidates.push(
                    ...getImageUrls(entity.image, pageUrl),
                    ...getImageUrls(entity.photo, pageUrl),
                    ...getImageUrls(entity.thumbnailUrl, pageUrl),
                    ...getImageUrls(entity.contentUrl, pageUrl),
                );
            }
        }
    }

    // 3. Extract image URLs from HTML attributes.
    const imageAttributes = [
        "src",
        "data-src",
        "data-original",
        "data-lazy-src",
        "data-original-src",
        "data-image",
        "data-image-src",
        "data-url",
        "data-fancybox",
        "data-large_image",
        "data-thumb",
        "content",
        "poster",
    ];

    const srcsetAttributes = [
        "srcset",
        "data-srcset",
        "data-lazy-srcset",
    ];

    $("img, source, a, [style]").each((_, element) => {
        const node = $(element);

        for (const attribute of imageAttributes) {
            const value = node.attr(attribute);

            if (value && !isDataImage(value)) {
                candidates.push(value);
            }
        }

        for (const attribute of srcsetAttributes) {
            const value = node.attr(attribute);

            if (!value) continue;

            for (const entry of value.split(",")) {
                const candidate = entry.trim().split(/\s+/)[0];

                if (candidate && !isDataImage(candidate)) {
                    candidates.push(candidate);
                }
            }
        }

        // Extract CSS background-image URLs.
        const style = node.attr("style") || "";
        const backgroundPattern =
            /background(?:-image)?\s*:[^;]*?url\(\s*['"]?([^'")]+)['"]?\s*\)/gi;

        for (const match of style.matchAll(backgroundPattern)) {
            if (match[1] && !isDataImage(match[1])) {
                candidates.push(match[1]);
            }
        }
    });

    // 4. Find image URLs embedded in HTML or inline scripts.
    const html = $.html();

    const absoluteImagePattern =
        /https?:\\?\/\\?\/[^"'\\\s<>]+?\.(?:jpg|jpeg|png|webp|avif)(?:\?[^"'\\\s<>]*)?/gi;

    const relativeImagePattern =
        /(?:\/[^"'\\\s<>]+?)\.(?:jpg|jpeg|png|webp|avif)(?:\?[^"'\\\s<>]*)?/gi;

    for (const match of html.matchAll(absoluteImagePattern)) {
        candidates.push(match[0]);
    }

    for (const match of html.matchAll(relativeImagePattern)) {
        candidates.push(match[0]);
    }

    // 5. Normalize and validate image URLs.
    const excludedImagePattern =
        /(?:^|[/_.-])(logo|favicon|placeholder|default-image|avatar|sprite|icon|loader|spinner)(?:[/_.-]|$)/i;

    const page = new URL(pageUrl);
    const normalized = [];

    for (const candidate of candidates) {
        if (typeof candidate !== "string") continue;

        const cleaned = candidate
            .trim()
            .replace(/\\\//g, "/")
            .replace(/&amp;/g, "&");

        // Never accept Base64 or other data URI placeholders.
        if (isDataImage(cleaned) || /^data:/i.test(cleaned)) {
            continue;
        }

        const resolved = resolveUrl(cleaned, pageUrl);

        if (!resolved) continue;

        try {
            const image = new URL(resolved);

            if (!["https:", "http:"].includes(image.protocol)) {
                continue;
            }

            if (image.username || image.password) {
                continue;
            }

            if (excludedImagePattern.test(image.pathname)) {
                continue;
            }

            // Keep Aqari images restricted to its property-upload path.
            if (isAqariHost(page.hostname)) {
                if (
                    !isAqariHost(image.hostname) ||
                    !image.pathname.startsWith(PROPERTY_IMAGE_PATH)
                ) {
                    continue;
                }
            }

            normalized.push(image.href);
        } catch {
            // Ignore malformed image URLs.
        }
    }

    return [
        ...new Set(
            normalized.filter((imageUrl) =>
                isUsefulImage(imageUrl, pageUrl)
            )
        ),
    ].slice(0, 30);
}

function findStructuredListing(jsonLd) {
    const preferredTypes = [
        "RealEstateListing",
        "Product",
        "Residence",
        "Landform",
        "Apartment",
        "House",
        "SingleFamilyResidence",
        "Accommodation",
    ];

    return (
        jsonLd.find((item) => {
            const types = Array.isArray(item["@type"])
                ? item["@type"]
                : [item["@type"]];

            return types.some((type) =>
                preferredTypes.includes(type)
            );
        }) || null
    );
}

function parsePrice(value) {
    if (
        value === null ||
        value === undefined ||
        value === ""
    ) {
        return null;
    }

    if (typeof value === "number") {
        return Number.isFinite(value) && value >= 0
            ? value
            : null;
    }

    // Do not guess the meaning of ambiguous localized separators.
    const normalized = String(value)
        .replace(/\s/g, "")
        .replace(/[^\d.,]/g, "");

    if (!normalized || !/\d/.test(normalized)) {
        return null;
    }

    let numeric = normalized;

    if (numeric.includes(",") && numeric.includes(".")) {
        const lastComma = numeric.lastIndexOf(",");
        const lastDot = numeric.lastIndexOf(".");

        numeric =
            lastComma > lastDot
                ? numeric.replace(/\./g, "").replace(",", ".")
                : numeric.replace(/,/g, "");
    } else if (numeric.includes(",")) {
        const parts = numeric.split(",");

        numeric =
            parts.length === 2 && parts[1].length <= 2
                ? numeric.replace(",", ".")
                : numeric.replace(/,/g, "");
    }

    const price = Number(numeric);

    return Number.isFinite(price) && price >= 0
        ? price
        : null;
}

function parseNumber(value) {
    if (value === null || value === undefined || value === "") {
        return null;
    }

    const match = String(value).match(/\d+(?:[.,]\d+)?/);

    if (!match) return null;

    const number = Number(match[0].replace(",", "."));

    return Number.isFinite(number) && number >= 0
        ? number
        : null;
}

function extractAqariDetails($) {
    const text = cleanText($("body").text(), 30000);

    const priceMatch = text.match(
        /([\d][\d\s.,]*)\s*(?:MAD|DH|DHS|درهم)/i
    );

    const surfaceMatch = text.match(
        /([\d][\d\s.,]*)\s*(?:m²|m2|م²|متر مربع)/i
    );

    const roomsMatch = text.match(
        /(\d+)\s*(?:chambres?|rooms?|غرف(?:ة)?)/i
    );

    const bathroomsMatch = text.match(
        /(\d+)\s*(?:salles?\s*de\s*bain|bathrooms?|حمامات?)/i
    );

    const bodyText = text.slice(0, 10000);

    return {
        price: priceMatch ? parsePrice(priceMatch[1]) : null,
        surface: surfaceMatch
            ? parseNumber(surfaceMatch[1])
            : null,
        rooms: roomsMatch ? Number(roomsMatch[1]) : null,
        bathrooms: bathroomsMatch
            ? Number(bathroomsMatch[1])
            : null,
        bodyText,
    };
}

export async function extractPageMetadata(inputUrl) {
    const validatedUrl = await validateExternalUrl(inputUrl);

    const response = await axios.get(validatedUrl.href, {
        timeout: REQUEST_TIMEOUT,
        maxRedirects: 0,
        responseType: "text",
        maxContentLength: MAX_HTML_BYTES,
        maxBodyLength: MAX_HTML_BYTES,
        validateStatus: (status) =>
            status >= 200 && status < 300,
        headers: {
            Accept: "text/html,application/xhtml+xml",
            "User-Agent":
                "Mozilla/5.0 (compatible; MultiServicesListingCollector/1.0)",
        },
    });

    const contentType = response.headers["content-type"] || "";

    if (!contentType.toLowerCase().includes("text/html")) {
        throw new Error("The source did not return an HTML page.");
    }

    if (
        typeof response.data !== "string" ||
        Buffer.byteLength(response.data, "utf8") > MAX_HTML_BYTES
    ) {
        throw new Error("The source page exceeds the allowed size.");
    }

    const $ = cheerio.load(response.data);

    const jsonLd = parseJsonLd($);
    const structured = findStructuredListing(jsonLd);
    const isAqari = isAqariHost(validatedUrl.hostname);

    const title =
        cleanText(structured?.name, 500) ||
        findMeta($, [
            'meta[property="og:title"]',
            'meta[name="twitter:title"]',
        ]) ||
        cleanText($("h1").first().text(), 500) ||
        cleanText($("title").first().text(), 500);

    const description =
        cleanText(structured?.description, 10000) ||
        findMeta($, [
            'meta[property="og:description"]',
            'meta[name="description"]',
            'meta[name="twitter:description"]',
        ]) ||
        cleanText(
            $('[itemprop="description"]').first().text(),
            10000
        );

    const canonicalHref = resolveUrl(
        $('link[rel="canonical"]').first().attr("href"),
        validatedUrl.href
    );

    // Extract usable images. Skip the listing if none are found.
    const imageUrls = extractPageImages(
        $,
        jsonLd,
        validatedUrl.href
    );

    if (
        !Array.isArray(imageUrls) ||
        imageUrls.length === 0
    ) {
        return null;
    }

    const offerValue = structured?.offers;
    const offer = Array.isArray(offerValue)
        ? offerValue[0]
        : offerValue;

    const structuredPrice =
        offer?.price ??
        offer?.lowPrice ??
        structured?.price ??
        null;

    const aqariDetails = isAqari
        ? extractAqariDetails($)
        : {};

    const price =
        parsePrice(structuredPrice) ??
        (isAqari ? aqariDetails.price : null);

    const currency =
        offer?.priceCurrency ||
        structured?.priceCurrency ||
        "MAD";

    const address = structured?.address;

    const city =
        typeof address === "object" && address !== null
            ? cleanText(address.addressLocality, 200)
            : "";

    const neighborhood =
        typeof address === "object" && address !== null
            ? cleanText(
                  address.neighborhood ||
                      address.streetAddress,
                  200
              )
            : "";

    return {
        sourceUrl: canonicalHref || validatedUrl.href,
        fetchedUrl: validatedUrl.href,
        sourceDomain: validatedUrl.hostname,
        sourceName: validatedUrl.hostname.replace(/^www\./, ""),

        title: title || "Property listing",
        description: description || "",

        imageUrl: imageUrls[0],
        imageUrls,

        price,
        currency,

        city,
        neighborhood,

        surface:
            parseNumber(structured?.floorSize?.value) ??
            parseNumber(structured?.floorSize) ??
            aqariDetails.surface ??
            null,

        rooms:
            parseNumber(structured?.numberOfRooms) ??
            aqariDetails.rooms ??
            null,

        bathrooms:
            parseNumber(structured?.numberOfBathroomsTotal) ??
            aqariDetails.bathrooms ??
            null,

        extractionMethod: structured
            ? "structured_data"
            : "metadata",
    };
}
