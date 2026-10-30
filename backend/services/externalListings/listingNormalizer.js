const LISTING_TYPES = new Set([
    "For Sale",
    "For Rent",
    "Unknown",
]);

const EXTRACTION_METHODS = new Set([
    "metadata",
    "structured_data",
    "source_parser",
    "manual",
]);

function cleanText(value, maxLength = 5000) {
    if (typeof value !== "string") {
        return "";
    }

    return value.trim().slice(0, maxLength);
}

function normalizeNumber(value) {
    if (
        value === null ||
        value === undefined ||
        value === ""
    ) {
        return null;
    }

    const number = Number(value);

    return Number.isFinite(number) && number >= 0
        ? number
        : null;
}

function normalizeDate(value) {
    if (!value) {
        return null;
    }

    const date = new Date(value);

    return Number.isNaN(date.getTime())
        ? null
        : date;
}

function normalizeImageUrl(value) {
    if (!value) {
        return "";
    }

    try {
        const url = new URL(value);

        if (
            !["http:", "https:"].includes(url.protocol)
        ) {
            return "";
        }

        return url.href;
    } catch {
        return "";
    }
}

export function normalizeExternalListing(data) {
    const url = new URL(data.sourceUrl);

    if (!["http:", "https:"].includes(url.protocol)) {
        throw new Error("Unsupported source URL.");
    }

    const listingType = LISTING_TYPES.has(
        data.listingType
    )
        ? data.listingType
        : "Unknown";

    const extractionMethod = EXTRACTION_METHODS.has(
        data.extractionMethod
    )
        ? data.extractionMethod
        : "metadata";

    const imageUrls = Array.isArray(data.imageUrls)
        ? [
              ...new Set(
                  data.imageUrls
                      .map(normalizeImageUrl)
                      .filter(Boolean)
              ),
          ].slice(0, 20)
        : [];

    const imageUrl =
        normalizeImageUrl(data.imageUrl) ||
        imageUrls[0] ||
        "";

    return {
        sourceUrl: url.href,

        sourceDomain: url.hostname.toLowerCase(),

        sourceName: cleanText(data.sourceName, 200),

        sourceListingId: cleanText(
            data.sourceListingId,
            200
        ),

        title: cleanText(data.title, 500),

        description: cleanText(
            data.description,
            10000
        ),

        imageUrl,

        imageUrls,

        price: normalizeNumber(data.price),

        currency: cleanText(
            data.currency || "MAD",
            10
        ),

        priceUnit: cleanText(data.priceUnit, 50),

        listingType,

        propertyType: cleanText(
            data.propertyType,
            100
        ),

        city: cleanText(data.city, 100),

        neighborhood: cleanText(
            data.neighborhood,
            150
        ),

        surface: normalizeNumber(data.surface),

        rooms: normalizeNumber(data.rooms),

        bathrooms: normalizeNumber(data.bathrooms),

        publishedAt: normalizeDate(data.publishedAt),

        lastCheckedAt: new Date(),

        lastSeenAt: new Date(),

        contentHash: cleanText(
            data.contentHash,
            128
        ),

        status: "active",

        extractionMethod,

        lastError: "",
    };
}