// backend/controllers/dashboard/externalListingClickController.js

import mongoose from "mongoose";

import ExternalListing from "../../DatabaseModels/Schema/ExternalListing.js";
import ExternalListingClick from "../../DatabaseModels/Schema/ExternalListingClick.js";
import ExternalListingClickEvent from "../../DatabaseModels/Schema/ExternalListingClickEvent.js";

import {
    getReferrer,
    getVisitorKey,
    isBotRequest,
} from "../../utils/analytics.js";

const DUPLICATE_WINDOW_MS = 30 * 1000;

// POST /api/external-listings/:id/click
export const trackExternalListingClick = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({
                message: "Invalid external listing ID.",
            });
        }

        if (isBotRequest(req)) {
            return res.status(200).json({
                message: "Automated traffic ignored.",
                counted: false,
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
        const visitorKey = getVisitorKey(req);
        const referrer = getReferrer(req);

        const isDuplicate = await ExternalListingClickEvent.exists({
            externalListingId: listing._id,
            visitorKey,
            createdAt: {
                $gte: new Date(clickedAt.getTime() - DUPLICATE_WINDOW_MS),
            },
        });

        if (isDuplicate) {
            const current = await ExternalListingClick.findOne({
                externalListingId: listing._id,
            })
                .select("clickCount lastClickedAt")
                .lean();

            return res.status(200).json({
                message: "Repeated click ignored.",
                counted: false,
                analytics: {
                    clickCount: current?.clickCount || 0,
                    lastClickedAt: current?.lastClickedAt || null,
                },
            });
        }

        const details = {
            sourceDomain: listing.sourceDomain || "",
            sourceName: listing.sourceName || "",
            title: listing.title || "",
            listingType: listing.listingType || "",
            propertyType: listing.propertyType || "",
            city: listing.city || "",
            neighborhood: listing.neighborhood || "",
        };

        const [analytics] = await Promise.all([
            ExternalListingClick.findOneAndUpdate(
                { externalListingId: listing._id },
                {
                    $inc: { clickCount: 1 },
                    $set: {
                        ...details,
                        sourceUrl: listing.sourceUrl,
                        lastClickedAt: clickedAt,
                        lastClickedBy: userId,
                        lastReferrer: referrer,
                    },
                    $setOnInsert: { firstClickedAt: clickedAt },
                },
                {
                    new: true,
                    upsert: true,
                    runValidators: true,
                    setDefaultsOnInsert: true,
                }
            ),

            ExternalListingClickEvent.create({
                ...details,
                externalListingId: listing._id,
                userId,
                visitorKey,
                referrer,
            }),
        ]);

        return res.status(200).json({
            message: "External listing click recorded.",
            counted: true,
            analytics: {
                clickCount: analytics.clickCount,
                lastClickedAt: analytics.lastClickedAt,
            },
        });
    } catch (error) {
        console.error("External listing click tracking error:", error.message);

        return res.status(500).json({
            message: "Unable to record external listing click.",
        });
    }
};
