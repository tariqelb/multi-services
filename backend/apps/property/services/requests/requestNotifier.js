// backend/apps/property/services/requests/requestNotifier.js
//
// Who hears about property requests, and how:
//   - new request -> professionals whose settings match it
//       instant: in-app notification and/or email now (their channels)
//       daily:   nothing now; one summary a day (runRequestDigest)
//   - new reply   -> the seeker (notification, and email if their email
//                    notifications are on)
//   - contact shared -> the professional (notification + email)
// Suspended accounts and accounts being deleted get nothing.

import User from "../../../main/models/User.js";
import { createAndEmitNotification } from "../../../main/services/NotificationService.js";
import {
    sendRequestContactEmail,
    sendRequestDigestEmail,
    sendRequestMatchEmail,
    sendRequestResponseEmail,
} from "../../../main/services/emailService.js";
import { profileView } from "../../../main/services/professionalProfile.js";
import PropertyRequest from "../../models/PropertyRequest.js";
import { MAX_RECIPIENTS } from "../../utils/requestOptions.js";
import { SERVICE, recipientsFilter } from "./requestRules.js";
import { BOARD_LINK, requestBudget, requestLink, requestTitle } from "./requestText.js";

// Notification titles in the user's language.
const TITLES = {
    en: { match: "New request matches your work", digest: "{{count}} new request(s) match your work", response: "New reply to your request", contact: "Contact details shared with you", contactMessage: "{{name}} shared their contact details for their request." },
    fr: { match: "Nouvelle demande pour votre activité", digest: "{{count}} nouvelle(s) demande(s) pour votre activité", response: "Nouvelle réponse à votre demande", contact: "Coordonnées partagées avec vous", contactMessage: "{{name}} a partagé ses coordonnées pour sa demande." },
    ar: { match: "طلب جديد يطابق عملك", digest: "{{count}} طلب جديد يطابق عملك", response: "رد جديد على طلبك", contact: "تمت مشاركة معلومات الاتصال معك", contactMessage: "شارك {{name}} معلومات الاتصال الخاصة بطلبه." },
};
const titleFor = (language, key, values = {}) =>
    Object.entries(values).reduce((text, [name, value]) => text.replaceAll(`{{${name}}}`, value), (TITLES[language] || TITLES.en)[key]);

const RECIPIENT_FIELDS = "email language notificationPreferences professionalProfile accountStatus";
const emailsOn = (user) => Boolean(user.email) && user.notificationPreferences?.email?.enabled !== false;
const LOG = "[PropertyRequests]";

/** New request: notify the matching professionals (instant ones now). */
export async function notifyRequestRecipients(request, io, deps = {}) {
    const { UserModel = User, RequestModel = PropertyRequest, notify = createAndEmitNotification, sendEmail = sendRequestMatchEmail } = deps;

    const summary = { recipients: 0, instant: 0, daily: 0, notifications: 0, emails: 0 };
    if (!request?._id || request.status !== "active") return summary;

    const users = await UserModel.find(recipientsFilter(request)).select(RECIPIENT_FIELDS).limit(MAX_RECIPIENTS).lean();
    summary.recipients = users.length;

    await Promise.allSettled(
        users.map(async (user) => {
            const profile = profileView(user);
            if (profile.frequency === "daily") {
                summary.daily += 1;
                return;
            }
            summary.instant += 1;

            const language = user.language || "en";
            const title = requestTitle(request, language);

            if (profile.channels.notification) {
                try {
                    await notify(io, {
                        userId: String(user._id),
                        type: "request_match",
                        title: titleFor(language, "match"),
                        message: title,
                        link: requestLink(request),
                        data: { requestId: String(request._id), service: SERVICE, city: request.city },
                    });
                    summary.notifications += 1;
                } catch (error) {
                    console.error(`${LOG} Notification failed:`, error.message);
                }
            }

            if (profile.channels.email && emailsOn(user)) {
                try {
                    await sendEmail({
                        to: user.email,
                        language,
                        requestId: String(request._id),
                        path: requestLink(request),
                        title,
                        budget: requestBudget(request, language),
                        message: request.message,
                    });
                    summary.emails += 1;
                } catch (error) {
                    console.error(`${LOG} Email failed:`, error.message);
                }
            }
        })
    );

    try {
        await RequestModel.updateOne({ _id: request._id }, { $set: { recipientsCount: summary.recipients } });
    } catch (error) {
        console.error(`${LOG} Count update failed:`, error.message);
    }

    return summary;
}

/**
 * Daily summary for professionals who chose "once a day": every active
 * request not summarised yet (last 3 days), grouped per professional.
 */
