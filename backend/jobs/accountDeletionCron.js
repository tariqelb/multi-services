
import cron from "node-cron";
import User from "../DatabaseModels/Schema/User.js"

import { permanentlyDeleteUser } from "../services/permanentlyDeleteUser.js";

export function startAccountDeletionCron() {
    cron.schedule(
        "0 0 * * *",
        async () => {
            console.info(
                "[AccountDeletion] Starting midnight cleanup."
            );

            try {
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
            } catch (error) {
                console.error(
                    "[AccountDeletion] Scheduled cleanup failed:",
                    error.message
                );
            }
        },
        {
            timezone: "Africa/Casablanca",
        }
    );

    console.info(
        "[AccountDeletion] Cron registered: daily at midnight Africa/Casablanca."
    );
}
//every one minute for test
// import cron from "node-cron";
// import User from "../DatabaseModels/Schema/User.js";
// import { permanentlyDeleteUser } from "../services/permanentlyDeleteUser.js";

// export function startAccountDeletionCron() {
//     cron.schedule(
//         "* * * * *",
//         async () => {
//             console.info(
//                 "[AccountDeletion TEST] Starting cleanup."
//             );

//             try {
//                 const now = new Date();

//                 const expiredUsers = await User.find({
//                     scheduledDeletionAt: { $lte: now },
//                 }).select("_id");

//                 for (const user of expiredUsers) {
//                     try {
//                         await permanentlyDeleteUser(user._id);

//                         console.info(
//                             "[AccountDeletion TEST] Processed account:",
//                             user._id.toString()
//                         );
//                     } catch (error) {
//                         console.error(
//                             "[AccountDeletion TEST] Cleanup failed:",
//                             user._id.toString(),
//                             error.message
//                         );
//                     }
//                 }

//                 console.info(
//                     `[AccountDeletion TEST] Finished. Found ${expiredUsers.length} expired accounts.`
//                 );
//             } catch (error) {
//                 console.error(
//                     "[AccountDeletion TEST] Cleanup failed:",
//                     error.message
//                 );
//             }
//         },
//         {
//             timezone: "Africa/Casablanca",
//         }
//     );

//     console.info(
//         "[AccountDeletion TEST] Cron registered: every minute."
//     );
// }
