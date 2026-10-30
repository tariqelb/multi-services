import { extractPageMetadata } from "../metadataExtractor.js";
import { normalizeExternalListing } from "../listingNormalizer.js";
import { getListingSourceUrls } from "../listingSourcesStore.js";

const INITIAL_AQARI_URLS = [
    // Aqari Annonces
    "https://aqari-annonces.com/properties/frsa_dhhbia_llmstthmrin_oualaaialt_maison_moderne__avec_mqha_mjhz_balkaml_a_vendre_a_sidi_moumn_51",
    "https://aqari-annonces.com/properties/appartement_mmtaza_50",
    "https://aqari-annonces.com/properties/terrain_49",
    "https://aqari-annonces.com/properties/annonce_394ad2e7_48",
    "https://aqari-annonces.com/properties/diar_alsfa_aallfa_47",
    "https://aqari-annonces.com/properties/alrhma_aqama_rania_46",

    // Mr Semsar
    "https://www.mrsemsar.ma/listing/24",
    "https://www.mrsemsar.ma/listing/22",
    "https://www.mrsemsar.ma/listing/21",
    "https://www.mrsemsar.ma/listing/20",
    "https://www.mrsemsar.ma/listing/18",
    "https://www.mrsemsar.ma/listing/12",
];

const SUPPORTED_SOURCES = [
    {
        hostnames: ["aqari-annonces.com", "www.aqari-annonces.com"],
        pathPrefix: "/properties/",
        sourceName: "Aqari Annonces",
    },
    {
        hostnames: ["mrsemsar.ma", "www.mrsemsar.ma"],
        pathPrefix: "/listing/",
        sourceName: "Mr Semsar",
    },
];

/**
 * Identify a supported property listing URL.
 */
function getSourceConfig(inputUrl) {
    try {
        const url = new URL(inputUrl);

        if (url.protocol !== "https:") {
            return null;
        }

        return (
            SUPPORTED_SOURCES.find(
                (source) =>
                    source.hostnames.includes(
                        url.hostname.toLowerCase()
                    ) &&
                    url.pathname.startsWith(source.pathPrefix)
            ) || null
        );
    } catch {
        return null;
    }
}

/**
 * Backward-compatible alias for existing Aqari-specific imports.
 */
export function supportsAqariUrl(inputUrl) {
    const source = getSourceConfig(inputUrl);
    return source?.sourceName === "Aqari Annonces";
}

/**
 * Validate URLs from any supported external listing source.
 */
export function supportsExternalListingUrl(inputUrl) {
    return getSourceConfig(inputUrl) !== null;
}

/**
 * Return the configured URLs from both supported websites.
 *
 * This is a fixed list, not automatic discovery of newly published
 * listings. New URLs can be added to INITIAL_AQARI_URLS.
 */
export async function discoverAqariListings() {
    return getListingSourceUrls();
}

/**
 * Extract and normalize a listing from Aqari Annonces or Mr Semsar.
 *
 * The existing metadata extractor handles the page request and
 * metadata parsing. If a website renders its listing details only
 * through JavaScript, a source-specific parser may still be needed.
 */
export async function extractAqariListing(inputUrl) {
    const source = getSourceConfig(inputUrl);

    if (!source) {
        throw new Error(
            "Unsupported URL. Only configured Aqari Annonces and Mr Semsar listing URLs are allowed."
        );
    }

    // Network errors throw and are handled by the collector.
    const metadata = await extractPageMetadata(inputUrl);

    // null means the page loaded successfully, but no usable images
    // were found by the metadata extractor.
    if (
        !metadata ||
        !Array.isArray(metadata.imageUrls) ||
        metadata.imageUrls.length === 0
    ) {
        return null;
    }

    const url = new URL(inputUrl);

    const sourceListingId = url.pathname
        .split("/")
        .filter(Boolean)
        .pop();

    const listing = normalizeExternalListing({
        ...metadata,
        sourceUrl: url.href,
        sourceDomain: url.hostname.toLowerCase(),
        sourceName: source.sourceName,
        sourceListingId,
        extractionMethod:
            metadata.extractionMethod || "metadata",
    });

    // Do not save listings without images after normalization either.
    if (
        !listing ||
        !listing.imageUrl ||
        !Array.isArray(listing.imageUrls) ||
        listing.imageUrls.length === 0
    ) {
        return null;
    }

    return listing;
}

/**
 * Extract Aqari property image URLs from metadata.
 *
 * Kept available for future Aqari-specific image extraction.
 * Mr Semsar images are handled by the shared metadata extractor
 * until a dedicated parser is implemented.
 */
export function extractAqariImages(metadata = {}) {
    const candidates = [
        ...(Array.isArray(metadata.imageUrls)
            ? metadata.imageUrls
            : []),
        metadata.imageUrl,
        metadata.ogImage,
        metadata.image,
    ];

    return [
        ...new Set(
            candidates
                .filter((value) => typeof value === "string")
                .map((value) => value.trim())
                .filter((value) => {
                    try {
                        const url = new URL(
                            value,
                            "https://aqari-annonces.com"
                        );

                        return (
                            url.protocol === "https:" &&
                            [
                                "aqari-annonces.com",
                                "www.aqari-annonces.com",
                            ].includes(url.hostname.toLowerCase()) &&
                            url.pathname.startsWith(
                                "/storage/properties/"
                            ) &&
                            !/logo|favicon|placeholder|default/i.test(
                                url.pathname
                            )
                        );
                    } catch {
                        return false;
                    }
                })
        ),
    ];
}
