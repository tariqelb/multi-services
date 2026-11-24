// backend/apps/vehicles/controllers/vehicleSearchController.js
//
// GET /api/vehicles/search — one search across cars, motos & bikes and spare
// parts (same idea as GET /api/property/search).
//
// Query (all optional):
//   services       comma list: car, moto, part (empty = all)
//   city           city name (accents / case ignored, Tanger = Tangier...)
//   transaction    sale | rent (spare parts are only sold)
//   make, model    vehicle make / model; for spare parts: the vehicles the
//                  part fits (universal parts always match)
//   condition      new | used | refurbished (refurbished: spare parts only)
//   fuel           diesel, petrol... (cars and motos only)
//   minYear        vehicles from this year (cars and motos only)
//   partCategory   engine, brakes... (spare parts only)
//   priceMode      below | above | exact | between
//   price, priceMax   MAD (sale price, price per day, or price of one part)
//   q              words in the title, make, model, brand, reference, neighbourhood
//   sort           mixed (default: one of each kind in turn, newest first)
//                  | newest | priceAsc | priceDesc
//   page, limit    (limit max 48)
//
// -> { results, pagination, counts }
//   results: the same shape for every kind (card + map marker):
//   { kind, id, title, price, priceUnit, city, neighborhood, image, location,
//     listingType, details, link, createdAt }
//
// Only what visitors may see: available listings, publishers not suspended.
// No phone or email.

import mongoose from "mongoose";

import Vehicle from "../models/Vehicle.js";
import SparePart from "../models/SparePart.js";
import { getSuspendedUserIds } from "../../main/services/accountStatus.js";
import { ALL_FUELS, CONDITIONS } from "../utils/vehicleOptions.js";
import { PART_CATEGORIES, PART_CONDITIONS } from "../utils/sparePartOptions.js";

const COLLATION = { locale: "fr", strength: 1 };
const MAX_LIMIT = 48;
const MAX_MERGE = 480; // results read per kind to build one merged page

export const SEARCH_SERVICES = ["car", "moto", "part"];

const CITY_ALIASES = [
    ["tangier", "tanger", "tanja"],
    ["marrakesh", "marrakech"],
    ["fez", "fes", "fès"],
    ["casablanca", "casa"],
];

const clean = (value) => String(value ?? "").trim();
const lower = (value) => clean(value).toLowerCase();
const isAny = (value) => ["", "all", "any"].includes(lower(value));

const number = (value) => {
    if (value === "" || value === null || value === undefined) return null;
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
};

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const exact = (value) => new RegExp(`^${escapeRegex(value)}$`, "i");

function cityValues(city) {
    const key = city.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
    const group = CITY_ALIASES.find((aliases) => aliases.includes(key));
    return group ? [...new Set([city, ...group])] : [city];
}

/* --------------------------------------------------
   Reading the query
-------------------------------------------------- */

export function parseVehicleSearchQuery(query = {}) {
    const requested = clean(query.services)
        .split(",")
        .map(lower)
        .filter((service) => SEARCH_SERVICES.includes(service));

    const priceMode = ["below", "above", "exact", "between"].includes(lower(query.priceMode)) ? lower(query.priceMode) : "";
    const condition = [...new Set([...CONDITIONS, ...PART_CONDITIONS])].includes(lower(query.condition)) ? lower(query.condition) : "";
    const minYear = number(query.minYear);

    return {
        services: requested.length ? [...new Set(requested)] : [...SEARCH_SERVICES],
        city: isAny(query.city) ? "" : clean(query.city).slice(0, 80),
        transaction: ["sale", "rent"].includes(lower(query.transaction)) ? lower(query.transaction) : "",
        make: isAny(query.make) ? "" : clean(query.make).slice(0, 60),
        model: isAny(query.model) ? "" : clean(query.model).slice(0, 60),
        condition,
        fuel: ALL_FUELS.includes(lower(query.fuel)) ? lower(query.fuel) : "",
        minYear: minYear && minYear >= 1900 && minYear <= 2100 ? Math.floor(minYear) : null,
        partCategory: PART_CATEGORIES.includes(clean(query.partCategory)) ? clean(query.partCategory) : "",
        priceMode,
        price: number(query.price),
        priceMax: number(query.priceMax),
        q: clean(query.q).slice(0, 80),
        sort: ["newest", "priceAsc", "priceDesc"].includes(clean(query.sort)) ? clean(query.sort) : "mixed",
        page: Math.max(1, Number.parseInt(query.page, 10) || 1),
        limit: Math.min(MAX_LIMIT, Math.max(1, Number.parseInt(query.limit, 10) || 12)),
    };
}

