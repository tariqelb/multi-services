// backend/apps/property/controllers/requests/requestController.js
//
// Property requests: a user posts what they are looking for; professionals
// who chose to receive property requests (Settings > Receive requests) are
// notified and reply with "I have a match". The seeker's contact details
// stay hidden until the seeker shares them with a professional.
//
//   POST   /api/property/requests                      post a request
//   GET    /api/property/requests/mine                 my requests
//   GET    /api/property/requests/board                requests for professionals (?matching, city, transaction, page)
//   GET    /api/property/requests/replies              replies I sent
//   GET    /api/property/requests/user/:userId         a user's active requests on their public profile
//                                       (only if they chose to show them)
//   GET    /api/property/requests/admin                admin list (?status, period, page)
//   DELETE /api/property/requests/admin/:id            admin delete
//   GET    /api/property/requests/:id                  details (owner: with replies)
//   PATCH  /api/property/requests/:id                  close { status: "closed", closedReason }
//   POST   /api/property/requests/:id/renew            30 more days
//   DELETE /api/property/requests/:id
//   POST   /api/property/requests/:id/responses        reply { message, listing: { kind, id } }
//   POST   /api/property/requests/:id/responses/:responseId/share   share my contact with this professional

import mongoose from "mongoose";

import User from "../../../main/models/User.js";
import { contactFromOwner, OWNER_CONTACT_FIELDS } from "../../../main/utils/ownerContact.js";
import { visibilityOf } from "../../../main/utils/publicProfile.js";
import { profileView } from "../../../main/services/professionalProfile.js";
import PropertyRequest from "../../models/PropertyRequest.js";
import PropertyRequestResponse from "../../models/PropertyRequestResponse.js";
import { getListingSummary } from "../../services/userHooks.js";
import { MAX_ACTIVE_REQUESTS, MAX_RECIPIENTS } from "../../utils/requestOptions.js";
import {
    CLOSE_REASON_VALUES,
    SERVICE,
    boardFilter,
    buildRequestData,
    expiryFrom,
    isExpired,
    recipientsFilter,
    requestMatchesProfile,
    requestView,
    shortName,
} from "../../services/requests/requestRules.js";
import { notifyContactShared, notifyNewResponse, notifyRequestRecipients } from "../../services/requests/requestNotifier.js";

const PER_PAGE = 12;
const LOG = "[PropertyRequests]";
const isId = (value) => mongoose.Types.ObjectId.isValid(String(value || ""));
const me = (req) => String(req.user?.userId || "");
const io = (req) => req.app?.get?.("io");
const fail = (res, status, message, extra = {}) => res.status(status).json({ success: false, message, ...extra });

const RESPONDER_FIELDS = `${OWNER_CONTACT_FIELDS} professionalProfile accountStatus`;

/** A professional as the seeker sees them in a reply. */
function responderView(user) {
    if (!user) return null;
    const profile = profileView(user);
    return {
        id: String(user._id),
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        profileImage: user.profileImage || "",
        businessType: profile.businessType,
        businessName: profile.businessName,
        // The professional replied to be contacted: their contact is shown to the seeker.
        contact: user.accountStatus === "suspended" ? null : contactFromOwner(user),
    };
}

function responseView(response, responder) {
    return {
        id: String(response._id),
        message: response.message,
        listing: response.listing?.kind ? { ...response.listing } : null,
        createdAt: response.createdAt,
        readAt: response.readAt || null,
        contactShared: response.contactShared === true,
        responder: responderView(responder),
    };
}

const fullName = (user) => [user.firstName, user.lastName].filter(Boolean).join(" ");

/* --------------------------------------------------
   Seeker: post and manage requests
-------------------------------------------------- */

const activeCount = (userId, now = new Date()) => PropertyRequest.countDocuments({ userId, status: "active", expiresAt: { $gt: now } });
const tooMany = (res) =>
    fail(res, 409, `You can have ${MAX_ACTIVE_REQUESTS} active requests at most. Close one first.`, { code: "TOO_MANY_ACTIVE" });

