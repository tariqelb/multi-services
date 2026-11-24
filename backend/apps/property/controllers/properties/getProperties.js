import mongoose from "mongoose";

import { withoutListContact } from "../../utils/listingStatus.js";
import Property from "../../models/Property.js";
import { hideSuspended } from "../../../main/services/accountStatus.js";

// GET /api/property/getlist
//
// With ?page=… : filtered page + counts per property type
//   page, limit (max 48)
//   propertyType   one type ("All", "All Properties" = no filter)
//   types          comma list of allowed types (furnished page)
//   listingType    For Sale | For Rent
//   rentalPeriod   Daily | Monthly
//   city           city name (accents / case ignored, Tanger = Tangier...)
//   furnished      only | exclude   (furnished rentals have their own page)
//   furnishing     unfurnished | furnished | all
//                  any listing type; "unfurnished" also covers land,
//                  stores... and older listings without a status
//   status         available (default) | sold | rented | all
//                  Inactive listings are never listed: the owner does
//                  not want to be contacted
//   excludeId      leave one property out ("similar properties")
// -> { properties, pagination, typeCounts }
//
// Without page (older screens, map): plain array of the newest
// properties (at most LEGACY_LIMIT).

const LEGACY_LIMIT = 2000;
const MAX_LIMIT = 48;

// Case- and accent-insensitive comparisons.
const COLLATION = { locale: "fr", strength: 1 };

const FURNISHED_VALUES = ["Furnished", "Fully furnished", "Furnished property"];

const CITY_ALIASES = [
    ["tangier", "tanger", "tanja"],
    ["marrakesh", "marrakech"],
    ["fez", "fes", "fès"],
    ["casablanca", "casa"],
];

const ANY = new Set(["", "all", "all properties", "all cities", "all types"]);

const clean = (value) => String(value ?? "").trim();
const isAny = (value) => ANY.has(clean(value).toLowerCase());

function cityValues(city) {
    const lower = city
        .normalize("NFD")
        .replace(/[̀-ͯ]/g, "")
        .toLowerCase();
    const group = CITY_ALIASES.find((aliases) => aliases.includes(lower));

    return group ? [...new Set([city, ...group])] : [city];
}

const furnishedCondition = {
    listingType: "For Rent",
    furnishingStatus: { $in: FURNISHED_VALUES },
};

// Public status filter. Missing status (old listings) counts as Available.
const STATUS_FILTERS = {
    available: { status: { $in: ["Available", null] } },
    sold: { status: "Sold" },
    rented: { status: "Rented" },
    all: { status: { $ne: "Inactive" } },
};

export const statusFilter = (value) =>
    STATUS_FILTERS[clean(value).toLowerCase()] || STATUS_FILTERS.available;

/** Filter without the property type (used for the type counts). */
export function buildBaseFilter(query = {}) {
    const and = [statusFilter(query.status)];

    if (query.furnished === "only") and.push(furnishedCondition);
    if (query.furnished === "exclude") and.push({ $nor: [furnishedCondition] });

    const furnishing = clean(query.furnishing).toLowerCase();
    if (furnishing === "furnished") and.push({ furnishingStatus: { $in: FURNISHED_VALUES } });
    if (furnishing === "unfurnished") and.push({ furnishingStatus: { $nin: FURNISHED_VALUES } });

    if (!isAny(query.listingType)) and.push({ listingType: clean(query.listingType) });

    if (!isAny(query.rentalPeriod) && clean(query.listingType) !== "For Sale") {
        and.push({ rentalPeriod: clean(query.rentalPeriod) });
    }

    if (!isAny(query.city)) and.push({ city: { $in: cityValues(clean(query.city)) } });

    const types = clean(query.types)
        .split(",")
        .map((type) => type.trim())
        .filter(Boolean);

    if (types.length) and.push({ propertyType: { $in: types } });

    if (mongoose.Types.ObjectId.isValid(query.excludeId)) {
        and.push({ _id: { $ne: new mongoose.Types.ObjectId(String(query.excludeId)) } });
    }

    return { $and: and };
}

export function buildFilter(query = {}) {
    const base = buildBaseFilter(query);

    if (isAny(query.propertyType)) return base;

    const type = { propertyType: clean(query.propertyType) };

    return base.$and ? { $and: [...base.$and, type] } : type;
}

export const getProperties = async (req, res) => {
    try {
        const query = req.query || {};

        // Older screens: plain array.
        if (query.page === undefined) {
            const filter = await hideSuspended(buildFilter(query));

            const properties = await Property.find(filter)
                .collation(COLLATION)
                .sort({ createdAt: -1 })
                .limit(LEGACY_LIMIT)
                .lean();

            return res.status(200).json(properties.map(withoutListContact));
        }

        const page = Math.max(1, Number.parseInt(query.page, 10) || 1);
        const limit = Math.min(MAX_LIMIT, Math.max(1, Number.parseInt(query.limit, 10) || 9));

        const filter = await hideSuspended(buildFilter(query));
        const baseFilter = await hideSuspended(buildBaseFilter(query));

        const [properties, total, countRows] = await Promise.all([
            Property.find(filter)
                .collation(COLLATION)
                .sort({ createdAt: -1, _id: -1 })
                .skip((page - 1) * limit)
                .limit(limit)
                .lean(),

            Property.countDocuments(filter).collation(COLLATION),

            Property.aggregate([
                { $match: baseFilter },
                { $group: { _id: { $toLower: { $ifNull: ["$propertyType", ""] } }, count: { $sum: 1 } } },
            ]).collation(COLLATION),
        ]);

        const typeCounts = { all: 0 };

        for (const row of countRows) {
            typeCounts[row._id || "other"] = (typeCounts[row._id || "other"] || 0) + row.count;
            typeCounts.all += row.count;
        }

        return res.status(200).json({
            // No phone / email in lists: the details page shows the
            // owner's current contact.
            properties: properties.map(withoutListContact),
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
                hasNextPage: page * limit < total,
            },
            typeCounts,
        });
    } catch (error) {
        console.error("Error fetching properties:", error);

        return res.status(500).json({
            message: "Server error while fetching properties",
        });
    }
};
