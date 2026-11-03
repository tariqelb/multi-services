
import mongoose from "mongoose";

import Property from "../../DatabaseModels/Schema/Property.js";
import PropertyClick from "../../DatabaseModels/Schema/PropertyClick.js";

export const trackPropertyClick = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({
                message: "Invalid property ID.",
            });
        }

        const property = await Property.findById(id).lean();

        if (!property) {
            return res.status(404).json({
                message: "Property not found.",
            });
        }

        const clickedAt = new Date();
        const userId = req.user?.userId || null;

        const analytics = await PropertyClick.findOneAndUpdate(
            { propertyId: property._id },
            {
                $inc: {
                    clickCount: 1,
                },

                $set: {
                    propertyOwnerId: property.userId || null,
                    title: property.title || "",
                    propertyType: property.propertyType || "",
                    listingType: property.listingType || "",
                    city: property.city || "",
                    neighborhood: property.neighborhood || "",
                    price: property.price || 0,
                    lastClickedAt: clickedAt,
                    lastClickedBy: userId,
                },

                $setOnInsert: {
                    firstClickedAt: clickedAt,
                },
            },
            {
                upsert: true,
                new: true,
                runValidators: true,
                setDefaultsOnInsert: true,
            }
        );

        return res.status(200).json({
            message: "Property click recorded.",
            analytics: {
                propertyId: analytics.propertyId,
                clickCount: analytics.clickCount,
                lastClickedAt: analytics.lastClickedAt,
            },
        });
    } catch (error) {
        console.error("Property click tracking error:", error);

        return res.status(500).json({
            message: "Unable to record property click.",
        });
    }
};

export const getPropertyClickAnalytics = async (req, res) => {
    try {
        const page = Math.max(
            1,
            Number.parseInt(req.query.page, 10) || 1
        );

        const limit = Math.min(
            100,
            Math.max(1, Number.parseInt(req.query.limit, 10) || 8)
        );

        const skip = (page - 1) * limit;

        const [
            properties,
            total,
            summary,
            propertyTypes,
            listingTypes,
            cities,
        ] = await Promise.all([
            // Paginated property click records
            PropertyClick.find({})
                .sort({ lastClickedAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),

            // Total number of tracked properties
            PropertyClick.countDocuments(),

            // Overall analytics summary
            PropertyClick.aggregate([
                {
                    $group: {
                        _id: null,
                        totalClicks: {
                            $sum: "$clickCount",
                        },
                        totalProperties: {
                            $sum: 1,
                        },
                        cities: {
                            $addToSet: "$city",
                        },
                    },
                },
                {
                    $project: {
                        _id: 0,
                        totalClicks: 1,
                        totalProperties: 1,
                        totalCities: {
                            $size: {
                                $filter: {
                                    input: "$cities",
                                    as: "city",
                                    cond: {
                                        $and: [
                                            { $ne: ["$$city", null] },
                                            { $ne: ["$$city", ""] },
                                        ],
                                    },
                                },
                            },
                        },
                    },
                },
            ]),

            // Clicks grouped by property type
            PropertyClick.aggregate([
                {
                    $group: {
                        _id: {
                            $ifNull: ["$propertyType", "Unknown"],
                        },
                        clicks: {
                            $sum: "$clickCount",
                        },
                    },
                },
                {
                    $sort: {
                        clicks: -1,
                    },
                },
                {
                    $project: {
                        _id: 0,
                        name: "$_id",
                        clicks: 1,
                    },
                },
            ]),

            // Clicks grouped by listing type
            PropertyClick.aggregate([
                {
                    $group: {
                        _id: {
                            $ifNull: ["$listingType", "Unknown"],
                        },
                        clicks: {
                            $sum: "$clickCount",
                        },
                    },
                },
                {
                    $sort: {
                        clicks: -1,
                    },
                },
                {
                    $project: {
                        _id: 0,
                        name: "$_id",
                        clicks: 1,
                    },
                },
            ]),

            // Clicks grouped by city
            PropertyClick.aggregate([
                {
                    $group: {
                        _id: {
                            $ifNull: ["$city", "Unknown"],
                        },
                        clicks: {
                            $sum: "$clickCount",
                        },
                    },
                },
                {
                    $sort: {
                        clicks: -1,
                    },
                },
                {
                    $project: {
                        _id: 0,
                        name: "$_id",
                        clicks: 1,
                    },
                },
            ]),
        ]);

        const statistics = summary[0] || {
            totalClicks: 0,
            totalProperties: 0,
            totalCities: 0,
        };

        return res.status(200).json({
            summary: statistics,

            charts: {
                propertyTypes,
                listingTypes,
                cities,
            },

            properties,

            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        console.error(
            "Property click analytics retrieval error:",
            error
        );

        return res.status(500).json({
            message: "Unable to retrieve property click analytics.",
        });
    }
};
