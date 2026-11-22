// services/listingExpiry.js
//
// Listings must be confirmed every 60 days:
//   - day 53: the owner gets a reminder (email + notification)
//   - day 60: still not confirmed -> status Inactive (email + notification)
//
// Concerned: unfurnished properties that are Available, roommate
// announcements that are Open or Full. Never: furnished properties,
// hotels / riads (establishments), sold / rented / completed listings.
//
// A listing is confirmed when it is published, edited, its status is
// changed, or the owner clicks "Still available" (lastConfirmedAt = now).
//
// Env (optional):
//   LISTING_EXPIRY_DAYS=60
//   LISTING_EXPIRY_REMINDER_DAYS=7       reminder this many days before
//   LISTING_EXPIRY_ENABLED=false         turn the daily job off

import Property from "../DatabaseModels/Schema/Property.js";
import RoommateListing from "../DatabaseModels/Schema/RoommateListing.js";
import User from "../DatabaseModels/Schema/User.js";
import { createAndEmitNotification } from "../Notification/NotificationService.js";
import { getListingExpiryText, sendListingExpiryEmail } from "./emailService.js";

const DAY = 24 * 60 * 60 * 1000;
const BATCH = 300;

const FURNISHED_VALUES = ["Furnished", "Fully furnished", "Furnished property"];

const positive = (value, fallback) => {
    const number = Number(value);
    return Number.isFinite(number) && number > 0 ? number : fallback;
};

export const getExpirySettings = () => {
    const days = positive(process.env.LISTING_EXPIRY_DAYS, 60);
    const reminderDays = Math.min(positive(process.env.LISTING_EXPIRY_REMINDER_DAYS, 7), days - 1);

    return { days, reminderDays };
};

// Which listings can expire.
export const EXPIRY_SCOPE = {
    property: {
        status: { $in: ["Available", null] },
        furnishingStatus: { $nin: FURNISHED_VALUES },
    },
    roommate: {
        status: { $in: ["Open", "Full"] },
    },
};

const isFurnished = (property) => FURNISHED_VALUES.includes(property?.furnishingStatus);

export function expiryApplies(kind, listing) {
    if (!listing) return false;

    if (kind === "property") {
        return (!listing.status || listing.status === "Available") && !isFurnished(listing);
    }

    return ["Open", "Full"].includes(listing.status);
}

/**
 * For the owner's screens:
 * { applies, expiresAt, daysLeft, reminder, expired }
 */
export function getExpiryInfo(kind, listing, now = new Date()) {
    const { days, reminderDays } = getExpirySettings();
    const expired = Boolean(listing?.expiredAt) && listing?.status === "Inactive";

    if (!expiryApplies(kind, listing)) {
        return { applies: false, expired, expiresAt: null, daysLeft: null, reminder: false };
    }

    const confirmedAt = new Date(listing.lastConfirmedAt || listing.createdAt || now);
    const expiresAt = new Date(confirmedAt.getTime() + days * DAY);
    const daysLeft = Math.max(0, Math.ceil((expiresAt.getTime() - now.getTime()) / DAY));

    return {
        applies: true,
        expired: false,
        expiresAt: expiresAt.toISOString(),
        daysLeft,
        reminder: daysLeft <= reminderDays,
    };
}

/** Fields to $set when the owner confirms (edit, status change, button). */
export const confirmedNow = (now = new Date()) => ({
    lastConfirmedAt: now,
    expiryReminderSentAt: null,
    expiredAt: null,
});

/* --------------------------------------------------
   Daily run
-------------------------------------------------- */

const MODELS = {
    property: () => Property,
    roommate: () => RoommateListing,
};

const LINK = "/mypublication";

async function tellOwner({ kind, listing, owner, type, io, days, deps }) {
    const language = owner?.language || "en";
    const text = getListingExpiryText(language, type);
    const title = listing.title || "";
    const message = text.intro.replace("{title}", title).replace("{days}", days);

    const jobs = [
        deps.notify(io, {
            userId: listing.userId,
            type: type === "reminder" ? "listing_expiry_reminder" : "listing_expired",
            title: text.heading.slice(0, 120),
            message: message.slice(0, 500),
            link: LINK,
            data: { kind, listingId: String(listing._id), days },
        }),
    ];

    if (owner?.email) {
        jobs.push(deps.sendEmail({ to: owner.email, language, kind: type, title, days }));
    }

    const results = await Promise.allSettled(jobs);

    for (const result of results) {
        if (result.status === "rejected") {
            console.error(`[ListingExpiry] Could not tell the owner (${type}):`, result.reason?.message || result.reason);
        }
    }
}

