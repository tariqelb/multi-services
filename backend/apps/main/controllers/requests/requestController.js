// backend/apps/main/controllers/requests/requestController.js
//
// Requests: a user posts what they are looking for (property or vehicle /
// spare part); professionals who chose to receive requests are notified and
// reply with "I have a match". The seeker's contact details stay hidden
// until the seeker shares them with a professional.
//
//   GET    /api/requests/profile              my "Receive requests" settings (+ prefill from my listings)
//   PUT    /api/requests/profile
//   POST   /api/requests                      post a request
//   GET    /api/requests/mine                 my requests
//   GET    /api/requests/board                requests for professionals (?service, matching, city, transaction, category, page)
//   GET    /api/requests/replies              replies I sent
//   GET    /api/requests/:id                  details (owner: with replies)
//   PATCH  /api/requests/:id                  close { status: "closed", closedReason }
//   POST   /api/requests/:id/renew            30 more days
//   DELETE /api/requests/:id
//   POST   /api/requests/:id/responses        reply { message, listing: { kind, id } }
//   POST   /api/requests/:id/responses/:responseId/share   share my contact with this professional
//   GET    /api/requests/user/:userId         a user's active requests on their public profile
//                                             (?service=property|vehicle; only if they chose to show them)
//   GET    /api/requests/admin/:service       admin list (property | vehicle)
//   DELETE /api/requests/admin/:service/:id   admin delete

import mongoose from "mongoose";

import User from "../../models/User.js";
import ServiceRequest from "../../models/ServiceRequest.js";
import RequestResponse from "../../models/RequestResponse.js";
import { contactFromOwner, OWNER_CONTACT_FIELDS } from "../../utils/ownerContact.js";
import { visibilityOf } from "../../utils/publicProfile.js";
import { getListingSummary, getPublishingActivity } from "../../services/serviceRegistry.js";
import { MAX_ACTIVE_REQUESTS, MAX_RECIPIENTS, REQUEST_SERVICES } from "../../utils/requestOptions.js";
import {
    CLOSE_REASON_VALUES,
    boardFilter,
    buildProfile,
    buildRequestData,
    expiryFrom,
    isExpired,
    profileView,
    recipientsFilter,
    requestMatchesProfile,
    requestView,
    shortName,
} from "../../services/requests/requestRules.js";
import { notifyContactShared, notifyNewResponse, notifyRequestRecipients } from "../../services/requests/requestNotifier.js";

const PER_PAGE = 12;
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

/* --------------------------------------------------
   Professional profile
-------------------------------------------------- */

export const getMyProfessionalProfile = async (req, res) => {
    try {
        const user = await User.findById(me(req)).select("professionalProfile").lean();
        if (!user) return fail(res, 404, "User not found.");

        let suggestion = {};
        try {
            suggestion = await getPublishingActivity(me(req));
        } catch (error) {
            console.error("[Requests] Activity error:", error.message);
        }

        return res.status(200).json({ success: true, profile: profileView(user), suggestion });
    } catch (error) {
        console.error("[Requests] Profile error:", error);
        return fail(res, 500, "Unable to load your settings.");
    }
};

export const updateMyProfessionalProfile = async (req, res) => {
    try {
        const { profile, errors } = buildProfile(req.body);
        if (Object.keys(errors).length) return fail(res, 400, "Please check the form.", { errors });

        const user = await User.findByIdAndUpdate(me(req), { $set: { professionalProfile: profile } }, { returnDocument: "after", runValidators: true }).select("professionalProfile").lean();
        if (!user) return fail(res, 404, "User not found.");

        return res.status(200).json({ success: true, message: "Settings saved.", profile: profileView(user) });
    } catch (error) {
        console.error("[Requests] Profile save error:", error);
        return fail(res, 500, "Unable to save your settings.");
    }
};

/* --------------------------------------------------
   Seeker: post and manage requests
-------------------------------------------------- */

