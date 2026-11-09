
import SavedProperty from "../../DatabaseModels/Schema/SavedProperty.js";

const getDateLimit = (range) => {
    const days = {
        "7d": 7,
        "30d": 30,
        "90d": 90,
    }[range];

    if (!days) return null;

    const date = new Date();
    date.setDate(date.getDate() - days);

    return date;
};

const getLocalDateKey = (date) =>
    new Intl.DateTimeFormat("en-CA", {
        timeZone: "Africa/Casablanca",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
    }).format(new Date(date));

const addToGroup = (map, name) => {
    const key = name || "Unknown";

    if (!map.has(key)) {
        map.set(key, {
            name: key,
            requests: 0,
        });
    }

    map.get(key).requests += 1;
};

export const getSavedPropertyDemandAnalytics = async (req, res) => {
    try {
        const range = ["7d", "30d", "90d", "all"].includes(
            req.query.range
        )
            ? req.query.range
            : "30d";

        const dateLimit = getDateLimit(range);

        const records = await SavedProperty.find()
            .populate(
                "propertyId",
                "title price listingType propertyType city neighborhood images status"
            )
            .populate(
                "userId",
                "firstName lastName email"
            )
            .lean();

        const uniqueUsers = new Set();
        const uniqueProperties = new Set();

        const cities = new Map();
        const propertyTypes = new Map();
        const listingTypes = new Map();
        const properties = new Map();
        const trends = new Map();

        const recentSaves = [];

        let totalSaves = 0;
        let activeSavedProperties = 0;

        for (const record of records) {
            const property = record.propertyId || {};
            const snapshot = record.propertyInfo || {};
            const user = record.userId || {};

            const propertyId =
                property._id?.toString() ||
                (record.propertyId
                    ? record.propertyId.toString()
                    : "");

            const city =
                snapshot.city ||
                property.city ||
                "Unknown";

            const propertyType =
                snapshot.propertyType ||
                property.propertyType ||
                "Unknown";

            const listingType =
                snapshot.listingType ||
                property.listingType ||
                "Unknown";

            const title =
                snapshot.title ||
                property.title ||
                "Property no longer available";

            const userId =
                user._id?.toString() ||
                (record.userId
                    ? record.userId.toString()
                    : "");

            if (record.isSaved !== false) {
                activeSavedProperties += 1;
            }

            // Support older records created before activityHistory existed.
            const history =
                record.activityHistory?.length
                    ? record.activityHistory
                    : record.isSaved !== false
                        ? [{
                            action: "saved",
                            at: record.savedAt || record.createdAt,
                        }]
                        : [];

            const saveEvents = history.filter(
                (event) => event.action === "saved"
            );

            for (const event of saveEvents) {
                const eventDate = new Date(event.at);

                if (
                    !event.at ||
                    (dateLimit && eventDate < dateLimit)
                ) {
                    continue;
                }

                totalSaves += 1;

                if (userId) uniqueUsers.add(userId);
                if (propertyId) uniqueProperties.add(propertyId);

                addToGroup(cities, city);
                addToGroup(propertyTypes, propertyType);
                addToGroup(listingTypes, listingType);

                if (propertyId) {
                    if (!properties.has(propertyId)) {
                        properties.set(propertyId, {
                            propertyId,
                            title,
                            city,
                            propertyType,
                            listingType,
                            price:
                                snapshot.price ??
                                property.price ??
                                0,
                            image:
                                snapshot.image ||
                                property.images?.[0]?.path ||
                                property.images?.[0] ||
                                "",
                            saves: 0,
                        });
                    }

                    properties.get(propertyId).saves += 1;
                }

                const dateKey = getLocalDateKey(eventDate);

                trends.set(
                    dateKey,
                    (trends.get(dateKey) || 0) + 1
                );

                recentSaves.push({
                    _id: `${record._id}-${eventDate.getTime()}`,
                    createdAt: eventDate,
                    user: {
                        firstName: user.firstName || "",
                        lastName: user.lastName || "",
                        email: user.email || "",
                    },
                    property: {
                        title,
                        city,
                        propertyType,
                        listingType,
                        price:
                            snapshot.price ??
                            property.price ??
                            0,
                    },
                });
            }
        }

        const sortGroups = (map) =>
            Array.from(map.values()).sort(
                (a, b) => b.requests - a.requests
            );

        const topSavedProperties = Array.from(properties.values())
            .sort((a, b) => b.saves - a.saves)
            .slice(0, 10);

        const demandTrend = Array.from(trends.entries())
            .map(([date, saves]) => ({ date, saves }))
            .sort((a, b) => a.date.localeCompare(b.date));

        recentSaves.sort(
            (a, b) =>
                new Date(b.createdAt) - new Date(a.createdAt)
        );

        return res.status(200).json({
            success: true,
            range,
            summary: {
                totalSaves,
                uniqueUsers: uniqueUsers.size,
                uniqueProperties: uniqueProperties.size,
                activeSavedProperties,
            },
            topCities: sortGroups(cities).slice(0, 10),
            propertyTypes: sortGroups(propertyTypes).slice(0, 10),
            listingTypes: sortGroups(listingTypes),
            topSavedProperties,
            demandTrend,
            recentSaves: recentSaves.slice(0, 20),
        });
    } catch (error) {
        console.error(
            "Get saved property demand analytics error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Failed to retrieve saved property analytics.",
        });
    }
};