export const createRequest = async (req, res) => {
    try {
        const { data, errors } = buildRequestData(req.body);
        if (Object.keys(errors).length) return fail(res, 400, "Please check the form.", { errors });

        if ((await activeCount(me(req))) >= MAX_ACTIVE_REQUESTS) return tooMany(res);

        const request = await PropertyRequest.create({ ...data, userId: me(req), status: "active", expiresAt: expiryFrom() });
        const plain = request.toObject();

        // How many professionals will hear about it (sent in the background).
        const recipients = Math.min(MAX_RECIPIENTS, await User.countDocuments(recipientsFilter(plain)));
        notifyRequestRecipients(plain, io(req)).catch((error) => console.error(`${LOG} Notify error:`, error));

        return res.status(201).json({ success: true, message: "Your request is published.", request: { ...requestView(plain), recipientsCount: recipients } });
    } catch (error) {
        console.error(`${LOG} Create error:`, error);
        return fail(res, 500, "Unable to publish your request.");
    }
};

export const getMyRequests = async (req, res) => {
    try {
        const requests = await PropertyRequest.find({ userId: me(req) }).sort({ createdAt: -1 }).limit(100).lean();
        const unread = await PropertyRequestResponse.aggregate([
            { $match: { requesterId: new mongoose.Types.ObjectId(me(req)), readAt: null } },
            { $group: { _id: "$requestId", count: { $sum: 1 } } },
        ]);
        const unreadBy = new Map(unread.map((row) => [String(row._id), row.count]));

        return res.status(200).json({
            success: true,
            requests: requests.map((request) => ({ ...requestView(request), unreadResponses: unreadBy.get(String(request._id)) || 0 })),
        });
    } catch (error) {
        console.error(`${LOG} Mine error:`, error);
        return fail(res, 500, "Unable to load your requests.");
    }
};

async function loadOwnRequest(req, res) {
    if (!isId(req.params.id)) {
        fail(res, 400, "Invalid request ID.");
        return null;
    }
    const request = await PropertyRequest.findById(req.params.id);
    if (!request) {
        fail(res, 404, "Request not found.");
        return null;
    }
    if (String(request.userId) !== me(req)) {
        fail(res, 403, "This is not your request.");
        return null;
    }
    return request;
}

export const closeRequest = async (req, res) => {
    try {
        const request = await loadOwnRequest(req, res);
        if (!request) return undefined;

        if (req.body?.status !== "closed") return fail(res, 400, "Only closing is possible here.");
        request.status = "closed";
        request.closedReason = CLOSE_REASON_VALUES.includes(req.body?.closedReason) ? req.body.closedReason : "other";
        await request.save();

        return res.status(200).json({ success: true, message: "Request closed.", request: requestView(request.toObject()) });
    } catch (error) {
        console.error(`${LOG} Close error:`, error);
        return fail(res, 500, "Unable to close this request.");
    }
};

export const renewRequest = async (req, res) => {
    try {
        const request = await loadOwnRequest(req, res);
        if (!request) return undefined;

        const now = new Date();
        const wasActive = request.status === "active" && request.expiresAt > now;
        if (!wasActive && (await activeCount(me(req), now)) >= MAX_ACTIVE_REQUESTS) return tooMany(res);

        request.status = "active";
        request.closedReason = "";
        request.expiresAt = expiryFrom(now);
        request.renewedAt = now;
        await request.save();

        return res.status(200).json({ success: true, message: "Request renewed for 30 days.", request: requestView(request.toObject(), { now }) });
    } catch (error) {
        console.error(`${LOG} Renew error:`, error);
        return fail(res, 500, "Unable to renew this request.");
    }
};

export const deleteRequest = async (req, res) => {
    try {
        const request = await loadOwnRequest(req, res);
        if (!request) return undefined;

        await PropertyRequestResponse.deleteMany({ requestId: request._id });
        await PropertyRequest.deleteOne({ _id: request._id });

        return res.status(200).json({ success: true, message: "Request deleted.", id: String(request._id) });
    } catch (error) {
        console.error(`${LOG} Delete error:`, error);
        return fail(res, 500, "Unable to delete this request.");
    }
};

/* --------------------------------------------------
   Details
-------------------------------------------------- */