export const createRequest = async (req, res) => {
    try {
        const { data, errors } = buildRequestData(req.body);
        if (Object.keys(errors).length) return fail(res, 400, "Please check the form.", { errors });

        const active = await ServiceRequest.countDocuments({ userId: me(req), status: "active", expiresAt: { $gt: new Date() } });
        if (active >= MAX_ACTIVE_REQUESTS) {
            return fail(res, 409, `You can have ${MAX_ACTIVE_REQUESTS} active requests at most. Close one first.`, { code: "TOO_MANY_ACTIVE" });
        }

        const request = await ServiceRequest.create({ ...data, userId: me(req), status: "active", expiresAt: expiryFrom() });
        const plain = request.toObject();

        // How many professionals will hear about it (sent in the background).
        const recipients = Math.min(MAX_RECIPIENTS, await User.countDocuments(recipientsFilter(plain)));
        notifyRequestRecipients(plain, io(req)).catch((error) => console.error("[Requests] Notify error:", error));

        return res.status(201).json({ success: true, message: "Your request is published.", request: { ...requestView(plain), recipientsCount: recipients } });
    } catch (error) {
        console.error("[Requests] Create error:", error);
        return fail(res, 500, "Unable to publish your request.");
    }
};

export const getMyRequests = async (req, res) => {
    try {
        const requests = await ServiceRequest.find({ userId: me(req) }).sort({ createdAt: -1 }).limit(100).lean();
        const unread = await RequestResponse.aggregate([
            { $match: { requesterId: new mongoose.Types.ObjectId(me(req)), readAt: null } },
            { $group: { _id: "$requestId", count: { $sum: 1 } } },
        ]);
        const unreadBy = new Map(unread.map((row) => [String(row._id), row.count]));

        return res.status(200).json({
            success: true,
            requests: requests.map((request) => ({ ...requestView(request), unreadResponses: unreadBy.get(String(request._id)) || 0 })),
        });
    } catch (error) {
        console.error("[Requests] Mine error:", error);
        return fail(res, 500, "Unable to load your requests.");
    }
};

async function loadOwnRequest(req, res) {
    if (!isId(req.params.id)) {
        fail(res, 400, "Invalid request ID.");
        return null;
    }
    const request = await ServiceRequest.findById(req.params.id);
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
        console.error("[Requests] Close error:", error);
        return fail(res, 500, "Unable to close this request.");
    }
};

export const renewRequest = async (req, res) => {
    try {
        const request = await loadOwnRequest(req, res);
        if (!request) return undefined;

        const now = new Date();
        const wasActive = request.status === "active" && request.expiresAt > now;
        if (!wasActive) {
            const active = await ServiceRequest.countDocuments({ userId: me(req), status: "active", expiresAt: { $gt: now } });
            if (active >= MAX_ACTIVE_REQUESTS) {
                return fail(res, 409, `You can have ${MAX_ACTIVE_REQUESTS} active requests at most. Close one first.`, { code: "TOO_MANY_ACTIVE" });
            }
        }

        request.status = "active";
        request.closedReason = "";
        request.expiresAt = expiryFrom(now);
        request.renewedAt = now;
        await request.save();

        return res.status(200).json({ success: true, message: "Request renewed for 30 days.", request: requestView(request.toObject(), { now }) });
    } catch (error) {
        console.error("[Requests] Renew error:", error);
        return fail(res, 500, "Unable to renew this request.");
    }
};

export const deleteRequest = async (req, res) => {
    try {
        const request = await loadOwnRequest(req, res);
        if (!request) return undefined;

        await RequestResponse.deleteMany({ requestId: request._id });
        await ServiceRequest.deleteOne({ _id: request._id });

        return res.status(200).json({ success: true, message: "Request deleted.", id: String(request._id) });
    } catch (error) {
        console.error("[Requests] Delete error:", error);
        return fail(res, 500, "Unable to delete this request.");
    }
};

/* --------------------------------------------------
   Details
-------------------------------------------------- */