export async function runRequestDigest({ io, now = new Date() } = {}, deps = {}) {
    const { UserModel = User, RequestModel = PropertyRequest, notify = createAndEmitNotification, sendEmail = sendRequestDigestEmail } = deps;

    const since = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
    const requests = await RequestModel.find({
        status: "active",
        expiresAt: { $gt: now },
        digestSentAt: null,
        createdAt: { $gte: since, $lte: now },
    })
        .sort({ createdAt: 1 })
        .limit(500)
        .lean();

    const byUser = new Map();
    for (const request of requests) {
        const users = await UserModel.find({ ...recipientsFilter(request), "professionalProfile.frequency": "daily" })
            .select(RECIPIENT_FIELDS)
            .limit(MAX_RECIPIENTS)
            .lean();
        users.forEach((user) => {
            const key = String(user._id);
            if (!byUser.has(key)) byUser.set(key, { user, requests: [] });
            byUser.get(key).requests.push(request);
        });
    }

    const summary = { requests: requests.length, users: byUser.size, notifications: 0, emails: 0 };

    await Promise.allSettled(
        [...byUser.values()].map(async ({ user, requests: list }) => {
            const profile = profileView(user);
            const language = user.language || "en";

            if (profile.channels.notification) {
                try {
                    await notify(io, {
                        userId: String(user._id),
                        type: "request_digest",
                        title: titleFor(language, "digest", { count: String(list.length) }),
                        message: list
                            .slice(0, 3)
                            .map((request) => requestTitle(request, language))
                            .join(" · "),
                        link: BOARD_LINK,
                        data: { requestIds: list.map((request) => String(request._id)), count: list.length, service: SERVICE },
                    });
                    summary.notifications += 1;
                } catch (error) {
                    console.error(`${LOG} Digest notification failed:`, error.message);
                }
            }

            if (profile.channels.email && emailsOn(user)) {
                try {
                    await sendEmail({
                        to: user.email,
                        language,
                        boardPath: BOARD_LINK,
                        requests: list.map((request) => ({
                            id: String(request._id),
                            path: requestLink(request),
                            title: requestTitle(request, language),
                            budget: requestBudget(request, language),
                        })),
                    });
                    summary.emails += 1;
                } catch (error) {
                    console.error(`${LOG} Digest email failed:`, error.message);
                }
            }
        })
    );

    if (requests.length) {
        await RequestModel.updateMany({ _id: { $in: requests.map((request) => request._id) } }, { $set: { digestSentAt: now } });
    }

    return summary;
}

/** Active requests past their 30 days become "expired". */
export async function expireRequests({ now = new Date() } = {}, { RequestModel = PropertyRequest } = {}) {
    const result = await RequestModel.updateMany({ status: "active", expiresAt: { $lte: now } }, { $set: { status: "expired" } });
    return { expired: result?.modifiedCount || 0 };
}

/** A professional replied: tell the seeker. */
export async function notifyNewResponse({ request, responder, message }, io, deps = {}) {
    const { UserModel = User, notify = createAndEmitNotification, sendEmail = sendRequestResponseEmail } = deps;

    const seeker = await UserModel.findById(request.userId).select("email language notificationPreferences accountStatus").lean();
    if (!seeker || seeker.accountStatus === "suspended") return { notified: false, emailed: false };

    const language = seeker.language || "en";
    const title = requestTitle(request, language);
    const name = responder.professionalProfile?.businessName || [responder.firstName, responder.lastName].filter(Boolean).join(" ");
    const result = { notified: false, emailed: false };

    try {
        await notify(io, {
            userId: String(seeker._id),
            type: "request_response",
            title: titleFor(language, "response"),
            message: `${name}: ${String(message).slice(0, 140)}`,
            link: requestLink(request),
            data: { requestId: String(request._id), service: SERVICE },
        });
        result.notified = true;
    } catch (error) {
        console.error(`${LOG} Reply notification failed:`, error.message);
    }

    if (emailsOn(seeker)) {
        try {
            await sendEmail({ to: seeker.email, language, requestId: String(request._id), path: requestLink(request), title, responderName: name, message });
            result.emailed = true;
        } catch (error) {
            console.error(`${LOG} Reply email failed:`, error.message);
        }
    }

    return result;
}

/** The seeker shared their contact: tell the professional. */
export async function notifyContactShared({ request, seeker, responderId, contact }, io, deps = {}) {
    const { UserModel = User, notify = createAndEmitNotification, sendEmail = sendRequestContactEmail } = deps;

    const responder = await UserModel.findById(responderId).select("email language notificationPreferences accountStatus").lean();
    if (!responder || responder.accountStatus === "suspended") return { notified: false, emailed: false };

    const seekerName = [seeker.firstName, seeker.lastName].filter(Boolean).join(" ");
    const result = { notified: false, emailed: false };

    try {
        await notify(io, {
            userId: String(responder._id),
            type: "request_contact",
            title: titleFor(responder.language || "en", "contact"),
            message: titleFor(responder.language || "en", "contactMessage", { name: seekerName }),
            link: requestLink(request),
            data: { requestId: String(request._id), service: SERVICE },
        });
        result.notified = true;
    } catch (error) {
        console.error(`${LOG} Contact notification failed:`, error.message);
    }

    if (emailsOn(responder)) {
        try {
            await sendEmail({ to: responder.email, language: responder.language || "en", requestId: String(request._id), path: requestLink(request), seekerName, contact });
            result.emailed = true;
        } catch (error) {
            console.error(`${LOG} Contact email failed:`, error.message);
        }
    }

    return result;
}
