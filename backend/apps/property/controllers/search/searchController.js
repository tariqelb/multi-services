// backend/apps/property/controllers/search/searchController.js
//
// GET /api/property/search — one search across every kind of listing.
//
// Query (all optional):
//   services       comma list: unfurnished, furnished, roommate, establishment
//                  (empty = all)
//   city           city name (accents / case ignored, Tanger = Tangier...)
//   propertyType   Apartment, Villa, Land... (properties and roommates)
//   accommodationType  Hotel, Riad... (hotels & riads only)
//   transaction    sale | rent
//   rentalPeriod   daily | monthly (with rent)
//   priceMode      below | above | exact | between
//   price, priceMax   MAD
//   minRooms       at least this many rooms
//   q              words in the title or neighbourhood
//   sort           mixed (default: all kinds taken in turn, newest first)
//                  | newest | priceAsc | priceDesc
//   page, limit    (limit max 48)
//
// -> { results, pagination, counts }
//   results: the same shape for every kind (card + map marker):
//   { kind, id, title, price, priceUnit, city, neighborhood, image,
//     location, propertyType, listingType, rentalPeriod, furnishingStatus,
//     details, link, createdAt }
//
// Only what visitors may see: available properties, open / full roommate
// announcements, publishers not suspended. No phone or email.

import mongoose from "mongoose";

import Property from "../../models/Property.js";
import RoommateListing from "../../models/RoommateListing.js";
import Establishment from "../../models/Establishment.js";
import { getSuspendedUserIds } from "../../../main/services/accountStatus.js";

const COLLATION = { locale: "fr", strength: 1 };
const MAX_LIMIT = 48;
const MAX_MERGE = 480; // results read per kind to build one merged page

const FURNISHED_VALUES = ["Furnished", "Fully furnished", "Furnished property"];
const FURNISHABLE_TYPES = ["apartment", "house", "villa", "studio", "room"];

export const SERVICES = ["unfurnished", "furnished", "roommate", "establishment"];

const CITY_ALIASES = [
    ["tangier", "tanger", "tanja"],
    ["marrakesh", "marrakech"],
    ["fez", "fes", "fès"],
    ["casablanca", "casa"],
];

const clean = (value) => String(value ?? "").trim();
const isAny = (value) => ["", "all", "any"].includes(clean(value).toLowerCase());
const lower = (value) => clean(value).toLowerCase();

const number = (value) => {
    if (value === "" || value === null || value === undefined) return null;
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
};

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

function cityValues(city) {
    const key = city.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
    const group = CITY_ALIASES.find((aliases) => aliases.includes(key));
    return group ? [...new Set([city, ...group])] : [city];
}

/* --------------------------------------------------
   Reading the query
-------------------------------------------------- */

export function parseSearchQuery(query = {}) {
    const requested = clean(query.services)
        .split(",")
        .map(lower)
        .filter((service) => SERVICES.includes(service));

    const priceMode = ["below", "above", "exact", "between"].includes(lower(query.priceMode))
        ? lower(query.priceMode)
        : "";

    const limit = Math.min(MAX_LIMIT, Math.max(1, Number.parseInt(query.limit, 10) || 12));
    const page = Math.max(1, Number.parseInt(query.page, 10) || 1);

    return {
        services: requested.length ? [...new Set(requested)] : [...SERVICES],
        city: isAny(query.city) ? "" : clean(query.city).slice(0, 80),
        propertyType: isAny(query.propertyType) ? "" : clean(query.propertyType).slice(0, 60),
        accommodationType: isAny(query.accommodationType) ? "" : clean(query.accommodationType).slice(0, 60),
        transaction: ["sale", "rent"].includes(lower(query.transaction)) ? lower(query.transaction) : "",
        rentalPeriod: ["daily", "monthly"].includes(lower(query.rentalPeriod)) ? lower(query.rentalPeriod) : "",
        priceMode,
        price: number(query.price),
        priceMax: number(query.priceMax),
        minRooms: number(query.minRooms),
        q: clean(query.q).slice(0, 80),
        sort: ["newest", "priceAsc", "priceDesc"].includes(clean(query.sort)) ? clean(query.sort) : "mixed",
        page,
        limit,
    };
}

/**
 * Which kinds of listing can match these criteria.
 *   sale            -> properties only
 *   rent + monthly  -> properties, roommates
 *   rent + daily    -> properties, roommates, hotels & riads
 *   property type / minimum rooms -> no hotels & riads
 *   accommodation type            -> only hotels & riads
 */