export const getRequest = async (req, res) => {
    try {
        if (!isId(req.params.id)) return fail(res, 400, "Invalid request ID.");

        const request = await ServiceRequest.findById(req.params.id).lean();
        if (!request) return fail(res, 404, "Request not found.");

        const viewerId = me(req);
        const isOwner = String(request.userId) === viewerId;

        // Owner: every reply, with the professional's contact.
        if (isOwner) {
            const responses = await RequestResponse.find({ requestId: request._id }).sort({ createdAt: -1 }).lean();
            const responders = await User.find({ _id: { $in: responses.map((response) => response.responderId) } }).select(RESPONDER_FIELDS).lean();
            const byId = new Map(responders.map((user) => [String(user._id), user]));

            const unread = responses.filter((response) => !response.readAt).map((response) => response._id);
            if (unread.length) await RequestResponse.updateMany({ _id: { $in: unread } }, { $set: { readAt: new Date() } });

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
            RequestResponse.findOne({ requestId: request._id, responderId: viewerId }).lean(),
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
                      seekerContact: myResponse.contactShared && seeker ? { name: [seeker.firstName, seeker.lastName].filter(Boolean).join(" "), ...contactFromOwner(seeker) } : null,
                  }
                : null,
        });
    } catch (error) {
        console.error("[Requests] Details error:", error);
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
        const matching = req.query.matching !== "false" && req.query.matching !== "0";
        const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);

        const filter = boardFilter({
            viewerId: me(req),
            profile: profile.fields.length ? profile : null,
            matching: matching && profile.fields.length > 0,
            service: String(req.query.service || ""),
            city: String(req.query.city || "").trim().slice(0, 100),
            transaction: String(req.query.transaction || ""),
            category: String(req.query.category || ""),
        });

        // Suspended seekers' requests are hidden.
        const suspended = await User.distinct("_id", { accountStatus: "suspended" });
        if (suspended.length) filter.userId = { ...(filter.userId || {}), $nin: suspended };

        const [total, requests] = await Promise.all([
            ServiceRequest.countDocuments(filter),
            ServiceRequest.find(filter).sort({ createdAt: -1 }).skip((page - 1) * PER_PAGE).limit(PER_PAGE).lean(),
        ]);

        const replied = await RequestResponse.find({ responderId: me(req), requestId: { $in: requests.map((request) => request._id) } })
            .select("requestId")
            .lean();
        const repliedIds = new Set(replied.map((response) => String(response.requestId)));

        return res.status(200).json({
            success: true,
            profile: { receiveRequests: profile.receiveRequests, fields: profile.fields, configured: profile.fields.length > 0 },
            matching: matching && profile.fields.length > 0,
            requests: requests.map((request) => ({ ...requestView(request), replied: repliedIds.has(String(request._id)) })),
            pagination: { page, limit: PER_PAGE, total, totalPages: Math.max(1, Math.ceil(total / PER_PAGE)) },
        });
    } catch (error) {
        console.error("[Requests] Board error:", error);
        return fail(res, 500, "Unable to load the requests.");
    }
};

export const getMyReplies = async (req, res) => {
    try {
        const responses = await RequestResponse.find({ responderId: me(req) }).sort({ createdAt: -1 }).limit(100).lean();
        const requests = await ServiceRequest.find({ _id: { $in: responses.map((response) => response.requestId) } }).lean();
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
                        seekerContact:
                            response.contactShared && seeker ? { name: [seeker.firstName, seeker.lastName].filter(Boolean).join(" "), ...contactFromOwner(seeker) } : null,
                    };
                }),
        });
    } catch (error) {
        console.error("[Requests] Replies error:", error);
        return fail(res, 500, "Unable to load your replies.");
    }
};

