// backend/apps/main/services/portfolio.js
//
// "Portfolio" of a user profile: articles (title, text, photos) and YouTube
// videos that show who the user is and what they do.
//
// Each service keeps its own portfolio (its own collection, routes and admin
// review): property and vehicles never see each other's items. This module
// only holds what they share, like main/middleware/imageUpload.js:
//
//   const schema = buildPortfolioSchema();                 // in the service model
//   const portfolio = createPortfolio({ Model, images, service: "property" });
//   router.get("/mine", authMiddleware, portfolio.getMine);
//
// Limits: 20 items per user and per service, 4 photos per article.

import mongoose from "mongoose";

export const PORTFOLIO_MAX_ITEMS = 20;
export const PORTFOLIO_MAX_IMAGES = 4;
export const PORTFOLIO_TYPES = ["article", "video"];
export const TITLE_MAX = 120;
export const ARTICLE_TEXT_MAX = 5000;
export const VIDEO_TEXT_MAX = 1000;

const PERIODS = ["today", "week", "month", "year", "all"];
const ADMIN_LIST_MAX = 300;
const OWNER_FIELDS = "firstName lastName email profileImage";

/* --------------------------------------------------
   Schema
-------------------------------------------------- */

export function buildPortfolioSchema() {
    const schema = new mongoose.Schema(
        {
            userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
            type: { type: String, enum: PORTFOLIO_TYPES, required: true },
            title: { type: String, required: true, trim: true, maxlength: TITLE_MAX },
            // Plain text (line breaks kept), never HTML.
            text: { type: String, default: "", trim: true, maxlength: ARTICLE_TEXT_MAX },
            // Articles: 1 to 4 photos, the first one is the cover.
            images: {
                type: [{ _id: false, filename: String, path: String }],
                default: [],
            },
            // Videos: the YouTube id only (played from youtube-nocookie.com).
            youtubeId: { type: String, default: "", match: /^$|^[A-Za-z0-9_-]{11}$/ },
        },
        { timestamps: true }
    );
    schema.index({ userId: 1, createdAt: -1 });
    schema.index({ createdAt: -1 });
    return schema;
}

/* --------------------------------------------------
   Pure helpers (exported for tests)
-------------------------------------------------- */

const YOUTUBE_HOSTS = ["youtube.com", "youtu.be", "youtube-nocookie.com"];
const YOUTUBE_ID = /^[A-Za-z0-9_-]{11}$/;

/**
 * YouTube id of a link: watch?v=, youtu.be/, /shorts/, /embed/, /live/, /v/.
 * Returns "" for anything else (other websites, playlists, channels).
 */
export function parseYoutubeId(input) {
    let value = String(input || "").trim();
    if (!value || value.length > 300) return "";
    if (!/^[a-z][a-z0-9+.-]*:/i.test(value)) value = `https://${value}`;

    let url;
    try {
        url = new URL(value);
    } catch {
        return "";
    }
    if (!["http:", "https:"].includes(url.protocol)) return "";

    const host = url.hostname.toLowerCase();
    if (!YOUTUBE_HOSTS.some((domain) => host === domain || host.endsWith(`.${domain}`))) return "";

    let id = "";
    if (host === "youtu.be" || host.endsWith(".youtu.be")) {
        id = url.pathname.split("/").filter(Boolean)[0] || "";
    } else if (url.searchParams.get("v")) {
        id = url.searchParams.get("v");
    } else {
        const [section, candidate] = url.pathname.split("/").filter(Boolean);
        if (["shorts", "embed", "live", "v"].includes(section)) id = candidate || "";
    }
    return YOUTUBE_ID.test(id) ? id : "";
}

export const youtubeUrlOf = (id) => (id ? `https://www.youtube.com/watch?v=${id}` : "");
export const youtubeThumbnailOf = (id) => (id ? `https://i.ytimg.com/vi/${id}/hqdefault.jpg` : "");