/**
 * Which kinds of listing can match these criteria.
 *   rent                       -> no spare parts (they are only sold)
 *   fuel / minimum year        -> cars and motos only
 *   refurbished / part category -> spare parts only
 */
export function vehicleKindsFor(criteria) {
    const kinds = new Set(criteria.services);

    if (criteria.transaction === "rent") kinds.delete("part");
    if (criteria.fuel || criteria.minYear !== null) kinds.delete("part");

    if (criteria.condition === "refurbished" || criteria.partCategory) {
        kinds.delete("car");
        kinds.delete("moto");
    }

    return SEARCH_SERVICES.filter((kind) => kinds.has(kind));
}

function priceCondition({ priceMode, price, priceMax }) {
    if (!priceMode) return null;

    if (priceMode === "between") {
        const range = {};
        if (price !== null) range.$gte = price;
        if (priceMax !== null) range.$lte = priceMax;
        return Object.keys(range).length ? { price: range } : null;
    }

    if (price === null) return null;
    return { price: { below: { $lte: price }, above: { $gte: price }, exact: { $eq: price } }[priceMode] };
}

/* --------------------------------------------------
   One pipeline per kind
-------------------------------------------------- */

export function buildVehicleSearchPipeline(kind, criteria, { suspendedIds = [] } = {}) {
    const match = [{ status: "Available" }];

    if (suspendedIds.length) match.push({ userId: { $nin: suspendedIds } });

    const keyword = criteria.q ? new RegExp(escapeRegex(criteria.q), "i") : null;
    if (criteria.city) match.push({ city: { $in: cityValues(criteria.city) } });
    if (criteria.condition) match.push({ condition: criteria.condition });

    if (kind === "car" || kind === "moto") {
        // Old listings have no category: cars.
        match.push(kind === "moto" ? { category: "moto" } : { category: { $in: ["car", null] } });

        if (criteria.transaction) match.push({ listingType: criteria.transaction });
        if (criteria.make) match.push({ make: exact(criteria.make) });
        if (criteria.model) match.push({ model: exact(criteria.model) });
        if (criteria.fuel) match.push({ fuel: criteria.fuel });
        if (criteria.minYear !== null) match.push({ year: { $gte: criteria.minYear } });
        if (keyword) {
            match.push({ $or: [{ title: keyword }, { make: keyword }, { model: keyword }, { neighborhood: keyword }, { "business.name": keyword }] });
        }
    }

    if (kind === "part") {
        if (criteria.partCategory) match.push({ partCategory: criteria.partCategory });

        // Parts that fit the vehicle, or universal parts.
        if (criteria.make) {
            const fits = { "compatibility.make": exact(criteria.make) };
            if (criteria.model) fits["compatibility.model"] = { $in: [exact(criteria.model), ""] };
            match.push({ $or: [fits, { "compatibility.universal": true }] });
        }

        if (keyword) {
            match.push({
                $or: [
                    { title: keyword },
                    { brand: keyword },
                    { partNumber: keyword },
                    { neighborhood: keyword },
                    { "compatibility.make": keyword },
                    { "compatibility.model": keyword },
                    { "business.name": keyword },
                ],
            });
        }
    }

    const pipeline = [{ $match: { $and: match } }];

    const price = priceCondition(criteria);
    if (price) pipeline.push({ $match: price });

    const sort = {
        mixed: { createdAt: -1, _id: -1 },
        newest: { createdAt: -1, _id: -1 },
        priceAsc: { price: 1, createdAt: -1 },
        priceDesc: { price: -1, createdAt: -1 },
    }[criteria.sort];

    pipeline.push({
        $facet: {
            total: [{ $count: "count" }],
            items: [
                { $sort: sort },
                { $limit: Math.min(MAX_MERGE, criteria.page * criteria.limit) },
                { $project: kind === "part" ? PART_PROJECTION : VEHICLE_PROJECTION },
            ],
        },
    });

    return pipeline;
}

const VEHICLE_PROJECTION = {
    title: 1, price: 1, listingType: 1, category: 1, motoType: 1, condition: 1, make: 1, model: 1, year: 1,
    mileage: 1, fuel: 1, transmission: 1, engineCc: 1, city: 1, neighborhood: 1, location: 1,
    images: { $slice: ["$images", 1] }, publisherType: 1, "business.name": 1, createdAt: 1,
};

