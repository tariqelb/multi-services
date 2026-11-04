
import ExternalListingClick from "../../DatabaseModels/Schema/ExternalListingClick.js";

export const getExternalListingAnalytics = async (req, res) => {
    try {
        const page = Math.max(1, Number(req.query.page) || 1);
        const limit = 6;

        const skip = (page - 1) * limit;

        const [result] = await ExternalListingClick.aggregate([
            {
                $facet: {
                    propertyTypes: [
                        {
                            $group: {
                                _id: {
                                    $cond: [
                                        {
                                            $and: [
                                                { $ne: ["$propertyType", ""] },
                                                { $ne: ["$propertyType", null] },
                                            ],
                                        },
                                        "$propertyType",
                                        "$listingType",
                                    ],
                                },
                                clicks: { $sum: "$clickCount" },
                            },
                        },
                        { $sort: { clicks: -1 } },
                    ],

                    websites: [
                        {
                            $group: {
                                _id: "$sourceDomain",
                                sourceName: { $first: "$sourceName" },
                                clicks: { $sum: "$clickCount" },
                            },
                        },
                        { $sort: { clicks: -1 } },
                    ],

                    cities: [
                        {
                            $group: {
                                _id: {
                                    $cond: [
                                        { $eq: ["$city", ""] },
                                        "Unknown",
                                        "$city",
                                    ],
                                },
                                clicks: { $sum: "$clickCount" },
                            },
                        },
                        { $sort: { clicks: -1 } },
                    ],

                    listings: [
                        { $sort: { lastClickedAt: -1 } },
                        { $skip: skip },
                        { $limit: limit },
                    ],

                    total: [
                        { $count: "count" },
                    ],

                    summary: [
                        {
                            $group: {
                                _id: null,
                                totalClicks: { $sum: "$clickCount" },
                                totalListings: { $sum: 1 },
                                totalWebsites: { $addToSet: "$sourceDomain" },
                                totalCities: { $addToSet: "$city" },
                            },
                        },
                        {
                            $project: {
                                _id: 0,
                                totalClicks: 1,
                                totalListings: 1,
                                totalWebsites: { $size: "$totalWebsites" },
                                totalCities: { $size: "$totalCities" },
                            },
                        },
                    ],
                },
            },
        ]);

        const total = result.total[0]?.count || 0;

        return res.status(200).json({
            summary: result.summary[0] || {
                totalClicks: 0,
                totalListings: 0,
                totalWebsites: 0,
                totalCities: 0,
            },
            charts: {
                propertyTypes: result.propertyTypes.map((item) => ({
                    name: item._id || "Unknown",
                    clicks: item.clicks,
                })),
                websites: result.websites.map((item) => ({
                    name: item.sourceName || item._id || "Unknown",
                    domain: item._id,
                    clicks: item.clicks,
                })),
                cities: result.cities.map((item) => ({
                    name: item._id || "Unknown",
                    clicks: item.clicks,
                })),
            },
            listings: result.listings,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        console.error("External listing analytics error:", error);

        return res.status(500).json({
            message: "Unable to retrieve external listing analytics.",
        });
    }
};
