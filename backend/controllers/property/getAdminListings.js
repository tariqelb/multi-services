
import Property from "../../DatabaseModels/Schema/Property.js";

export const getAdminListings = async (req, res) => {
    try {
        const { period = "today" } = req.query;

        const now = new Date();
        const startDate = new Date(now);

        switch (period) {
            case "today":
                startDate.setHours(0, 0, 0, 0);
                break;

            case "week":
                startDate.setDate(now.getDate() - 7);
                break;

            case "month":
                startDate.setMonth(now.getMonth() - 1);
                break;

            case "year":
                startDate.setFullYear(now.getFullYear() - 1);
                break;

            case "all":
                // No date filter
                break;

            default:
                return res.status(400).json({
                    message: "Invalid period",
                });
        }

        const filter = {};

        if (period !== "all") {
            filter.createdAt = {
                $gte: startDate,
                $lte: now,
            };
        }

        const properties = await Property.find(filter)
            .populate("userId", "firstName lastName email")
            .sort({ createdAt: -1 });

        return res.status(200).json({
            count: properties.length,
            properties,
        });
    } catch (error) {
        console.error("Get admin listings error:", error);

        return res.status(500).json({
            message: "Failed to retrieve publications",
        });
    }
};