export function kindsFor(criteria) {
    const kinds = new Set();

    if (criteria.services.includes("unfurnished") || criteria.services.includes("furnished")) kinds.add("property");
    if (criteria.services.includes("roommate")) kinds.add("roommate");
    if (criteria.services.includes("establishment")) kinds.add("establishment");

    if (criteria.transaction === "sale") {
        kinds.delete("roommate");
        kinds.delete("establishment");
    }

    if (criteria.rentalPeriod === "monthly") kinds.delete("establishment");

    // Property type and number of rooms describe homes, not hotels.
    if (criteria.propertyType || criteria.minRooms !== null) kinds.delete("establishment");

    if (criteria.accommodationType) {
        kinds.delete("property");
        kinds.delete("roommate");
    }

    return [...kinds];
}

function priceCondition({ priceMode, price, priceMax }) {
    if (!priceMode) return null;

    if (priceMode === "between") {
        const range = {};
        if (price !== null) range.$gte = price;
        if (priceMax !== null) range.$lte = priceMax;
        return Object.keys(range).length ? { searchPrice: range } : null;
    }

    if (price === null) return null;

    return {
        searchPrice: {
            below: { $lte: price },
            above: { $gte: price },
            exact: { $eq: price },
        }[priceMode],
    };
}

/* --------------------------------------------------
   One pipeline per kind
-------------------------------------------------- */

export function buildPipeline(kind, criteria, { suspendedIds = [] } = {}) {
    const match = [];

    if (suspendedIds.length) match.push({ userId: { $nin: suspendedIds } });

    const keyword = criteria.q ? new RegExp(escapeRegex(criteria.q), "i") : null;
    const cities = criteria.city ? cityValues(criteria.city) : null;

    if (kind === "property") {
        match.push({ status: { $in: ["Available", null] } });

        const wantsUnfurnished = criteria.services.includes("unfurnished");
        const wantsFurnished = criteria.services.includes("furnished");

        if (wantsFurnished && !wantsUnfurnished) match.push({ furnishingStatus: { $in: FURNISHED_VALUES } });
        if (wantsUnfurnished && !wantsFurnished) match.push({ furnishingStatus: { $nin: FURNISHED_VALUES } });

        if (criteria.transaction === "sale") match.push({ listingType: "For Sale" });
        if (criteria.transaction === "rent") match.push({ listingType: "For Rent" });

        if (criteria.rentalPeriod) {
            match.push({ listingType: "For Rent", rentalPeriod: criteria.rentalPeriod === "daily" ? "Daily" : "Monthly" });
        }

        if (criteria.propertyType) match.push({ propertyType: criteria.propertyType });
        if (cities) match.push({ city: { $in: cities } });
        if (criteria.minRooms !== null) match.push({ rooms: { $gte: criteria.minRooms } });
        if (keyword) match.push({ $or: [{ title: keyword }, { neighborhood: keyword }] });
    }

    if (kind === "roommate") {
        match.push({ status: { $in: ["Open", "Full"] } });

        // Monthly unless the announcement says daily.
        if (criteria.rentalPeriod === "daily") match.push({ rentalPeriod: "Daily" });
        if (criteria.rentalPeriod === "monthly") match.push({ rentalPeriod: { $in: ["Monthly", null] } });

        if (criteria.propertyType) match.push({ propertyType: criteria.propertyType });
        if (cities) match.push({ city: { $in: cities } });
        if (criteria.minRooms !== null) match.push({ rooms: { $gte: criteria.minRooms } });
        if (keyword) match.push({ $or: [{ title: keyword }, { neighborhood: keyword }] });
    }

    if (kind === "establishment") {
        if (criteria.accommodationType) match.push({ accommodationType: criteria.accommodationType });
        if (cities) match.push({ "location.city": { $in: cities } });
        if (keyword) match.push({ $or: [{ name: keyword }, { "location.neighborhood": keyword }] });
    }

    // One comparable price per kind.
    const searchPrice = {
        property: "$price",
        // price per person when known, otherwise the total rent
        roommate: {
            $cond: [{ $gt: ["$individualRoomPrice", 0] }, "$individualRoomPrice", "$totalRent"],
        },
        // cheapest room per night
        establishment: { $min: "$rooms.pricePerNight" },
    }[kind];

    const pipeline = [
        { $match: match.length ? { $and: match } : {} },
        { $addFields: { searchPrice } },
    ];

    const price = priceCondition(criteria);
    if (price) pipeline.push({ $match: price });

    const sort = {
        mixed: { createdAt: -1, _id: -1 },
        newest: { createdAt: -1, _id: -1 },
        priceAsc: { searchPrice: 1, createdAt: -1 },
        priceDesc: { searchPrice: -1, createdAt: -1 },
    }[criteria.sort];

    pipeline.push({
        $facet: {
            total: [{ $count: "count" }],
            items: [
                { $sort: sort },
                { $limit: Math.min(MAX_MERGE, criteria.page * criteria.limit) },
                { $project: PROJECTIONS[kind] },
            ],
        },
    });

    return pipeline;
}