export const getRequest = async (req, res) => {
    try {
        if (!isId(req.params.id)) return fail(res, 400, "Invalid request ID.");

        const request = await PropertyRequest.findById(req.params.id).lean();
        if (!request) return fail(res, 404, "Request not found.");

        const viewerId = me(req);

        // Owner: every reply, with the professional's contact.
        if (String(request.userId) === viewerId) {
            const responses = await PropertyRequestResponse.find({ requestId: request._id }).sort({ createdAt: -1 }).lean();
            const responders = await User.find({ _id: { $in: responses.map((response) => response.responderId) } }).select(RESPONDER_FIELDS).lean();
            const byId = new Map(responders.map((user) => [String(user._id), user]));

            const unread = responses.filter((response) => !response.readAt).map((response) => response._id);
            if (unread.length) await PropertyRequestResponse.updateMany({ _id: { $in: unread } }, { $set: { readAt: new Date() } });

            return res.status(200).json({
                success: true,
                isOwner: true,
                request: requestView(request),
                responses: responses.map((response) => responseView(response, byId.get(String(response.responderId)))),
            });
        }

        // Others: the request without the seeker's identity or contact, and their own reply.
        const [seeker, myResponse, viewer] = await Promise.all([
            User.findById(request.userId).select(`${OWNER_CONTACT_FIELDS} accountStatus`).lean(),
            PropertyRequestResponse.findOne({ requestId: request._id, responderId: viewerId }).lean(),
            User.findById(viewerId).select("professionalProfile").lean(),
        ]);

        const visible = request.status === "active" && !isExpired(request) && seeker?.accountStatus !== "suspended";
        if (!visible && !myResponse) return fail(res, 404, "This request is no longer available.");

        return res.status(200).json({
            success: true,
            isOwner: false,
            request: requestView(request),
            seeker: { name: shortName(seeker) },
            matchesMyProfile: requestMatchesProfile(request, profileView(viewer)),
            myResponse: myResponse
                ? {
                      ...responseView(myResponse, null),
                      // Shared by the seeker: their contact details.
                      seekerContact: myResponse.contactShared && seeker ? { name: fullName(seeker), ...contactFromOwner(seeker) } : null,
                  }
                : null,
        });
    } catch (error) {
        console.error(`${LOG} Details error:`, error);
        return fail(res, 500, "Unable to load this request.");
    }
};

/* --------------------------------------------------
   Professionals: board and replies
-------------------------------------------------- */

export const getBoard = async (req, res) => {
    try {
        const viewer = await User.findById(me(req)).select("professionalProfile").lean();
        const profile = profileView(viewer);
        const configured = profile.fields.includes(SERVICE);
        const matching = req.query.matching !== "false" && req.query.matching !== "0" && configured;
        const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);

        const filter = boardFilter({
            viewerId: me(req),
            profile: configured ? profile : null,
            matching,
            city: String(req.query.city || "").trim().slice(0, 100),
            transaction: String(req.query.transaction || ""),
            category: String(req.query.category || ""),
        });

        // Suspended seekers' requests are hidden.
        const suspended = await User.distinct("_id", { accountStatus: "suspended" });
        if (suspended.length) filter.userId = { ...(filter.userId || {}), $nin: suspended };

        const [total, requests] = await Promise.all([
            PropertyRequest.countDocuments(filter),
            PropertyRequest.find(filter).sort({ createdAt: -1 }).skip((page - 1) * PER_PAGE).limit(PER_PAGE).lean(),
        ]);

        const replied = await PropertyRequestResponse.find({ responderId: me(req), requestId: { $in: requests.map((request) => request._id) } })
            .select("requestId")
            .lean();
        const repliedIds = new Set(replied.map((response) => String(response.requestId)));

        return res.status(200).json({
            success: true,
            profile: { receiveRequests: profile.receiveRequests, fields: profile.fields, configured },
            matching,
            requests: requests.map((request) => ({ ...requestView(request), replied: repliedIds.has(String(request._id)) })),
            pagination: { page, limit: PER_PAGE, total, totalPages: Math.max(1, Math.ceil(total / PER_PAGE)) },
        });
    } catch (error) {
        console.error(`${LOG} Board error:`, error);
        return fail(res, 500, "Unable to load the requests.");
    }
};

