// backend/apps/vehicles/controllers/externalListings/externalListingController.js
//
// Vehicle listings collected from other websites (Admin > Vehicles >
// External listings), shown in Vehicles > External listings > All listings.
//
//   GET  /api/vehicles/external-listings
//        ?q=&category=car|moto|part&listingType=sale|rent&make=&city=&source=
//        &minPrice=&maxPrice=&minYear=&maxMileage=&sort=newest|priceAsc|priceDesc&page=&limit=
//        -> { listings, pagination, facets: { sources, makes, cities } }
//   GET  /api/vehicles/external-listings/:id
//   POST /api/vehicles/external-listings/:id/click     a visitor opened it on its website
//   POST /api/vehicles/external-listings/refresh        (admin) re-read the 10 oldest
//   POST /api/vehicles/external-listings/cleanup        (admin) remove listings that are not vehicles

import mongoose from "mongoose";

import VehicleExternalListing from "../../models/VehicleExternalListing.js";
import { runExternalListingsJob } from "../../jobs/externalListingsRefreshJob.js";
import { isBotRequest } from "../../../main/utils/analytics.js";
import { checkVehicleListing, REJECT_REASONS } from "../../services/externalListings/vehicleCheck.js";
import { removeListings } from "../../services/externalListings/removedListings.js";
import { recordEvent } from "../statsTrackingController.js";

const CATEGORIES = ["car", "moto", "part"];
const LISTING_TYPES = ["sale", "rent"];
const SORTS = {
    newest: { createdAt: -1 },
    priceAsc: { price: 1, createdAt: -1 },
    priceDesc: { price: -1, createdAt: -1 },
};

const escapeRegex = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const number = (value) => {
    if (value === undefined || value === null || value === "") return null;
    const parsed = Number(String(value).replace(/[\s,]/g, ""));
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
};
const errorMessage = (error) => (error instanceof Error ? error.message : "An unexpected error occurred.");

/** Query string -> MongoDB filter (active listings only). */
export function buildListFilter(query = {}) {
    const filter = { status: "active" };
    const and = [];

    if (CATEGORIES.includes(query.category)) filter.category = query.category;
    if (LISTING_TYPES.includes(query.listingType)) filter.listingType = query.listingType;
    if (query.make) filter.make = new RegExp(`^${escapeRegex(String(query.make).trim().slice(0, 60))}$`, "i");
    if (query.city && query.city !== "all") filter.city = new RegExp(`^${escapeRegex(String(query.city).trim().slice(0, 100))}$`, "i");
    if (query.source && query.source !== "all") {
        const host = String(query.source).trim().toLowerCase().replace(/^www\./, "").slice(0, 100);
        filter.sourceDomain = { $in: [host, `www.${host}`] };
    }

    const minPrice = number(query.minPrice);
    const maxPrice = number(query.maxPrice);
    if (minPrice !== null || maxPrice !== null) {
        filter.price = { ...(minPrice !== null ? { $gte: minPrice } : {}), ...(maxPrice !== null ? { $lte: maxPrice } : {}) };
    }
    const minYear = number(query.minYear);
    if (minYear) filter.year = { $gte: minYear };
    const maxMileage = number(query.maxMileage);
    if (maxMileage !== null) filter.mileage = { $lte: maxMileage };

    const text = String(query.q || "").trim().slice(0, 100);
    if (text) {
        const pattern = new RegExp(escapeRegex(text), "i");
        and.push({ $or: [{ title: pattern }, { make: pattern }, { model: pattern }, { city: pattern }, { description: pattern }] });
    }
    if (and.length) filter.$and = and;
    return filter;
}

// GET /api/vehicles/external-listings
export async function getExternalListings(req, res) {
    try {
        const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
        const limit = Math.min(50, Math.max(1, Number.parseInt(req.query.limit, 10) || 12));
        const filter = buildListFilter(req.query);
        const sort = SORTS[req.query.sort] || SORTS.newest;

        const [listings, total, sources, makes, cities] = await Promise.all([
            VehicleExternalListing.find(filter)
                .select("-description -contentHash -lastError")
                .sort(sort)
                .skip((page - 1) * limit)
                .limit(limit)
                .lean(),
            VehicleExternalListing.countDocuments(filter),
            // Filter choices: every active listing (not only this page).
            VehicleExternalListing.aggregate([
                { $match: { status: "active" } },
                { $group: { _id: "$sourceDomain", sourceName: { $first: "$sourceName" }, count: { $sum: 1 } } },
                { $sort: { count: -1 } },
            ]),
            VehicleExternalListing.distinct("make", { status: "active", make: { $ne: "" } }),
            VehicleExternalListing.distinct("city", { status: "active", city: { $ne: "" } }),
        ]);

        return res.status(200).json({
            success: true,
            listings,
            pagination: { page, limit, total, pages: Math.max(1, Math.ceil(total / limit)) },
            facets: {
                sources: sources.map((source) => ({
                    hostname: String(source._id || "").replace(/^www\./, ""),
                    sourceName: source.sourceName || String(source._id || "").replace(/^www\./, ""),
                    count: source.count,
                })),
                makes: makes.sort((a, b) => a.localeCompare(b)),
                cities: cities.sort((a, b) => a.localeCompare(b)),
            },
        });
    } catch (error) {
        console.error("[VehicleExternalListings] List error:", error);
        return res.status(500).json({ success: false, message: "Could not load the external listings." });
    }
}

