
import ExternalListing from "../../DatabaseModels/Schema/ExternalListing.js";
import ExternalListingClick from "../../DatabaseModels/Schema/ExternalListingClick.js";

export const trackExternalListingClick = async (req, res) => {
    try {
        const { id } = req.params;

        if (!id.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({
                message: "Invalid external listing ID.",
            });
        }

        const listing = await ExternalListing.findById(id).lean();

        if (!listing || listing.status !== "active") {
            return res.status(404).json({
                message: "External listing not found.",
            });
        }

        const clickedAt = new Date();

        const userId = req.user?.userId || null;

        const referrer = req.get("referer") || "";

        const analytics = await ExternalListingClick.findOneAndUpdate(
            {
                externalListingId: listing._id,
            },
            {
                $inc: {
                    clickCount: 1,
                },

                $set: {
                    sourceUrl: listing.sourceUrl,
                    sourceDomain: listing.sourceDomain,
                    sourceName: listing.sourceName,
                    title: listing.title,
                    listingType: listing.listingType,
                    propertyType: listing.propertyType,
                    city: listing.city,
                    neighborhood: listing.neighborhood,
                    lastClickedAt: clickedAt,
                    lastClickedBy: userId,
                    lastReferrer: referrer,
                },

                $setOnInsert: {
                    firstClickedAt: clickedAt,
                },
            },
            {
                new: true,
                upsert: true,
                runValidators: true,
                setDefaultsOnInsert: true,
            }
        );

        return res.status(200).json({
            message: "External listing click recorded.",
            analytics: {
                clickCount: analytics.clickCount,
                lastClickedAt: analytics.lastClickedAt,
            },
        });
    } catch (error) {
        console.error(
            "External listing click tracking error:",
            error.message
        );

        return res.status(500).json({
            message: "Unable to record external listing click.",
        });
    }
};