/** Plain text: no HTML tags, no control characters, at most 3 blank lines in a row. */
export function cleanText(value, max) {
    return String(value || "")
        .replace(/<[^>]*>/g, "")
        .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
        .replace(/\r\n?/g, "\n")
        .replace(/\n{4,}/g, "\n\n\n")
        .trim()
        .slice(0, max);
}

/**
 * Read the form. Returns { data } or { error }.
 * imageCount: photos the article will have once saved (kept + new).
 */
export function validatePortfolioInput(body = {}, { imageCount = 0, currentType = null } = {}) {
    const type = currentType || String(body.type || "");
    if (!PORTFOLIO_TYPES.includes(type)) return { error: "Choose an article or a video." };

    const title = cleanText(body.title, TITLE_MAX + 1).replace(/\s+/g, " ");
    if (title.length < 3) return { error: "The title needs at least 3 characters." };
    if (title.length > TITLE_MAX) return { error: `The title can have up to ${TITLE_MAX} characters.` };

    if (type === "video") {
        const youtubeId = parseYoutubeId(body.youtubeUrl);
        if (!youtubeId) return { error: "Paste a YouTube video link (youtube.com or youtu.be)." };
        const text = cleanText(body.text, VIDEO_TEXT_MAX + 1);
        if (text.length > VIDEO_TEXT_MAX) return { error: `The description can have up to ${VIDEO_TEXT_MAX} characters.` };
        return { data: { type, title, text, youtubeId } };
    }

    const text = cleanText(body.text, ARTICLE_TEXT_MAX + 1);
    if (text.length < 20) return { error: "Write at least 20 characters." };
    if (text.length > ARTICLE_TEXT_MAX) return { error: `The text can have up to ${ARTICLE_TEXT_MAX} characters.` };
    if (imageCount < 1) return { error: "Add at least one photo." };
    if (imageCount > PORTFOLIO_MAX_IMAGES) return { error: `An article can have up to ${PORTFOLIO_MAX_IMAGES} photos.` };
    return { data: { type, title, text, youtubeId: "" } };
}

/** What the pages receive. */
export function toPortfolioView(item) {
    if (!item) return null;
    const view = {
        id: String(item._id),
        type: item.type,
        title: item.title,
        text: item.text || "",
        images: (item.images || []).map((image) => ({ filename: image.filename, path: image.path })),
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
    };
    if (item.type === "video") {
        view.youtubeId = item.youtubeId;
        view.youtubeUrl = youtubeUrlOf(item.youtubeId);
        view.thumbnail = youtubeThumbnailOf(item.youtubeId);
    }
    return view;
}

function parseList(value) {
    if (Array.isArray(value)) return value.map(String);
    if (typeof value !== "string" || !value.trim()) return [];
    try {
        const parsed = JSON.parse(value);
        return Array.isArray(parsed) ? parsed.map(String) : [];
    } catch {
        return value.split(",").map((item) => item.trim()).filter(Boolean);
    }
}

function periodStart(period, now = new Date()) {
    const start = new Date(now);
    switch (period) {
        case "today":
            start.setHours(0, 0, 0, 0);
            return start;
        case "week":
            start.setDate(start.getDate() - 7);
            return start;
        case "month":
            start.setMonth(start.getMonth() - 1);
            return start;
        case "year":
            start.setFullYear(start.getFullYear() - 1);
            return start;
        default:
            return null;
    }
}

const isId = (value) => mongoose.Types.ObjectId.isValid(String(value || ""));

/* --------------------------------------------------
   Controllers
-------------------------------------------------- */

/**
 * @param {object} options
 *   - Model    the service's portfolio model
 *   - images   createImageUpload(...) of the service (uploadImages, deleteImages)
 *   - service  "property" | "vehicles" (log prefix)
 *   - UserModel  only for the public list (hidden accounts); optional
 */