export const getMyReplies = async (req, res) => {
    try {
        const responses = await PropertyRequestResponse.find({ responderId: me(req) }).sort({ createdAt: -1 }).limit(100).lean();
        const requests = await PropertyRequest.find({ _id: { $in: responses.map((response) => response.requestId) } }).lean();
        const seekers = await User.find({ _id: { $in: requests.map((request) => request.userId) } }).select(OWNER_CONTACT_FIELDS).lean();
        const requestById = new Map(requests.map((request) => [String(request._id), request]));
        const seekerById = new Map(seekers.map((user) => [String(user._id), user]));

        return res.status(200).json({
            success: true,
            replies: responses
                .filter((response) => requestById.has(String(response.requestId)))
                .map((response) => {
                    const request = requestById.get(String(response.requestId));
                    const seeker = seekerById.get(String(request.userId));
                    return {
                        ...responseView(response, null),
                        request: requestView(request),
                        seekerContact: response.contactShared && seeker ? { name: fullName(seeker), ...contactFromOwner(seeker) } : null,
                    };
                }),
        });
    } catch (error) {
        console.error(`${LOG} Replies error:`, error);
        return fail(res, 500, "Unable to load your replies.");
    }
};

export const respondToRequest = async (req, res) => {
    try {
        if (!isId(req.params.id)) return fail(res, 400, "Invalid request ID.");

        const message = String(req.body?.message || "").trim().slice(0, 1000);
        if (message.length < 10) return fail(res, 400, "Write a short message (10 characters at least).", { errors: { message: "tooShort" } });

        const request = await PropertyRequest.findById(req.params.id).lean();
        if (!request) return fail(res, 404, "Request not found.");
        if (String(request.userId) === me(req)) return fail(res, 400, "You cannot reply to your own request.");
        if (request.status !== "active" || isExpired(request)) return fail(res, 410, "This request is no longer active.");

        let listing = null;
        const linked = req.body?.listing;
        if (linked?.kind && linked?.id) {
            listing = await getListingSummary({ kind: String(linked.kind), id: String(linked.id), ownerId: me(req) });
            if (!listing) return fail(res, 400, "This listing is not one of yours.", { errors: { listing: "notYours" } });
        }

        let response;
        try {
            response = await PropertyRequestResponse.create({
                requestId: request._id,
                requesterId: request.userId,
                responderId: me(req),
                message,
                ...(listing ? { listing } : {}),
            });
        } catch (error) {
            if (error?.code === 11000) return fail(res, 409, "You already replied to this request.", { code: "ALREADY_REPLIED" });
            throw error;
        }

        await PropertyRequest.updateOne({ _id: request._id }, { $inc: { responsesCount: 1 } });

        const responder = await User.findById(me(req)).select("firstName lastName professionalProfile").lean();
        notifyNewResponse({ request, responder: responder || {}, message }, io(req)).catch((error) => console.error(`${LOG} Reply notify error:`, error));

        return res.status(201).json({ success: true, message: "Your reply was sent.", response: responseView(response.toObject(), null) });
    } catch (error) {
        console.error(`${LOG} Reply error:`, error);
        return fail(res, 500, "Unable to send your reply.");
    }
};

export const shareContact = async (req, res) => {
    try {
        const request = await loadOwnRequest(req, res);
        if (!request) return undefined;
        if (!isId(req.params.responseId)) return fail(res, 400, "Invalid reply ID.");

        const response = await PropertyRequestResponse.findOne({ _id: req.params.responseId, requestId: request._id });
        if (!response) return fail(res, 404, "Reply not found.");

        if (!response.contactShared) {
            response.contactShared = true;
            response.contactSharedAt = new Date();
            await response.save();

            const seeker = await User.findById(me(req)).select(OWNER_CONTACT_FIELDS).lean();
            notifyContactShared({ request, seeker: seeker || {}, responderId: response.responderId, contact: contactFromOwner(seeker) }, io(req)).catch((error) =>
                console.error(`${LOG} Share notify error:`, error)
            );
        }

        return res.status(200).json({ success: true, message: "Your contact details were shared.", responseId: String(response._id) });
    } catch (error) {
        console.error(`${LOG} Share error:`, error);
        return fail(res, 500, "Unable to share your contact details.");
    }
};