const PROJECTIONS = {
    property: {
        title: 1, price: 1, searchPrice: 1, city: 1, neighborhood: 1, images: { $slice: ["$images", 1] },
        location: 1, propertyType: 1, listingType: 1, rentalPeriod: 1, furnishingStatus: 1,
        rooms: 1, bathrooms: 1, surface: 1, createdAt: 1,
    },
    roommate: {
        title: 1, totalRent: 1, individualRoomPrice: 1, searchPrice: 1, city: 1, neighborhood: 1,
        images: { $slice: ["$images", 1] }, location: 1, propertyType: 1, rentalPeriod: 1, furnishingStatus: 1,
        rooms: 1, totalPeople: 1, currentPeople: 1, purpose: 1, status: 1, createdAt: 1,
    },
    establishment: {
        name: 1, searchPrice: 1, location: 1, accommodationType: 1, officialClassification: 1,
        "media.coverPhoto": 1, "media.gallery": { $slice: ["$media.gallery", 1] }, numberOfRooms: 1, createdAt: 1,
    },
};

/* --------------------------------------------------
   Same shape for every kind
-------------------------------------------------- */

const imagePath = (image) => (typeof image === "string" ? image : image?.path || image?.url || "");

const coordinates = (location) => {
    const lat = Number(location?.lat);
    const lng = Number(location?.lng);
    return Number.isFinite(lat) && Number.isFinite(lng) && (lat !== 0 || lng !== 0) ? { lat, lng } : null;
};

const isFurnishedRental = (property) =>
    property.listingType === "For Rent" &&
    FURNISHED_VALUES.includes(property.furnishingStatus) &&
    FURNISHABLE_TYPES.includes(lower(property.propertyType));

export function normalizeResult(kind, doc) {
    const id = String(doc._id);
    const price = Number.isFinite(Number(doc.searchPrice)) ? Number(doc.searchPrice) : null;

    if (kind === "property") {
        const rent = doc.listingType === "For Rent";

        return {
            kind,
            id,
            title: doc.title || "",
            price,
            priceUnit: rent ? (doc.rentalPeriod === "Daily" ? "night" : "month") : "total",
            city: doc.city || "",
            neighborhood: doc.neighborhood || "",
            image: imagePath(doc.images?.[0]),
            location: coordinates(doc.location),
            propertyType: doc.propertyType || "",
            listingType: doc.listingType || "",
            rentalPeriod: doc.rentalPeriod || "",
            furnishingStatus: doc.furnishingStatus || "",
            details: { rooms: doc.rooms ?? null, bathrooms: doc.bathrooms ?? null, surface: doc.surface ?? null },
            link: isFurnishedRental(doc) ? `/furnishedproperties/${id}` : `/properties/${id}`,
            createdAt: doc.createdAt,
        };
    }

    if (kind === "roommate") {
        const places = Math.max(0, Number(doc.totalPeople || 0) - Number(doc.currentPeople || 0));

        return {
            kind,
            id,
            title: doc.title || "",
            price,
            priceUnit: doc.individualRoomPrice > 0 ? "person_month" : "month",
            city: doc.city || "",
            neighborhood: doc.neighborhood || "",
            image: imagePath(doc.images?.[0]),
            location: coordinates(doc.location),
            propertyType: doc.propertyType || "",
            listingType: "For Rent",
            rentalPeriod: doc.rentalPeriod || "Monthly",
            furnishingStatus: doc.furnishingStatus || "",
            details: { rooms: doc.rooms ?? null, availablePlaces: places, purpose: doc.purpose || "", full: doc.status === "Full" },
            link: `/roommates/${id}`,
            createdAt: doc.createdAt,
        };
    }

    return {
        kind,
        id,
        title: doc.name || "",
        price,
        priceUnit: "night",
        city: doc.location?.city || "",
        neighborhood: doc.location?.neighborhood || "",
        image: imagePath(doc.media?.coverPhoto) || imagePath(doc.media?.gallery?.[0]),
        location: coordinates(doc.location),
        propertyType: doc.accommodationType || "",
        listingType: "For Rent",
        rentalPeriod: "Daily",
        furnishingStatus: "",
        details: { classification: doc.officialClassification || "", rooms: doc.numberOfRooms ?? null },
        link: `/establishments/${id}`,
        createdAt: doc.createdAt,
    };
}