export function createPortfolio({ Model, images, service, UserModel = null }) {
    const log = `[${service}:portfolio]`;

    // GET /portfolio/mine
    async function getMine(req, res) {
        try {
            const items = await Model.find({ userId: req.user.userId }).sort({ createdAt: -1 }).lean();
            return res.status(200).json({
                success: true,
                items: items.map(toPortfolioView),
                max: PORTFOLIO_MAX_ITEMS,
                maxImages: PORTFOLIO_MAX_IMAGES,
            });
        } catch (error) {
            console.error(`${log} mine`, error);
            return res.status(500).json({ success: false, message: "Unable to load your portfolio." });
        }
    }

    // GET /portfolio/user/:userId  (public profile)
    async function getUserPortfolio(req, res) {
        try {
            const { userId } = req.params;
            if (!isId(userId)) return res.status(400).json({ success: false, message: "Invalid user ID." });

            if (UserModel) {
                // Same rule as the public profile: active accounts only.
                const owner = await UserModel.findOne({ _id: userId, accountStatus: "active", deletionRequestedAt: null }).select("_id").lean();
                if (!owner) {
                    return res.status(404).json({ success: false, message: "User not found." });
                }
            }

            const items = await Model.find({ userId }).sort({ createdAt: -1 }).limit(PORTFOLIO_MAX_ITEMS).lean();
            return res.status(200).json({ success: true, items: items.map(toPortfolioView) });
        } catch (error) {
            console.error(`${log} public`, error);
            return res.status(500).json({ success: false, message: "Unable to load this portfolio." });
        }
    }

    // POST /portfolio   (multipart: type, title, text, youtubeUrl, images[])
    async function create(req, res) {
        const files = req.files || [];
        let uploaded = [];
        try {
            const count = await Model.countDocuments({ userId: req.user.userId });
            if (count >= PORTFOLIO_MAX_ITEMS) {
                return res.status(400).json({ success: false, message: `You can publish up to ${PORTFOLIO_MAX_ITEMS} articles and videos.` });
            }

            const type = String(req.body?.type || "");
            const { data, error } = validatePortfolioInput(req.body, { imageCount: type === "article" ? files.length : 0 });
            if (error) return res.status(400).json({ success: false, message: error });

            if (data.type === "article") uploaded = await images.uploadImages(files.slice(0, PORTFOLIO_MAX_IMAGES));

            const item = await Model.create({ ...data, images: uploaded, userId: req.user.userId });
            return res.status(201).json({ success: true, message: "Published on your profile.", item: toPortfolioView(item.toObject ? item.toObject() : item) });
        } catch (error) {
            if (uploaded.length) await images.deleteImages(uploaded);
            console.error(`${log} create`, error);
            return res.status(500).json({ success: false, message: "Unable to publish this item." });
        }
    }

    // PUT /portfolio/:id   (multipart: title, text, youtubeUrl, keepImages (JSON list of filenames), images[])
    async function update(req, res) {
        const files = req.files || [];
        let uploaded = [];
        try {
            const { id } = req.params;
            if (!isId(id)) return res.status(400).json({ success: false, message: "Invalid item ID." });

            const item = await Model.findOne({ _id: id, userId: req.user.userId });
            if (!item) return res.status(404).json({ success: false, message: "Item not found." });

            const keepNames = new Set(parseList(req.body?.keepImages));
            const kept = item.type === "article" ? (item.images || []).filter((image) => keepNames.has(image.filename)) : [];
            const dropped = (item.images || []).filter((image) => !kept.includes(image));
            const newFiles = item.type === "article" ? files : [];

            const { data, error } = validatePortfolioInput(req.body, {
                currentType: item.type,
                imageCount: kept.length + newFiles.length,
            });
            if (error) return res.status(400).json({ success: false, message: error });

            if (newFiles.length) uploaded = await images.uploadImages(newFiles);

            item.title = data.title;
            item.text = data.text;
            item.youtubeId = data.youtubeId;
            item.images = [...kept.map((image) => ({ filename: image.filename, path: image.path })), ...uploaded];
            await item.save();

            if (dropped.length) await images.deleteImages(dropped);

            return res.status(200).json({ success: true, message: "Saved.", item: toPortfolioView(item.toObject ? item.toObject() : item) });
        } catch (error) {
            if (uploaded.length) await images.deleteImages(uploaded);
            console.error(`${log} update`, error);
            return res.status(500).json({ success: false, message: "Unable to save this item." });
        }
    }

    // DELETE /portfolio/:id
    async function remove(req, res) {
        try {
            const { id } = req.params;
            if (!isId(id)) return res.status(400).json({ success: false, message: "Invalid item ID." });

            const item = await Model.findOneAndDelete({ _id: id, userId: req.user.userId });
            if (!item) return res.status(404).json({ success: false, message: "Item not found." });

            if (item.images?.length) await images.deleteImages(item.images);
            return res.status(200).json({ success: true, message: "Deleted.", id });
        } catch (error) {
            console.error(`${log} delete`, error);
            return res.status(500).json({ success: false, message: "Unable to delete this item." });
        }
    }

    // Admin: GET ...?period=today|week|month|year|all&type=all|article|video
    async function adminList(req, res) {
        try {
            const period = String(req.query.period || "today");
            const type = String(req.query.type || "all");
            if (!PERIODS.includes(period)) return res.status(400).json({ success: false, message: "Invalid period." });
            if (type !== "all" && !PORTFOLIO_TYPES.includes(type)) return res.status(400).json({ success: false, message: "Invalid type." });

            const start = periodStart(period);
            const filter = start ? { createdAt: { $gte: start } } : {};

            const [article, video] = await Promise.all(PORTFOLIO_TYPES.map((kind) => Model.countDocuments({ ...filter, type: kind })));

            const items = await Model.find(type === "all" ? filter : { ...filter, type })
                .populate("userId", OWNER_FIELDS)
                .sort({ createdAt: -1 })
                .limit(ADMIN_LIST_MAX)
                .lean();

            return res.status(200).json({
                success: true,
                period,
                type,
                counts: { all: article + video, article, video },
                items: items.map((item) => {
                    const owner = item.userId && typeof item.userId === "object" ? item.userId : null;
                    return {
                        ...toPortfolioView(item),
                        owner: owner
                            ? {
                                  id: String(owner._id),
                                  firstName: owner.firstName || "",
                                  lastName: owner.lastName || "",
                                  email: owner.email || "",
                                  profileImage: owner.profileImage || "",
                              }
                            : null,
                    };
                }),
            });
        } catch (error) {
            console.error(`${log} admin list`, error);
            return res.status(500).json({ success: false, message: "Failed to retrieve portfolio items." });
        }
    }

    // Admin: DELETE .../:id
    async function adminDelete(req, res) {
        try {
            const { id } = req.params;
            if (!isId(id)) return res.status(400).json({ success: false, message: "Invalid item ID." });

            const item = await Model.findByIdAndDelete(id);
            if (!item) return res.status(404).json({ success: false, message: "Item not found." });

            try {
                if (item.images?.length) await images.deleteImages(item.images);
            } catch (imageError) {
                console.error(`${log} image cleanup`, imageError);
            }

            console.log(`${log} Admin ${req.user?.userId} deleted ${item.type} ${id} of user ${item.userId}`);
            return res.status(200).json({ success: true, message: "Deleted.", id });
        } catch (error) {
            console.error(`${log} admin delete`, error);
            return res.status(500).json({ success: false, message: "Failed to delete this item." });
        }
    }

    // Account deletion: items and their photos.
    async function deleteUserItems(userId) {
        const items = await Model.find({ userId }).select("images").lean();
        for (const item of items) if (item.images?.length) await images.deleteImages(item.images);
        await Model.deleteMany({ userId });
    }

    return { getMine, getUserPortfolio, create, update, remove, adminList, adminDelete, deleteUserItems };
}
