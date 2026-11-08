
import mongoose from "mongoose";

import Property from "../../DatabaseModels/Schema/Property.js";
import User from "../../DatabaseModels/Schema/User.js";
import PropertyContact from "../../DatabaseModels/Schema/PropertyContact.js";

// POST /api/dashboard/property-contacts
// Record an authenticated user's contact action.
export const createPropertyContact = async (req, res) => {
    try {
        const { propertyId, action } = req.body;

        if (!mongoose.Types.ObjectId.isValid(propertyId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid property ID.",
            });
        }

        if (!["call", "whatsapp"].includes(action)) {
            return res.status(400).json({
                success: false,
                message: "Invalid contact action.",
            });
        }

        const client = await User.findById(req.user.userId)
            .select("_id");

        if (!client) {
            return res.status(401).json({
                success: false,
                message: "User account not found.",
            });
        }

        const property = await Property.findById(propertyId)
            .select("_id userId title firstName lastName phone");

        if (!property) {
            return res.status(404).json({
                success: false,
                message: "Property not found.",
            });
        }

        const owner = await User.findById(property.userId)
            .select("_id");

        if (!owner) {
            return res.status(404).json({
                success: false,
                message: "Property owner not found.",
            });
        }

        const contact = await PropertyContact.create({
            clientId: client._id,
            propertyId: property._id,
            ownerId: owner._id,
            action,
        });

        return res.status(201).json({
            success: true,
            message: "Contact action recorded successfully.",
            contact,
        });
    } catch (error) {
        console.error("Create property contact error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to record contact action.",
        });
    }
};

// GET /api/dashboard/property-contacts
// Retrieve contact analytics for administrators.
export const getPropertyContactAnalytics = async (req, res) => {
    try {
        const { from, to } = req.query;

        const filter = {};

        if (from || to) {
            filter.createdAt = {};

            if (from) {
                const fromDate = new Date(from);

                if (Number.isNaN(fromDate.getTime())) {
                    return res.status(400).json({
                        success: false,
                        message: "Invalid start date.",
                    });
                }

                filter.createdAt.$gte = fromDate;
            }

            if (to) {
                const toDate = new Date(to);

                if (Number.isNaN(toDate.getTime())) {
                    return res.status(400).json({
                        success: false,
                        message: "Invalid end date.",
                    });
                }

                // Include the entire selected end date.
                toDate.setHours(23, 59, 59, 999);

                filter.createdAt.$lte = toDate;
            }
        }

        // Last seven days, starting at midnight UTC.
        const activityStart = new Date();

        activityStart.setUTCHours(0, 0, 0, 0);
        activityStart.setUTCDate(
            activityStart.getUTCDate() - 6
        );

        const [
            totalContacts,
            callContacts,
            whatsappContacts,
            contactsToday,
            topProperties,
            recentContacts,
            dailyActivity,
        ] = await Promise.all([
            PropertyContact.countDocuments(filter),

            PropertyContact.countDocuments({
                ...filter,
                action: "call",
            }),

            PropertyContact.countDocuments({
                ...filter,
                action: "whatsapp",
            }),

            PropertyContact.countDocuments({
                action: {
                    $in: ["call", "whatsapp"],
                },
                createdAt: {
                    $gte: new Date(
                        new Date().setHours(0, 0, 0, 0)
                    ),
                    $lte: new Date(
                        new Date().setHours(23, 59, 59, 999)
                    ),
                },
            }),

            // Most-contacted properties.
            PropertyContact.aggregate([
                { $match: filter },
                {
                    $group: {
                        _id: "$propertyId",
                        totalContacts: { $sum: 1 },
                        calls: {
                            $sum: {
                                $cond: [
                                    { $eq: ["$action", "call"] },
                                    1,
                                    0,
                                ],
                            },
                        },
                        whatsapp: {
                            $sum: {
                                $cond: [
                                    { $eq: ["$action", "whatsapp"] },
                                    1,
                                    0,
                                ],
                            },
                        },
                    },
                },
                { $sort: { totalContacts: -1 } },
                { $limit: 10 },
            ]),

            // Recent contact activity.
            PropertyContact.find(filter)
                .populate(
                    "clientId",
                    "firstName lastName email phoneNumber"
                )
                .populate(
                    "ownerId",
                    "firstName lastName email phoneNumber"
                )
                .populate(
                    "propertyId",
                    "title propertyType listingType city price firstName lastName phone images"
                )
                .sort({ createdAt: -1 })
                .limit(20)
                .lean(),

            // Daily calls and WhatsApp clicks for the last seven days.
            PropertyContact.aggregate([
                {
                    $match: {
                        createdAt: {
                            $gte: activityStart,
                        },
                    },
                },
                {
                    $group: {
                        _id: {
                            $dateToString: {
                                format: "%Y-%m-%d",
                                date: "$createdAt",
                                timezone: "UTC",
                            },
                        },
                        calls: {
                            $sum: {
                                $cond: [
                                    { $eq: ["$action", "call"] },
                                    1,
                                    0,
                                ],
                            },
                        },
                        whatsapp: {
                            $sum: {
                                $cond: [
                                    { $eq: ["$action", "whatsapp"] },
                                    1,
                                    0,
                                ],
                            },
                        },
                    },
                },
                {
                    $project: {
                        _id: 0,
                        date: "$_id",
                        calls: 1,
                        whatsapp: 1,
                        total: {
                            $add: ["$calls", "$whatsapp"],
                        },
                    },
                },
                { $sort: { date: 1 } },
            ]),
        ]);

        // Populate property information in the top properties list.
        const populatedTopProperties = await Property.populate(
            topProperties.map((item) => ({
                ...item,
                _id: item._id,
            })),
            {
                path: "_id",
                select: "title propertyType listingType city price images",
            }
        );

        return res.status(200).json({
            success: true,
            statistics: {
                totalContacts,
                contactsToday,
                callContacts,
                whatsappContacts,
            },
            dailyActivity,
            topProperties: populatedTopProperties,
            recentContacts,
        });
    } catch (error) {
        console.error("Get property contact analytics error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to retrieve contact analytics.",
        });
    }
};
