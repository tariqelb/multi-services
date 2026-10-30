import User from "../DatabaseModels/Schema/User.js";
import { permanentlyDeleteUser } from "../services/permanentlyDeleteUser.js";

export async function runAccountDeletionJob() {
    console.info("[AccountDeletion] Starting cleanup.");

    const now = new Date();

    const expiredUsers = await User.find({
        scheduledDeletionAt: { $lte: now },
    }).select("_id");

    for (const user of expiredUsers) {
        try {
            await permanentlyDeleteUser(user._id);

            console.info(
                "[AccountDeletion] Processed expired account:",
                user._id.toString()
            );
        } catch (error) {
            console.error(
                "[AccountDeletion] Cleanup failed for account:",
                user._id.toString(),
                error.message
            );
        }
    }

    console.info(
        `[AccountDeletion] Finished. Found ${expiredUsers.length} expired accounts.`
    );
}