///home/tariq/multi-services/app/backend/controllers/dashboard/adminController.js
import mongoose from "mongoose";

import User from "../../DatabaseModels/Schema/User.js";
import Property from "../../DatabaseModels/Schema/Property.js";
import SavedProperty from "../../DatabaseModels/Schema/SavedProperty.js";
import Feedback from "../../DatabaseModels/Schema/Feedback.js";

// GET /api/admin/users
export const getAdminUsers = async (req, res) => {
    try {
        const users = await User.aggregate([
            {
                $lookup: {
                    from: Property.collection.name,
                    let: { userId: "$_id" },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $eq: [
                                        "$userId",
                                        "$$userId",
                                    ],
                                },
                            },
                        },
                        {
                            $count: "count",
                        },
                    ],
                    as: "propertyStats",
                },
            },
            {
                $lookup: {
                    from: SavedProperty.collection.name,
                    let: { userId: "$_id" },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $eq: [
                                        "$userId",
                                        "$$userId",
                                    ],
                                },
                            },
                        },
                        {
                            $count: "count",
                        },
                    ],
                    as: "savedStats",
                },
            },
            {
                $lookup: {
                    from: Feedback.collection.name,
                    let: { userId: "$_id" },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $eq: [
                                        "$userId",
                                        "$$userId",
                                    ],
                                },
                            },
                        },
                        {
                            $count: "count",
                        },
                    ],
                    as: "reportStats",
                },
            },
            {
                $addFields: {
                    publishedProperties: {
                        $ifNull: [
                            {
                                $arrayElemAt: [
                                    "$propertyStats.count",
                                    0,
                                ],
                            },
                            0,
                        ],
                    },
                    savedProperties: {
                        $ifNull: [
                            {
                                $arrayElemAt: [
                                    "$savedStats.count",
                                    0,
                                ],
                            },
                            0,
                        ],
                    },
                    reports: {
                        $ifNull: [
                            {
                                $arrayElemAt: [
                                    "$reportStats.count",
                                    0,
                                ],
                            },
                            0,
                        ],
                    },
                },
            },
            {
                $project: {
                    password: 0,
                    propertyStats: 0,
                    savedStats: 0,
                    reportStats: 0,
                },
            },
            {
                $sort: {
                    createdAt: -1,
                },
            },
        ]);

        return res.status(200).json({
            success: true,
            count: users.length,
            users,
        });
    } catch (error) {
        console.error("Get admin users error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to retrieve users.",
        });
    }
};
