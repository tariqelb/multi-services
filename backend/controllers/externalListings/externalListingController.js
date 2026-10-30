import crypto from "node:crypto";
// import { collectTestFixtures } from "../../services/externalListings/testFixtureCollector.js";
import ExternalListing from "../../DatabaseModels/Schema/ExternalListing.js";
import { collectAqariListings } from "../../services/externalListings/aqariCollector.js";

import {
    extractAqariListing,
    supportsAqariUrl,
} from "../../services/externalListings/sources/aqariSource.js";

import {
    extractPageMetadata,
} from "../../services/externalListings/metadataExtractor.js";

import {
    normalizeExternalListing,
} from "../../services/externalListings/listingNormalizer.js";

import {
    getListingSourceUrls,
    addListingSourceUrl,
    removeListingSourceUrl,
} from "../../services/externalListings/listingSourcesStore.js";



function createContentHash(data) {
    return crypto
        .createHash("sha256")
        .update(
            JSON.stringify({
                title: data.title,
                description: data.description,
                imageUrl: data.imageUrl,
                price: data.price,
                currency: data.currency,
                priceUnit: data.priceUnit,
            })
        )
        .digest("hex");
}

async function extractListing(url) {
    const metadata = supportsAqariUrl(url)
        ? await extractAqariListing(url)
        : normalizeExternalListing(
              await extractPageMetadata(url)
          );

    metadata.contentHash = createContentHash(metadata);

    return metadata;
}

function getErrorMessage(error) {
    return error instanceof Error
        ? error.message
        : "An unexpected error occurred.";
}

// POST /api/external-listings/preview
export async function previewExternalListing(
    req,
    res
) {
    try {
        const { url } = req.body;

        if (typeof url !== "string" || !url.trim()) {
            return res.status(400).json({
                success: false,
                message: "A source URL is required.",
            });
        }

        const preview = await extractListing(url.trim());

        return res.status(200).json({
            success: true,
            preview,
        });
    } catch (error) {
        return res.status(400).json({
            success: false,
            message: getErrorMessage(error),
        });
    }
}

// POST /api/external-listings
export async function createExternalListing(
    req,
    res
) {
    try {
        const { url, overrides = {} } = req.body;

        if (typeof url !== "string" || !url.trim()) {
            return res.status(400).json({
                success: false,
                message: "A source URL is required.",
            });
        }

        if (
            !overrides ||
            typeof overrides !== "object" ||
            Array.isArray(overrides)
        ) {
            return res.status(400).json({
                success: false,
                message: "Overrides must be an object.",
            });
        }

        const extracted = await extractListing(
            url.trim()
        );

        // Only allow known, editable listing fields.
        const allowedOverrides = [
            "title",
            "description",
            "imageUrl",
            "imageUrls",
            "price",
            "currency",
            "priceUnit",
            "listingType",
            "propertyType",
            "city",
            "neighborhood",
            "surface",
            "rooms",
            "bathrooms",
        ];

        const safeOverrides = {};

        for (const key of allowedOverrides) {
            if (
                Object.prototype.hasOwnProperty.call(
                    overrides,
                    key
                )
            ) {
                safeOverrides[key] = overrides[key];
            }
        }

        const data = normalizeExternalListing({
            ...extracted,
            ...safeOverrides,

            // Never let a client override source identity.
            sourceUrl: extracted.sourceUrl,
            sourceDomain: extracted.sourceDomain,
            sourceName: extracted.sourceName,
            sourceListingId: extracted.sourceListingId,
            extractionMethod:
                Object.keys(safeOverrides).length > 0
                    ? "manual"
                    : extracted.extractionMethod,
        });

        data.contentHash = createContentHash(data);

        const listing = await ExternalListing.findOneAndUpdate(
            {
                sourceUrl: data.sourceUrl,
            },
            {
                $set: data,
            },
            {
                new: true,
                upsert: true,
                runValidators: true,
                setDefaultsOnInsert: true,
            }
        );

        return res.status(201).json({
            success: true,
            message: "External listing saved.",
            listing,
        });
    } catch (error) {
        console.error(
            "Create external listing error:",
            error
        );

        return res.status(400).json({
            success: false,
            message: getErrorMessage(error),
        });
    }
}

// GET /api/external-listings
export async function getExternalListings(
    req,
    res
) {
    try {
        const page = Math.max(
            1,
            Number.parseInt(req.query.page, 10) || 1
        );

        const limit = Math.min(
            50,
            Math.max(
                1,
                Number.parseInt(req.query.limit, 10) || 12
            )
        );

        const filter = {
            status: "active",
        };

        if (req.query.city) {
            filter.city = {
                $regex: String(req.query.city)
                    .replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
                $options: "i",
            };
        }

        if (
            ["For Sale", "For Rent", "Unknown"].includes(
                req.query.listingType
            )
        ) {
            filter.listingType = req.query.listingType;
        }

        if (req.query.propertyType) {
            filter.propertyType = {
                $regex: String(req.query.propertyType)
                    .replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
                $options: "i",
            };
        }

        const [listings, total] = await Promise.all([
            ExternalListing.find(filter)
                .sort({ createdAt: -1 })
                .skip((page - 1) * limit)
                .limit(limit)
                .lean(),

            ExternalListing.countDocuments(filter),
        ]);

        return res.status(200).json({
            success: true,
            listings,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: getErrorMessage(error),
        });
    }
}