export const respondToRequest = async (req, res) => {
    try {
        if (!isId(req.params.id)) return fail(res, 400, "Invalid request ID.");

        const message = String(req.body?.message || "").trim().slice(0, 1000);
        if (message.length < 10) return fail(res, 400, "Write a short message (10 characters at least).", { errors: { message: "tooShort" } });

        const request = await ServiceRequest.findById(req.params.id).lean();
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
            response = await RequestResponse.create({
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

        await ServiceRequest.updateOne({ _id: request._id }, { $inc: { responsesCount: 1 } });

        const responder = await User.findById(me(req)).select("firstName lastName professionalProfile").lean();
        notifyNewResponse({ request, responder: responder || {}, message }, io(req)).catch((error) => console.error("[Requests] Reply notify error:", error));

        return res.status(201).json({ success: true, message: "Your reply was sent.", response: responseView(response.toObject(), null) });
    } catch (error) {
        console.error("[Requests] Reply error:", error);
        return fail(res, 500, "Unable to send your reply.");
    }
};

export const shareContact = async (req, res) => {
    try {
        const request = await loadOwnRequest(req, res);
        if (!request) return undefined;
        if (!isId(req.params.responseId)) return fail(res, 400, "Invalid reply ID.");

        const response = await RequestResponse.findOne({ _id: req.params.responseId, requestId: request._id });
        if (!response) return fail(res, 404, "Reply not found.");

        if (!response.contactShared) {
            response.contactShared = true;
            response.contactSharedAt = new Date();
            await response.save();

            const seeker = await User.findById(me(req)).select(OWNER_CONTACT_FIELDS).lean();
            notifyContactShared({ request, seeker: seeker || {}, responderId: response.responderId, contact: contactFromOwner(seeker) }, io(req)).catch((error) =>
                console.error("[Requests] Share notify error:", error)
            );
        }

        return res.status(200).json({ success: true, message: "Your contact details were shared.", responseId: String(response._id) });
    } catch (error) {
        console.error("[Requests] Share error:", error);
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
        if (REQUEST_SERVICES.includes(req.query.service)) filter.service = req.query.service;

        const [total, requests] = await Promise.all([
            ServiceRequest.countDocuments(filter),
            ServiceRequest.find(filter).sort({ createdAt: -1 }).skip((page - 1) * PER_PAGE).limit(PER_PAGE).lean(),
        ]);

        return res.status(200).json({
            success: true,
            hidden: false,
            requests: requests.map((request) => requestView(request)),
            pagination: { page, total, totalPages: Math.max(1, Math.ceil(total / PER_PAGE)), hasMore: page * PER_PAGE < total },
        });
    } catch (error) {
        console.error("[Requests] Public list error:", error);
        return fail(res, 500, "Unable to load the requests.");
    }
};

/* --------------------------------------------------
   Admin
-------------------------------------------------- */

const PERIOD_DAYS = { today: 1, week: 7, month: 30, year: 365 };

export const adminListRequests = async (req, res) => {
    try {
        const { service } = req.params;
        if (!REQUEST_SERVICES.includes(service)) return fail(res, 400, "Invalid service.");

        const filter = { service };
        const status = String(req.query.status || "all");
        if (["active", "closed", "expired"].includes(status)) {
            if (status === "active") Object.assign(filter, { status: "active", expiresAt: { $gt: new Date() } });
            else if (status === "expired") filter.$or = [{ status: "expired" }, { status: "active", expiresAt: { $lte: new Date() } }];
            else filter.status = status;
        }
        const days = PERIOD_DAYS[String(req.query.period || "all")];
        if (days) filter.createdAt = { $gte: new Date(Date.now() - days * 24 * 60 * 60 * 1000) };

        const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
        const [total, requests] = await Promise.all([
            ServiceRequest.countDocuments(filter),
            ServiceRequest.find(filter).sort({ createdAt: -1 }).skip((page - 1) * 20).limit(20).lean(),
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
            pagination: { page, limit: 20, total, totalPages: Math.max(1, Math.ceil(total / 20)) },
        });
    } catch (error) {
        console.error("[Requests] Admin list error:", error);
        return fail(res, 500, "Unable to load the requests.");
    }
};

export const adminDeleteRequest = async (req, res) => {
    try {
        const { service, id } = req.params;
        if (!REQUEST_SERVICES.includes(service) || !isId(id)) return fail(res, 400, "Invalid request.");

        const request = await ServiceRequest.findOneAndDelete({ _id: id, service });
        if (!request) return fail(res, 404, "Request not found.");
        await RequestResponse.deleteMany({ requestId: request._id });

        console.log(`[Requests] Admin ${me(req)} deleted request ${id}`);
        return res.status(200).json({ success: true, message: "Request deleted.", id });
    } catch (error) {
        console.error("[Requests] Admin delete error:", error);
        return fail(res, 500, "Unable to delete this request.");
    }
};
