// backend/apps/vehicles/controllers/externalListings/externalListingAvailabilityController.js
//
// Admin endpoints: check whether external listings are still available on
// their websites, and remove the ones that are not.
//
//   POST /api/vehicles/external-listings/availability/check    { website?: "all" | hostname, dryRun?: boolean, removeUnreachable?: boolean }
//   GET  /api/vehicles/external-listings/availability/status   live progress + recent checks
//   POST /api/vehicles/external-listings/availability/cancel   stop the running check
//   POST /api/vehicles/external-listings/availability/remove   { ids: [...] } remove listings kept for review

import {
    cancelAvailabilityCheck,
    getAvailabilityStatus,
    removeReviewedListings,
    startAvailabilityCheck,
} from "../../services/externalListings/availabilityChecker.js";
import { getCollectionStatus } from "../../services/externalListings/siteCollector.js";

function errorMessage(error) {
    return error instanceof Error ? error.message : "An unexpected error occurred.";
}

function adminName(req) {
    return req.user?.email || req.user?.userId || req.user?.id || "";
}

// POST /api/vehicles/external-listings/availability/check
export async function startAvailabilityCheckController(req, res) {
    try {
        // One website visit at a time: do not check during a collection.
        if (getCollectionStatus().running) {
            return res.status(409).json({
                success: false,
                message: "A collection is running. Check the listings when it is finished.",
                ...getAvailabilityStatus(),
            });
        }

        const job = startAvailabilityCheck({
            website: req.body?.website || "all",
            dryRun: req.body?.dryRun === true || req.body?.dryRun === "true",
            // Default: listings that cannot be reached are removed.
            removeUnreachable: !(req.body?.removeUnreachable === false || req.body?.removeUnreachable === "false"),
            requestedBy: adminName(req),
        });

        return res.status(202).json({
            success: true,
            message: "Availability check started.",
            job,
        });
    } catch (error) {
        return res.status(error.status || 400).json({
            success: false,
            message: errorMessage(error),
            ...getAvailabilityStatus(),
        });
    }
}

// GET /api/vehicles/external-listings/availability/status
export async function getAvailabilityStatusController(req, res) {
    return res.status(200).json({
        success: true,
        ...getAvailabilityStatus(),
    });
}

// POST /api/vehicles/external-listings/availability/cancel
export async function cancelAvailabilityCheckController(req, res) {
    const cancelled = cancelAvailabilityCheck();

    return res.status(200).json({
        success: true,
        cancelled,
        message: cancelled
            ? "The check will stop after the current listing."
            : "No check is running.",
    });
}

// POST /api/vehicles/external-listings/availability/remove   { ids: [...] }
export async function removeReviewedListingsController(req, res) {
    try {
        const ids = Array.isArray(req.body?.ids) ? req.body.ids : [];

        const validIds = ids.filter((id) => /^[a-f\d]{24}$/i.test(String(id)));

        if (!validIds.length) {
            return res.status(400).json({
                success: false,
                message: "No listings to remove.",
            });
        }

        const removed = await removeReviewedListings(validIds, {
            requestedBy: adminName(req),
        });

        return res.status(200).json({
            success: true,
            removed,
            message: `${removed} listing(s) removed.`,
            ...getAvailabilityStatus(),
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: errorMessage(error),
        });
    }
}