// GET /api/vehicles/external-listings/:id
export async function getExternalListingById(req, res) {
    try {
        if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ success: false, message: "Invalid listing ID." });
        const listing = await VehicleExternalListing.findOne({ _id: req.params.id, status: "active" }).lean();
        if (!listing) return res.status(404).json({ success: false, message: "External listing not found." });
        return res.status(200).json({ success: true, listing });
    } catch (error) {
        return res.status(400).json({ success: false, message: errorMessage(error) });
    }
}

// POST /api/vehicles/external-listings/:id/click
export async function trackExternalListingClick(req, res) {
    try {
        if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ success: false, message: "Invalid listing ID." });
        if (isBotRequest(req)) return res.status(200).json({ success: true, counted: false });

        const listing = await VehicleExternalListing.findOneAndUpdate(
            { _id: req.params.id, status: "active" },
            { $inc: { clicks: 1 }, $set: { lastClickedAt: new Date() } },
            { returnDocument: "after" },
        )
            .select("clicks title category listingType make model city price sourceDomain")
            .lean();
        if (!listing) return res.status(404).json({ success: false, message: "External listing not found." });

        // Dated event for Vehicles › Statistics (the counter above is the lifetime total).
        try {
            await recordEvent(req, {
                kind: "external",
                itemId: listing._id,
                details: {
                    itemType: "external",
                    title: listing.title || "",
                    category: listing.category || "",
                    listingType: listing.listingType || "",
                    make: listing.make || "",
                    model: listing.model || "",
                    city: listing.city || "",
                    price: listing.price || 0,
                    sourceDomain: listing.sourceDomain || "",
                },
            });
        } catch (eventError) {
            console.error("[VehicleExternalListings] click event", eventError.message);
        }

        return res.status(200).json({ success: true, counted: true, clicks: listing.clicks });
    } catch (error) {
        return res.status(500).json({ success: false, message: errorMessage(error) });
    }
}

/**
 * Saved listings that are not vehicles (apartments collected from general
 * classifieds websites, pages without a real title).
 * Pure helper, exported for tests.
 */
export function findNonVehicleListings(listings = []) {
    const rejected = [];
    for (const listing of listings) {
        const check = checkVehicleListing(listing);
        if (!check.ok) rejected.push({ listing, reason: check.reason });
    }
    return rejected;
}

// POST /api/vehicles/external-listings/cleanup (admin)
// body { dryRun?: boolean } -> removes saved listings that are not vehicles
// and remembers them so the collector never adds them again.
export async function cleanupNonVehicleListings(req, res, deps = {}) {
    const Model = deps.Model || VehicleExternalListing;
    const remove = deps.removeImpl || removeListings;
    const dryRun = req.body?.dryRun === true || req.body?.dryRun === "true";

    try {
        const listings = await Model.find({})
            .select("_id title description sourceUrl sourceDomain sourceName make")
            .lean();

        const rejected = findNonVehicleListings(listings);
        const reasonById = {};
        for (const { listing, reason } of rejected) {
            reasonById[String(listing._id)] = REJECT_REASONS[reason] || REJECT_REASONS["not-vehicle"];
        }

        const removed = dryRun
            ? 0
            : await remove(rejected.map(({ listing }) => listing), {
                  reasonById,
                  removedBy: req.user?.email || "admin",
              });

        const bySite = {};
        for (const { listing } of rejected) {
            const site = listing.sourceName || listing.sourceDomain || "?";
            bySite[site] = (bySite[site] || 0) + 1;
        }

        return res.status(200).json({
            success: true,
            dryRun,
            checked: listings.length,
            found: rejected.length,
            removed,
            bySite,
            examples: rejected.slice(0, 10).map(({ listing, reason }) => ({
                title: listing.title,
                sourceUrl: listing.sourceUrl,
                sourceName: listing.sourceName || listing.sourceDomain,
                reason,
            })),
        });
    } catch (error) {
        console.error("[VehicleExternalListings] Cleanup failed:", error);
        return res.status(500).json({ success: false, message: "Could not clean up the listings." });
    }
}

// POST /api/vehicles/external-listings/refresh (admin)
export async function refreshExternalListings(req, res) {
    try {
        const summary = await runExternalListingsJob();
        return res.status(200).json({ success: true, message: "External listings refreshed.", summary });
    } catch (error) {
        console.error("[VehicleExternalListings] Refresh failed:", error);
        return res.status(500).json({ success: false, message: "Failed to refresh the external listings." });
    }
}