/** Merge the kinds into one ordered list. */
// Order used by the "mixed" sort: one of each kind in turn.
export const MIX_ORDER = ["unfurnished", "furnished", "roommate", "establishment"];

const mixKey = (result) => {
    if (result.kind !== "property") return result.kind;
    return result.link?.startsWith("/furnishedproperties") ? "furnished" : "unfurnished";
};

export function mergeResults(lists, sort) {
    const all = lists.flat();

    const byDate = (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
    const byPrice = (direction) => (a, b) => {
        if (a.price === null && b.price === null) return byDate(a, b);
        if (a.price === null) return 1;
        if (b.price === null) return -1;
        return direction * (a.price - b.price) || byDate(a, b);
    };

    if (sort === "priceAsc") return all.sort(byPrice(1));
    if (sort === "priceDesc") return all.sort(byPrice(-1));
    if (sort === "newest") return all.sort(byDate);

    // Mixed: newest of each kind, taken in turn, so no single kind fills the page.
    const buckets = MIX_ORDER.map((key) => all.filter((result) => mixKey(result) === key).sort(byDate));
    const mixed = [];
    for (let index = 0; mixed.length < all.length; index += 1) {
        buckets.forEach((bucket) => {
            if (index < bucket.length) mixed.push(bucket[index]);
        });
    }
    return mixed;
}

/**
 * Queries to run. In the mixed order, unfurnished and furnished properties are
 * fetched separately so each gets its full share of the merge window.
 */
export function sourcesFor(criteria) {
    return kindsFor(criteria).flatMap((kind) => {
        const both = criteria.services.includes("unfurnished") && criteria.services.includes("furnished");
        if (kind !== "property" || criteria.sort !== "mixed" || !both) return [{ kind, criteria }];
        return ["unfurnished", "furnished"].map((service) => ({
            kind,
            criteria: { ...criteria, services: criteria.services.filter((s) => s !== (service === "furnished" ? "unfurnished" : "furnished")) },
        }));
    });
}

/* --------------------------------------------------
   Route
-------------------------------------------------- */

const MODELS = {
    property: () => Property,
    roommate: () => RoommateListing,
    establishment: () => Establishment,
};

export const searchListings = async (req, res) => {
    try {
        const criteria = parseSearchQuery(req.query);
        const sources = sourcesFor(criteria);

        const suspendedIds = (await getSuspendedUserIds()).map((value) =>
            value instanceof mongoose.Types.ObjectId ? value : new mongoose.Types.ObjectId(String(value))
        );

        const answers = await Promise.all(
            sources.map(async ({ kind, criteria: sourceCriteria }) => {
                const [facet] = await MODELS[kind]()
                    .aggregate(buildPipeline(kind, sourceCriteria, { suspendedIds }))
                    .collation(COLLATION);

                return {
                    kind,
                    total: facet?.total?.[0]?.count || 0,
                    items: (facet?.items || []).map((doc) => normalizeResult(kind, doc)),
                };
            })
        );

        const counts = { property: 0, roommate: 0, establishment: 0 };
        answers.forEach(({ kind, total }) => {
            counts[kind] += total;
        });

        const total = answers.reduce((sum, answer) => sum + answer.total, 0);
        const merged = mergeResults(answers.map((answer) => answer.items), criteria.sort);
        const start = (criteria.page - 1) * criteria.limit;

        return res.status(200).json({
            results: merged.slice(start, start + criteria.limit),
            pagination: {
                page: criteria.page,
                limit: criteria.limit,
                total,
                // Deep pages of a merged list are capped.
                totalPages: Math.max(1, Math.min(Math.ceil(total / criteria.limit), Math.floor(MAX_MERGE / criteria.limit))),
            },
            counts,
        });
    } catch (error) {
        console.error("[Search] Error:", error);
        return res.status(500).json({ message: "Search failed. Please try again." });
    }
};
