
import mongoose from "mongoose";
import RoommateAlert from "../../models/RoommateAlert.js";

const validPropertyTypes = [
    "Apartment",
    "House",
    "Villa",
    "Studio",
    "Room",
    "Other",
];

const validPurposes = [
    "Share My Property",
    "Find a Room",
    "Rent Together",
];

const validRentalPeriods = ["Daily", "Monthly"];

const normalizeArray = (value) => {
    if (!Array.isArray(value)) return [];

    return [
        ...new Set(
            value
                .filter((item) => typeof item === "string")
                .map((item) => item.trim())
                .filter(Boolean)
        ),
    ];
};

// CREATE ROOMMATE ALERT
export const createRoommateAlert = async (req, res) => {
    try {
        const userId = req.user?.userId;

        if (!userId) {
            return res.status(401).json({
                message: "Authentication required.",
            });
        }

        const {
            city,
            propertyTypes,
            purposes,
            rentalPeriods = [],
        } = req.body;

        const normalizedCity =
            typeof city === "string" ? city.trim() : "";

        const normalizedPropertyTypes = normalizeArray(propertyTypes);
        const normalizedPurposes = normalizeArray(purposes);
        const normalizedRentalPeriods = normalizeArray(rentalPeriods);

        if (!normalizedCity) {
            return res.status(400).json({
                message: "City is required.",
            });
        }

        if (
            normalizedPropertyTypes.length === 0 ||
            !normalizedPropertyTypes.every((type) =>
                validPropertyTypes.includes(type)
            )
        ) {
            return res.status(400).json({
                message: "Select at least one valid property type.",
            });
        }

        if (
            normalizedPurposes.length === 0 ||
            !normalizedPurposes.every((purpose) =>
                validPurposes.includes(purpose)
            )
        ) {
            return res.status(400).json({
                message: "Select at least one valid roommate purpose.",
            });
        }

        if (
            !normalizedRentalPeriods.every((period) =>
                validRentalPeriods.includes(period)
            )
        ) {
            return res.status(400).json({
                message: "Select valid rental periods.",
            });
        }

        const roommateAlert = await RoommateAlert.create({
            user: userId,
            city: normalizedCity,
            propertyTypes: normalizedPropertyTypes,
            purposes: normalizedPurposes,
            rentalPeriods: normalizedRentalPeriods,
        });

        return res.status(201).json({
            message: "Roommate alert created successfully.",
            roommateAlert,
        });
    } catch (error) {
        console.error("Create roommate alert error:", error);

        return res.status(500).json({
            message: "Failed to create roommate alert.",
        });
    }
};

// GET MY ROOMMATE ALERTS
export const getMyRoommateAlerts = async (req, res) => {
    try {
        const userId = req.user?.userId;

        if (!userId) {
            return res.status(401).json({
                message: "Authentication required.",
            });
        }

        const includeArchived =
            req.query.includeArchived === "true";

        const filter = {
            user: userId,
        };

        if (!includeArchived) {
            filter.isArchived = { $ne: true };
        }

        const roommateAlerts = await RoommateAlert.find(filter)
            .sort({ createdAt: -1 })
            .lean();

        const activeAlerts = roommateAlerts.filter(
            (alert) => !alert.isArchived
        );

        const archivedAlerts = roommateAlerts.filter(
            (alert) => alert.isArchived
        );

        return res.status(200).json({
            count: roommateAlerts.length,
            roommateAlerts,
            activeAlerts,
            archivedAlerts,
        });
    } catch (error) {
        console.error("Get roommate alerts error:", error);

        return res.status(500).json({
            message: "Failed to retrieve roommate alerts.",
        });
    }
};

// ARCHIVE ROOMMATE ALERT
export const archiveRoommateAlert = async (req, res) => {
    try {
        const userId = req.user?.userId;
        const { id } = req.params;

        if (!userId) {
            return res.status(401).json({
                message: "Authentication required.",
            });
        }

        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({
                message: "Invalid roommate alert ID.",
            });
        }

        const roommateAlert = await RoommateAlert.findOneAndUpdate(
            {
                _id: id,
                user: userId,
                isArchived: { $ne: true },
            },
            {
                $set: {
                    isArchived: true,
                    archivedAt: new Date(),
                },
            },
            {
                returnDocument: "after",
                runValidators: true,
            }
        );

        if (!roommateAlert) {
            return res.status(404).json({
                message: "Active roommate alert not found.",
            });
        }

        return res.status(200).json({
            message: "Roommate alert archived successfully.",
            roommateAlert,
        });
    } catch (error) {
        console.error("Archive roommate alert error:", error);

        return res.status(500).json({
            message: "Failed to archive roommate alert.",
        });
    }
};

// RESTORE ROOMMATE ALERT
export const restoreRoommateAlert = async (req, res) => {
    try {
        const userId = req.user?.userId;
        const { id } = req.params;

        if (!userId) {
            return res.status(401).json({
                message: "Authentication required.",
            });
        }

        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({
                message: "Invalid roommate alert ID.",
            });
        }

        const roommateAlert = await RoommateAlert.findOneAndUpdate(
            {
                _id: id,
                user: userId,
                isArchived: true,
            },
            {
                $set: {
                    isArchived: false,
                    archivedAt: null,
                },
            },
            {
                returnDocument: "after",
                runValidators: true,
            }
        );

        if (!roommateAlert) {
            return res.status(404).json({
                message: "Archived roommate alert not found.",
            });
        }

        return res.status(200).json({
            message: "Roommate alert restored successfully.",
            roommateAlert,
        });
    } catch (error) {
        console.error("Restore roommate alert error:", error);

        return res.status(500).json({
            message: "Failed to restore roommate alert.",
        });
    }
};

// DELETE uses archive behavior, matching the property alert API.
export const deleteRoommateAlert = archiveRoommateAlert;