const PART_PROJECTION = {
    title: 1, price: 1, vehicleType: 1, partCategory: 1, condition: 1, brand: 1, quantity: 1, compatibility: 1,
    delivery: 1, sellerType: 1, "business.name": 1, city: 1, neighborhood: 1, location: 1,
    images: { $slice: ["$images", 1] }, createdAt: 1,
};

/* --------------------------------------------------
   Same shape for every kind
-------------------------------------------------- */

const imagePath = (image) => (typeof image === "string" ? image : image?.path || image?.url || "");

const coordinates = (location) => {
    const lat = Number(location?.lat);
    const lng = Number(location?.lng);
    return location?.lat != null && location?.lng != null && Number.isFinite(lat) && Number.isFinite(lng) && (lat !== 0 || lng !== 0)
        ? { lat, lng }
        : null;
};

export function normalizeVehicleResult(kind, doc) {
    const id = String(doc._id);
    const price = Number.isFinite(Number(doc.price)) && doc.price !== null ? Number(doc.price) : null;
    const base = {
        kind,
        id,
        title: doc.title || "",
        price,
        city: doc.city || "",
        neighborhood: doc.neighborhood || "",
        image: imagePath(doc.images?.[0]),
        location: coordinates(doc.location),
        createdAt: doc.createdAt,
    };

    if (kind === "part") {
        return {
            ...base,
            priceUnit: "each",
            listingType: "sale",
            details: {
                partCategory: doc.partCategory || "",
                vehicleType: doc.vehicleType || "car",
                condition: doc.condition || "",
                brand: doc.brand || "",
                quantity: doc.quantity ?? null,
                compatibility: doc.compatibility || {},
                delivery: Boolean(doc.delivery),
                business: doc.business?.name || "",
            },
            link: `/vehicles/parts/${id}`,
        };
    }

    return {
        ...base,
        priceUnit: doc.listingType === "rent" ? "day" : "total",
        listingType: doc.listingType || "sale",
        details: {
            make: doc.make || "",
            model: doc.model || "",
            year: doc.year ?? null,
            mileage: doc.mileage ?? null,
            fuel: doc.fuel || "",
            transmission: doc.transmission || "",
            motoType: doc.motoType || "",
            engineCc: doc.engineCc ?? null,
            condition: doc.condition || "",
            business: doc.business?.name || "",
        },
        link: `/vehicles/${id}`,
    };
}

/** Merge the kinds into one ordered list. */
export function mergeVehicleResults(lists, sort) {
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
    const buckets = SEARCH_SERVICES.map((kind) => all.filter((result) => result.kind === kind).sort(byDate));
    const mixed = [];
    for (let index = 0; mixed.length < all.length; index += 1) {
        buckets.forEach((bucket) => {
            if (index < bucket.length) mixed.push(bucket[index]);
        });
    }
    return mixed;
}

/* --------------------------------------------------
   Route
-------------------------------------------------- */

const MODELS = { car: () => Vehicle, moto: () => Vehicle, part: () => SparePart };

export const searchVehicles = async (req, res) => {
    try {
        const criteria = parseVehicleSearchQuery(req.query);
        const kinds = vehicleKindsFor(criteria);

        const suspendedIds = (await getSuspendedUserIds()).map((value) =>
            value instanceof mongoose.Types.ObjectId ? value : new mongoose.Types.ObjectId(String(value))
        );

        const answers = await Promise.all(
            kinds.map(async (kind) => {
                const [facet] = await MODELS[kind]()
                    .aggregate(buildVehicleSearchPipeline(kind, criteria, { suspendedIds }))
                    .collation(COLLATION);

                return {
                    kind,
                    total: facet?.total?.[0]?.count || 0,
                    items: (facet?.items || []).map((doc) => normalizeVehicleResult(kind, doc)),
                };
            })
        );

        const counts = { car: 0, moto: 0, part: 0 };
        answers.forEach(({ kind, total }) => {
            counts[kind] += total;
        });

        const total = answers.reduce((sum, answer) => sum + answer.total, 0);
        const merged = mergeVehicleResults(answers.map((answer) => answer.items), criteria.sort);
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
        console.error("[Vehicles] Search error:", error);
        return res.status(500).json({ message: "Search failed. Please try again." });
    }
};