/* --------------------------------------------------
   Public profile
-------------------------------------------------- */

export const getUserPublicRequests = async (req, res) => {
    try {
        const { userId } = req.params;
        if (!isId(userId)) return fail(res, 400, "Invalid user ID.");

        const user = await User.findOne({ _id: userId, accountStatus: { $ne: "suspended" }, deletionRequestedAt: null })
            .select("publicProfileVisibility")
            .lean();
        if (!user) return fail(res, 404, "User not found.");

        // Hidden unless the user chose to show their requests.
        if (!visibilityOf(user).requests) {
            return res.status(200).json({ success: true, hidden: true, requests: [], pagination: { page: 1, total: 0, totalPages: 1, hasMore: false } });
        }

        const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
        const filter = { userId: user._id, status: "active", expiresAt: { $gt: new Date() } };

        const [total, requests] = await Promise.all([
            PropertyRequest.countDocuments(filter),
            PropertyRequest.find(filter).sort({ createdAt: -1 }).skip((page - 1) * PER_PAGE).limit(PER_PAGE).lean(),
        ]);

        return res.status(200).json({
            success: true,
            hidden: false,
            requests: requests.map((request) => requestView(request)),
            pagination: { page, total, totalPages: Math.max(1, Math.ceil(total / PER_PAGE)), hasMore: page * PER_PAGE < total },
        });
    } catch (error) {
        console.error(`${LOG} Public list error:`, error);
        return fail(res, 500, "Unable to load the requests.");
    }
};

/* --------------------------------------------------
   Admin
-------------------------------------------------- */

const PERIOD_DAYS = { today: 1, week: 7, month: 30, year: 365 };
const ADMIN_PER_PAGE = 20;

export const adminListRequests = async (req, res) => {
    try {
        const filter = {};
        const now = new Date();
        const status = String(req.query.status || "all");
        if (status === "active") Object.assign(filter, { status: "active", expiresAt: { $gt: now } });
        else if (status === "expired") filter.$or = [{ status: "expired" }, { status: "active", expiresAt: { $lte: now } }];
        else if (status === "closed") filter.status = "closed";

        const days = PERIOD_DAYS[String(req.query.period || "all")];
        if (days) filter.createdAt = { $gte: new Date(now.getTime() - days * 24 * 60 * 60 * 1000) };

        const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
        const [total, requests] = await Promise.all([
            PropertyRequest.countDocuments(filter),
            PropertyRequest.find(filter).sort({ createdAt: -1 }).skip((page - 1) * ADMIN_PER_PAGE).limit(ADMIN_PER_PAGE).lean(),
        ]);
        const owners = await User.find({ _id: { $in: requests.map((request) => request.userId) } }).select("firstName lastName email profileImage accountStatus").lean();
        const ownerById = new Map(owners.map((user) => [String(user._id), user]));

        return res.status(200).json({
            success: true,
            requests: requests.map((request) => {
                const owner = ownerById.get(String(request.userId));
                return {
                    ...requestView(request),
                    owner: owner
                        ? { id: String(owner._id), firstName: owner.firstName, lastName: owner.lastName, email: owner.email, profileImage: owner.profileImage, accountStatus: owner.accountStatus }
                        : null,
                };
            }),
            pagination: { page, limit: ADMIN_PER_PAGE, total, totalPages: Math.max(1, Math.ceil(total / ADMIN_PER_PAGE)) },
        });
    } catch (error) {
        console.error(`${LOG} Admin list error:`, error);
        return fail(res, 500, "Unable to load the requests.");
    }
};

export const adminDeleteRequest = async (req, res) => {
    try {
        const { id } = req.params;
        if (!isId(id)) return fail(res, 400, "Invalid request.");

        const request = await PropertyRequest.findByIdAndDelete(id);
        if (!request) return fail(res, 404, "Request not found.");
        await PropertyRequestResponse.deleteMany({ requestId: request._id });

        console.log(`${LOG} Admin ${me(req)} deleted request ${id}`);
        return res.status(200).json({ success: true, message: "Request deleted.", id });
    } catch (error) {
        console.error(`${LOG} Admin delete error:`, error);
        return fail(res, 500, "Unable to delete this request.");
    }
};
