// services/migrations/moveWhatsappNumber.js
//
// One-time move of the WhatsApp number from
//   notificationPreferences.whatsapp.{phoneNumber, verified, verificationSessionId, verificationExpires}
// to
//   whatsappNumber, whatsappVerified, whatsappVerificationSessionId, whatsappVerificationExpires
//
// Safe to run many times: it only touches users that still have the old
// fields. Runs at server start (server.js) and with
//   npm run migrate:whatsapp

import User from "../../DatabaseModels/Schema/User.js";

const OLD = "notificationPreferences.whatsapp";

export async function moveWhatsappNumber({ collection = User.collection, log = console } = {}) {
    const oldFieldsFilter = {
        $or: [
            { [`${OLD}.phoneNumber`]: { $exists: true } },
            { [`${OLD}.verified`]: { $exists: true } },
            { [`${OLD}.verificationSessionId`]: { $exists: true } },
            { [`${OLD}.verificationExpires`]: { $exists: true } },
        ],
    };

    // 1. Copy the number where the new field is still empty.
    const copied = await collection.updateMany(
        {
            [`${OLD}.phoneNumber`]: { $nin: [null, ""] },
            $or: [{ whatsappNumber: { $exists: false } }, { whatsappNumber: { $in: [null, ""] } }],
        },
        [
            {
                $set: {
                    whatsappNumber: `$${OLD}.phoneNumber`,
                    whatsappVerified: { $eq: [`$${OLD}.verified`, true] },
                },
            },
        ]
    );

    // 2. Remove the old fields.
    const cleaned = await collection.updateMany(oldFieldsFilter, {
        $unset: {
            [`${OLD}.phoneNumber`]: "",
            [`${OLD}.verified`]: "",
            [`${OLD}.verificationSessionId`]: "",
            [`${OLD}.verificationExpires`]: "",
        },
    });

    const result = {
        copied: copied?.modifiedCount ?? 0,
        cleaned: cleaned?.modifiedCount ?? 0,
    };

    if (result.copied || result.cleaned) {
        log.log?.(
            `[Migration] WhatsApp number moved for ${result.copied} user(s); old fields removed for ${result.cleaned}.`
        );
    }

    return result;
}