// GET /api/external-listings/:id
export async function getExternalListingById(
    req,
    res
) {
    try {
        const listing = await ExternalListing.findOne({
            _id: req.params.id,
            status: "active",
        });

        if (!listing) {
            return res.status(404).json({
                success: false,
                message: "External listing not found.",
            });
        }

        return res.status(200).json({
            success: true,
            listing,
        });
    } catch (error) {
        return res.status(400).json({
            success: false,
            message: getErrorMessage(error),
        });
    }
}

// PATCH /api/external-listings/:id/refresh
export async function refreshExternalListing(
    req,
    res
) {
    try {
        const listing = await ExternalListing.findById(
            req.params.id
        );

        if (!listing) {
            return res.status(404).json({
                success: false,
                message: "External listing not found.",
            });
        }

        const extracted = await extractListing(
            listing.sourceUrl
        );

        // Preserve fields that the administrator has
        // manually entered when the source doesn't provide them.
        const fields = [
            "title",
            "description",
            "imageUrl",
            "imageUrls",
            "price",
            "currency",
            "priceUnit",
            "listingType",
            "propertyType",
            "city",
            "neighborhood",
            "surface",
            "rooms",
            "bathrooms",
        ];

        for (const field of fields) {
            const currentValue = listing[field];
            const extractedValue = extracted[field];

            const isEmpty =
                currentValue === null ||
                currentValue === undefined ||
                currentValue === "";

            const extractedIsEmpty =
                extractedValue === null ||
                extractedValue === undefined ||
                extractedValue === "";

            if (isEmpty || !extractedIsEmpty) {
                // Only overwrite automatically extracted fields.
                // Manual overrides need their own provenance tracking
                // before refresh can safely overwrite them.
                if (
                    listing.extractionMethod !== "manual"
                ) {
                    listing[field] = extractedValue;
                }
            }
        }

        listing.lastCheckedAt = new Date();
        listing.lastSeenAt = new Date();
        listing.status = "active";
        listing.lastError = "";
        listing.contentHash = extracted.contentHash;

        await listing.save();

        return res.status(200).json({
            success: true,
            message: "External listing refreshed.",
            listing,
        });
    } catch (error) {
        return res.status(400).json({
            success: false,
            message: getErrorMessage(error),
        });
    }
}

// POST /api/external-listings/collect
export async function collectExternalListings(
    req,
    res
) {
    try {
        const listings = await ExternalListing.find({
            status: { $ne: "unavailable" },
        })
            .sort({ lastCheckedAt: 1 })
            .limit(10);

        const results = [];

        for (const listing of listings) {
            try {
                const extracted = await extractListing(
                    listing.sourceUrl
                );

                listing.lastCheckedAt = new Date();
                listing.lastSeenAt = new Date();
                listing.lastError = "";
                listing.status = "active";
                listing.contentHash = extracted.contentHash;

                // This collector records checks. It doesn't
                // replace administrator-entered fields.
                await listing.save();

                results.push({
                    id: listing._id,
                    success: true,
                });
            } catch (error) {
                listing.lastCheckedAt = new Date();
                listing.lastError = getErrorMessage(error);

                await listing.save();

                results.push({
                    id: listing._id,
                    success: false,
                    message: getErrorMessage(error),
                });
            }
        }

        return res.status(200).json({
            success: true,
            processed: results.length,
            results,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: getErrorMessage(error),
        });
    }
}

// POST /api/external-listings/collect-aqari
export async function collectAqariListingsController(req, res) {
    try {
        const result = await collectAqariListings();

        return res.status(200).json({
            success: true,
            message: "Aqari collection finished.",
            result,
        });
    } catch (error) {
        console.error("Aqari collection failed:", error);

        return res.status(500).json({
            success: false,
            message: getErrorMessage(error),
            error: error.message,
        });
    }
}




export async function getExternalListingSources(req, res) {
    try {
        const urls = await getListingSourceUrls();

        return res.status(200).json({
            success: true,
            count: urls.length,
            urls,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Could not load listing sources.",
        });
    }
}

export async function addExternalListingSource(req, res) {
    try {
        const result = await addListingSourceUrl(req.body.url);

        return res.status(result.added ? 201 : 200).json({
            success: true,
            message: result.added
                ? "Listing source added."
                : "This URL already exists.",
            ...result,
        });
    } catch (error) {
        return res.status(400).json({
            success: false,
            message: error.message,
        });
    }
}

export async function deleteExternalListingSource(req, res) {
    try {
        const removed = await removeListingSourceUrl(
            req.body.url
        );

        return res.status(200).json({
            success: true,
            removed,
            message: removed
                ? "Listing source removed."
                : "URL was not found.",
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Could not remove listing source.",
        });
    }
}