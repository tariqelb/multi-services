import mongoose from "mongoose";

import User from "../../DatabaseModels/Schema/User.js";
import Property from "../../DatabaseModels/Schema/Property.js";

export const getPublicProfile = async (req, res) => {
    try {
        const { userId } = req.params;

        // Validate the MongoDB user ID.
        if (!mongoose.isValidObjectId(userId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid user ID.",
            });
        }

        // Only active accounts can have a public profile.
        // Never return private account information.
        const user = await User.findOne({
            _id: userId,
            accountStatus: "active",
            deletionRequestedAt: null,
        })
            .select(
                "firstName lastName bio profileImage createdAt role"
            )
            .lean();

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "Publisher not found.",
            });
        }

        const page = Math.max(
            1,
            Number.parseInt(req.query.page, 10) || 1
        );

        const limit = Math.min(
            24,
            Math.max(1, Number.parseInt(req.query.limit, 10) || 12)
        );

        const skip = (page - 1) * limit;

        // Show published property history, but exclude inactive listings.
        const propertyFilter = {
            userId: user._id,
            status: { $ne: "Inactive" },
        };

        const [
            properties,
            totalProperties,
            availableProperties,
        ] = await Promise.all([
            Property.find(propertyFilter)
                .select(
                    [
                        "title",
                        "description",
                        "status",
                        "listingType",
                        "propertyType",
                        "city",
                        "neighborhood",
                        "price",
                        "surface",
                        "rooms",
                        "bathrooms",
                        "images",
                        "createdAt",
                        "updatedAt",
                    ].join(" ")
                )
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),

            Property.countDocuments(propertyFilter),

            Property.countDocuments({
                ...propertyFilter,
                status: "Available",
            }),
        ]);

        return res.status(200).json({
            success: true,

            user: {
                id: user._id,
                firstName: user.firstName,
                lastName: user.lastName,
                bio: user.bio || "",
                profileImage: user.profileImage || "",
                role: user.role,
                createdAt: user.createdAt,
            },

            properties,

            statistics: {
                totalProperties,
                availableProperties,
            },

            pagination: {
                currentPage: page,
                totalPages: Math.ceil(totalProperties / limit),
                totalItems: totalProperties,
                limit,
                hasMore: skip + properties.length < totalProperties,
            },
        });
    } catch (error) {
        console.error("Get public profile error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to load publisher profile.",
        });
    }
};