async function ownersById(UserModel, listings) {
    const ids = [...new Set(listings.map((listing) => String(listing.userId)))];
    if (!ids.length) return new Map();

    const users = await UserModel.find({ _id: { $in: ids } }).select("email language accountStatus").lean();
    return new Map(users.map((user) => [String(user._id), user]));
}

/**
 * Runs the whole thing once. Safe to run several times a day: each
 * listing gets one reminder per confirmation period, and expires once.
 *
 * @returns {{ started, reminded, expired }} counts per kind
 */
export async function runListingExpiry({ now = new Date(), io = null, ...overrides } = {}) {
    const deps = {
        models: { property: MODELS.property(), roommate: MODELS.roommate() },
        UserModel: User,
        notify: createAndEmitNotification,
        sendEmail: sendListingExpiryEmail,
        ...overrides,
    };

    const { days, reminderDays } = getExpirySettings();
    const remindBefore = new Date(now.getTime() - (days - reminderDays) * DAY);
    const expireBefore = new Date(now.getTime() - days * DAY);
    // At least the reminder period between the reminder and expiry.
    const remindedBefore = new Date(now.getTime() - reminderDays * DAY + 60 * 60 * 1000);

    const summary = { started: {}, reminded: {}, expired: {} };

    for (const kind of ["property", "roommate"]) {
        const Model = deps.models[kind];
        const scope = EXPIRY_SCOPE[kind];

        // 1. Listings from before this feature: the 60 days start today.
        const started = await Model.updateMany(
            { ...scope, lastConfirmedAt: { $exists: false } },
            { $set: { lastConfirmedAt: now, expiryReminderSentAt: null } }
        );
        summary.started[kind] = started?.modifiedCount || 0;

        // 2. Reminders.
        const toRemind = await Model.find({
            ...scope,
            lastConfirmedAt: { $lte: remindBefore },
            $or: [
                { expiryReminderSentAt: null },
                { $expr: { $lt: ["$expiryReminderSentAt", "$lastConfirmedAt"] } },
            ],
        })
            .select("_id userId title lastConfirmedAt")
            .limit(BATCH)
            .lean();

        const remindOwners = await ownersById(deps.UserModel, toRemind);

        for (const listing of toRemind) {
            // Mark first: never send the same reminder twice.
            const marked = await Model.updateOne(
                { _id: listing._id, lastConfirmedAt: listing.lastConfirmedAt },
                { $set: { expiryReminderSentAt: now } }
            );

            if (!marked?.modifiedCount) continue;

            const left = Math.max(1, Math.ceil((listing.lastConfirmedAt.getTime() + days * DAY - now.getTime()) / DAY));

            await tellOwner({
                kind,
                listing,
                owner: remindOwners.get(String(listing.userId)),
                type: "reminder",
                io,
                days: left,
                deps,
            });
        }

        summary.reminded[kind] = toRemind.length;

        // 3. Expiry: past 60 days AND reminded at least a week ago.
        const toExpire = await Model.find({
            ...scope,
            lastConfirmedAt: { $lte: expireBefore },
            expiryReminderSentAt: { $ne: null, $lte: remindedBefore },
            $expr: { $gte: ["$expiryReminderSentAt", "$lastConfirmedAt"] },
        })
            .select("_id userId title lastConfirmedAt")
            .limit(BATCH)
            .lean();

        const expireOwners = await ownersById(deps.UserModel, toExpire);
        let expiredCount = 0;

        for (const listing of toExpire) {
            // Only if nothing changed meanwhile (owner confirmed just now...).
            const changed = await Model.updateOne(
                { _id: listing._id, ...scope, lastConfirmedAt: listing.lastConfirmedAt },
                { $set: { status: "Inactive", expiredAt: now } }
            );

            if (!changed?.modifiedCount) continue;

            expiredCount += 1;

            await tellOwner({
                kind,
                listing,
                owner: expireOwners.get(String(listing.userId)),
                type: "expired",
                io,
                days,
                deps,
            });
        }

        summary.expired[kind] = expiredCount;
    }

    return summary;
}
