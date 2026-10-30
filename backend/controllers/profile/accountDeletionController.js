
import User from "../../DatabaseModels/Schema/User.js";

const DELETION_GRACE_PERIOD_DAYS = 30;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * DELETE /api/account/deletion
 * Schedule the authenticated user's account for deletion.
 */
export async function requestAccountDeletion(req, res) {
    try {
        const userId = req.user?.userId;

        if (!userId) {
            return res.status(401).json({
                message: "Authentication required.",
            });
        }

        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({
                message: "Account not found.",
            });
        }

        if (user.scheduledDeletionAt) {
            return res.status(200).json({
                message: "Account deletion is already scheduled.",
                scheduledDeletionAt: user.scheduledDeletionAt,
            });
        }

        const now = new Date();
        const scheduledDeletionAt = new Date(
            now.getTime() + DELETION_GRACE_PERIOD_DAYS * MS_PER_DAY
        );

        user.deletionRequestedAt = now;
        user.scheduledDeletionAt = scheduledDeletionAt;

        await user.save();

        // Revoke active sessions here if your application uses a
        // server-side session store or refresh-token collection.
        // If using JWTs, see the security note below.

        return res.status(200).json({
            message:
                "Account deletion scheduled. Log in within 30 days to cancel it.",
            deletionRequestedAt: user.deletionRequestedAt,
            scheduledDeletionAt: user.scheduledDeletionAt,
        });
    } catch (error) {
        console.error(
            "Account deletion request failed:",
            error.message
        );

        return res.status(500).json({
            message: "Could not schedule account deletion.",
        });
    }
}

/**
 * POST /api/account/deletion/cancel
 * Allow an authenticated user to cancel a pending deletion.
 */
export async function cancelAccountDeletion(req, res) {
    try {
        const userId = req.user?.userId;

        if (!userId) {
            return res.status(401).json({
                message: "Authentication required.",
            });
        }

        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({
                message: "Account not found.",
            });
        }

        if (!user.scheduledDeletionAt) {
            return res.status(200).json({
                message: "No pending account deletion.",
            });
        }

        // Do not allow cancellation after the scheduled deadline.
        if (new Date(user.scheduledDeletionAt) <= new Date()) {
            return res.status(410).json({
                message:
                    "The deletion deadline has passed. The account may already be queued for permanent deletion.",
            });
        }

        user.deletionRequestedAt = null;
        user.scheduledDeletionAt = null;

        await user.save();

        return res.status(200).json({
            message: "Account deletion cancelled successfully.",
        });
    } catch (error) {
        console.error(
            "Account deletion cancellation failed:",
            error.message
        );

        return res.status(500).json({
            message: "Could not cancel account deletion.",
        });
    }
}
