import mongoose from "mongoose";
import KnowledgeContent from "../../DatabaseModels/Schema/KnowledgeContent.js";

const ALLOWED_TYPES = ["article", "video"];
const ALLOWED_LANGUAGES = ["en", "fr", "ar"];
const ALLOWED_STATUSES = ["draft", "published", "archived"];

const DEFAULT_PAGE_SIZE = 9;
const MAX_PAGE_SIZE = 50;

// --------------------------------------------------
// Helpers
// --------------------------------------------------

const createSlug = (value = "") => {
    return value
        .toString()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
};

const parseBoolean = (value, defaultValue = false) => {
    if (value === undefined || value === null || value === "") {
        return defaultValue;
    }

    if (value === true || value === "true") return true;
    if (value === false || value === "false") return false;

    return null;
};

const validateHttpUrl = (value) => {
    if (!value || typeof value !== "string") {
        return false;
    }

    try {
        const url = new URL(value.trim());

        return ["http:", "https:"].includes(url.protocol);
    } catch {
        return false;
    }
};

const normalizeTags = (tags) => {
    let values = tags;

    if (typeof values === "string") {
        values = values.split(",");
    }

    if (!Array.isArray(values)) {
        return null;
    }

    return [
        ...new Set(
            values
                .map((tag) => String(tag).trim().toLowerCase())
                .filter(Boolean)
        ),
    ].slice(0, 20);
};

const extractYouTubeVideoId = (value) => {
    if (!value || typeof value !== "string") {
        return null;
    }

    const input = value.trim();

    // Allow an already extracted YouTube video ID.
    if (/^[a-zA-Z0-9_-]{11}$/.test(input)) {
        return input;
    }

    let url;

    try {
        url = new URL(input);
    } catch {
        return null;
    }

    const hostname = url.hostname.toLowerCase().replace(/^www\./, "");

    const allowedHosts = [
        "youtube.com",
        "m.youtube.com",
        "youtu.be",
        "youtube-nocookie.com",
    ];

    if (!allowedHosts.includes(hostname)) {
        return null;
    }

    let videoId = "";

    if (hostname === "youtu.be") {
        videoId = url.pathname.split("/").filter(Boolean)[0] || "";
    } else {
        const pathParts = url.pathname.split("/").filter(Boolean);

        if (url.pathname === "/watch") {
            videoId = url.searchParams.get("v") || "";
        } else if (
            ["embed", "shorts", "live"].includes(pathParts[0])
        ) {
            videoId = pathParts[1] || "";
        }
    }

    return /^[a-zA-Z0-9_-]{11}$/.test(videoId)
        ? videoId
        : null;
};

const getYouTubeThumbnail = (videoId) => {
    return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
};

const getPagination = (query = {}) => {
    const requestedPage = Number.parseInt(query.page, 10);
    const requestedLimit = Number.parseInt(query.limit, 10);

    const page =
        Number.isInteger(requestedPage) && requestedPage > 0
            ? requestedPage
            : 1;

    const limit =
        Number.isInteger(requestedLimit) && requestedLimit > 0
            ? Math.min(requestedLimit, MAX_PAGE_SIZE)
            : DEFAULT_PAGE_SIZE;

    return {
        page,
        limit,
        skip: (page - 1) * limit,
    };
};

const buildContentPayload = (body = {}, existing = {}) => {
    const type = body.type ?? existing.type;
    const title = body.title ?? existing.title;
    const description = body.description ?? existing.description ?? "";
    const category = body.category ?? existing.category;
    const language = body.language ?? existing.language ?? "en";
    const sourceUrl = body.sourceUrl ?? existing.sourceUrl ?? "";
    const sourceName = body.sourceName ?? existing.sourceName ?? "";
    const youtubeInput =
        body.youtubeUrl ??
        body.youtubeVideoId ??
        existing.youtubeVideoId ??
        "";

    if (!ALLOWED_TYPES.includes(type)) {
        throw new Error("Content type must be article or video.");
    }

    if (
        typeof title !== "string" ||
        !title.trim() ||
        title.trim().length > 200
    ) {
        throw new Error("A valid title is required (maximum 200 characters).");
    }

    if (
        typeof description !== "string" ||
        description.trim().length > 3000
    ) {
        throw new Error("Description must be a string of maximum 3000 characters.");
    }

    if (
        typeof category !== "string" ||
        !category.trim() ||
        category.trim().length > 100
    ) {
        throw new Error("A valid category is required.");
    }

    if (!ALLOWED_LANGUAGES.includes(language)) {
        throw new Error("Language must be en, fr, or ar.");
    }

    const tags = normalizeTags(body.tags ?? existing.tags ?? []);

    if (!tags) {
        throw new Error("Tags must be provided as an array or comma-separated string.");
    }

    const isFeatured = parseBoolean(
        body.isFeatured,
        existing.isFeatured ?? false
    );

    if (isFeatured === null) {
        throw new Error("Featured must be true or false.");
    }

    const payload = {
        type,
        title: title.trim(),
        description: description.trim(),
        category: category.trim(),
        language,
        tags,
        isFeatured,
    };

    if (type === "article") {
        if (!validateHttpUrl(sourceUrl)) {
            throw new Error("A valid HTTP or HTTPS article source URL is required.");
        }

        if (
            typeof sourceName !== "string" ||
            sourceName.trim().length > 150
        ) {
            throw new Error("Source name must be a string of maximum 150 characters.");
        }

        payload.sourceUrl = sourceUrl.trim();
        payload.sourceName = sourceName.trim();
        payload.youtubeVideoId = "";
        payload.thumbnailUrl = "";
    }

    if (type === "video") {
        const youtubeVideoId = extractYouTubeVideoId(youtubeInput);

        if (!youtubeVideoId) {
            throw new Error("Please provide a valid YouTube video URL or video ID.");
        }

        const thumbnailUrl =
            body.thumbnailUrl !== undefined
                ? body.thumbnailUrl.trim()
                : getYouTubeThumbnail(youtubeVideoId);

        if (thumbnailUrl && !validateHttpUrl(thumbnailUrl)) {
            throw new Error("Thumbnail must be a valid HTTP or HTTPS URL.");
        }

        payload.youtubeVideoId = youtubeVideoId;
        payload.thumbnailUrl =
            thumbnailUrl || getYouTubeThumbnail(youtubeVideoId);

        payload.sourceUrl = "";
        payload.sourceName = "";
    }

    return payload;
};

const sendValidationError = (res, error) => {
    return res.status(400).json({
        success: false,
        message: error.message,
    });
};

// --------------------------------------------------
// PUBLIC: GET /api/knowledge
// List published articles and videos.
// --------------------------------------------------

export const getPublishedKnowledge = async (req, res) => {
    try {
        const { page, limit, skip } = getPagination(req.query);

        const filter = {
            status: "published",
        };

        const { type, category, language, featured } = req.query;

        if (type) {
            if (!ALLOWED_TYPES.includes(type)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid content type.",
                });
            }

            filter.type = type;
        }

        if (category) {
            filter.category = category.trim();
        }

        if (language) {
            if (!ALLOWED_LANGUAGES.includes(language)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid language.",
                });
            }

            filter.language = language;
        }

        if (featured !== undefined) {
            const parsedFeatured = parseBoolean(featured);

            if (parsedFeatured === null) {
                return res.status(400).json({
                    success: false,
                    message: "Featured must be true or false.",
                });
            }

            filter.isFeatured = parsedFeatured;
        }

        const [items, total] = await Promise.all([
            KnowledgeContent.find(filter)
                .select("-__v")
                .sort({
                    isFeatured: -1,
                    publishedAt: -1,
                    createdAt: -1,
                })
                .skip(skip)
                .limit(limit)
                .lean(),

            KnowledgeContent.countDocuments(filter),
        ]);

        return res.status(200).json({
            success: true,
            items,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
                hasNextPage: page * limit < total,
                hasPreviousPage: page > 1,
            },
        });
    } catch (error) {
        console.error("[Knowledge] Public list error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to load knowledge content.",
        });
    }
};

// --------------------------------------------------
// PUBLIC: GET /api/knowledge/search
// Search only published database content.
// --------------------------------------------------

export const searchPublishedKnowledge = async (req, res) => {
    try {
        const search = String(req.query.q || "").trim();

        if (!search) {
            return res.status(200).json({
                success: true,
                items: [],
            });
        }

        if (search.length > 100) {
            return res.status(400).json({
                success: false,
                message: "Search query is too long.",
            });
        }

        const { page, limit, skip } = getPagination(req.query);

        const words = search
            .split(/\s+/)
            .filter(Boolean)
            .slice(0, 8);

        const escapedWords = words.map((word) =>
            word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
        );

        const wordPatterns = escapedWords.map(
            (word) => new RegExp(word, "i")
        );

        // const filter = {
        //     status: "published",
        //     $or: [
        //         {
        //             title: {
        //                 $regex: escapedWords.join(".*"),
        //                 $options: "i",
        //             },
        //         },
        //         {
        //             $and: wordPatterns.map((pattern) => ({
        //                 tags: pattern,
        //             })),
        //         },
        //     ],
        // };
        const filter = {
            status: "published",
            $or: [
                ...wordPatterns.map((pattern) => ({
                    title: pattern,
                })),
                ...wordPatterns.map((pattern) => ({
                    tags: pattern,
                })),
            ],
        };

        if (req.query.type) {
            if (!ALLOWED_TYPES.includes(req.query.type)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid content type.",
                });
            }

            filter.type = req.query.type;
        }

        if (req.query.category) {
            filter.category = String(req.query.category).trim();
        }

        if (req.query.language) {
            if (!ALLOWED_LANGUAGES.includes(req.query.language)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid language.",
                });
            }

            filter.language = req.query.language;
        }

        const [items, total] = await Promise.all([
            KnowledgeContent.find(filter)
                .select("-__v")
                .sort({
                    isFeatured: -1,
                    publishedAt: -1,
                })
                .skip(skip)
                .limit(limit)
                .lean(),

            KnowledgeContent.countDocuments(filter),
        ]);

        return res.status(200).json({
            success: true,
            items,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        console.error("[Knowledge] Search error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to search knowledge content.",
        });
    }
};

// --------------------------------------------------
// PUBLIC: GET /api/knowledge/:id
// Published content only.
// --------------------------------------------------

export const getPublishedKnowledgeById = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid content ID.",
            });
        }

        const item = await KnowledgeContent.findOne({
            _id: id,
            status: "published",
        })
            .select("-__v")
            .lean();

        if (!item) {
            return res.status(404).json({
                success: false,
                message: "Knowledge content not found.",
            });
        }

        const relatedItems = await KnowledgeContent.find({
            _id: { $ne: item._id },
            status: "published",
            $or: [
                { category: item.category },
                { tags: { $in: item.tags } },
            ],
        })
            .select("-__v")
            .sort({ isFeatured: -1, publishedAt: -1 })
            .limit(4)
            .lean();

        return res.status(200).json({
            success: true,
            item,
            relatedItems,
        });
    } catch (error) {
        console.error("[Knowledge] Detail error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to load knowledge content.",
        });
    }
};

// --------------------------------------------------
// ADMIN: GET /api/knowledge/admin
// List all content, including drafts and archived.
// --------------------------------------------------

export const getAdminKnowledge = async (req, res) => {
    try {
        const { page, limit, skip } = getPagination(req.query);

        const filter = {};

        if (req.query.type) {
            if (!ALLOWED_TYPES.includes(req.query.type)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid content type.",
                });
            }

            filter.type = req.query.type;
        }

        if (req.query.status) {
            if (!ALLOWED_STATUSES.includes(req.query.status)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid content status.",
                });
            }

            filter.status = req.query.status;
        }

        if (req.query.search) {
            const search = String(req.query.search).trim();

            if (search.length > 100) {
                return res.status(400).json({
                    success: false,
                    message: "Search query is too long.",
                });
            }

            const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

            filter.$or = [
                { title: { $regex: escaped, $options: "i" } },
                { tags: { $regex: escaped, $options: "i" } },
            ];
        }

        const [items, total] = await Promise.all([
            KnowledgeContent.find(filter)
                .populate("author", "firstName lastName email")
                .select("-__v")
                .sort({ updatedAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),

            KnowledgeContent.countDocuments(filter),
        ]);

        return res.status(200).json({
            success: true,
            items,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        console.error("[Knowledge] Admin list error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to load knowledge management content.",
        });
    }
};

// --------------------------------------------------
// ADMIN: GET /api/knowledge/admin/:id
// Retrieve any content status.
// --------------------------------------------------

export const getAdminKnowledgeById = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid content ID.",
            });
        }

        const item = await KnowledgeContent.findById(id)
            .populate("author", "firstName lastName email")
            .select("-__v")
            .lean();

        if (!item) {
            return res.status(404).json({
                success: false,
                message: "Knowledge content not found.",
            });
        }

        return res.status(200).json({
            success: true,
            item,
        });
    } catch (error) {
        console.error("[Knowledge] Admin detail error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to load knowledge content.",
        });
    }
};

// --------------------------------------------------
// ADMIN: POST /api/knowledge
// Create article or YouTube video.
// --------------------------------------------------

export const createKnowledgeContent = async (req, res) => {
    try {
        const userId = req.user?.userId;

        if (!userId || !mongoose.isValidObjectId(userId)) {
            return res.status(401).json({
                success: false,
                message: "Authenticated administrator ID is missing or invalid.",
            });
        }

        const payload = buildContentPayload(req.body);

        const requestedStatus = req.body.status || "draft";

        if (!ALLOWED_STATUSES.includes(requestedStatus)) {
            return res.status(400).json({
                success: false,
                message: "Invalid content status.",
            });
        }

        const content = new KnowledgeContent({
            ...payload,
            author: userId,
            status: requestedStatus,
            publishedAt:
                requestedStatus === "published" ? new Date() : null,
            reviewedAt:
                requestedStatus === "published" ? new Date() : null,
        });

        // The document ID is generated before saving, so it can
        // be included in a unique, readable slug.
        const baseSlug = createSlug(payload.title) || "knowledge";

        content.slug = `${baseSlug}-${content._id.toString().slice(-6)}`;

        await content.save();

        return res.status(201).json({
            success: true,
            message: "Knowledge content created successfully.",
            item: content,
        });
    } catch (error) {
        console.error("[Knowledge] Create error:", error);

        if (error.message && !error.name?.includes("Mongo")) {
            return sendValidationError(res, error);
        }

        if (error.code === 11000) {
            return res.status(409).json({
                success: false,
                message: "A content item with this slug already exists.",
            });
        }

        return res.status(500).json({
            success: false,
            message: "Failed to create knowledge content.",
        });
    }
};

// --------------------------------------------------
// ADMIN: PUT /api/knowledge/:id
// Update content.
// --------------------------------------------------

export const updateKnowledgeContent = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid content ID.",
            });
        }

        const content = await KnowledgeContent.findById(id);

        if (!content) {
            return res.status(404).json({
                success: false,
                message: "Knowledge content not found.",
            });
        }

        const payload = buildContentPayload(req.body, content);

        Object.assign(content, payload);

        if (req.body.status !== undefined) {
            if (!ALLOWED_STATUSES.includes(req.body.status)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid content status.",
                });
            }

            content.status = req.body.status;

            if (req.body.status === "published" && !content.publishedAt) {
                content.publishedAt = new Date();
            }

            if (req.body.status === "published") {
                content.reviewedAt = new Date();
            }
        }

        await content.save();

        return res.status(200).json({
            success: true,
            message: "Knowledge content updated successfully.",
            item: content,
        });
    } catch (error) {
        console.error("[Knowledge] Update error:", error);

        if (error.message && !error.name?.includes("Mongo")) {
            return sendValidationError(res, error);
        }

        return res.status(500).json({
            success: false,
            message: "Failed to update knowledge content.",
        });
    }
};

// --------------------------------------------------
// ADMIN: PATCH /api/knowledge/:id/status
// Publish, unpublish (draft), or archive.
// --------------------------------------------------

export const updateKnowledgeStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid content ID.",
            });
        }

        if (!ALLOWED_STATUSES.includes(status)) {
            return res.status(400).json({
                success: false,
                message: "Status must be draft, published, or archived.",
            });
        }

        const content = await KnowledgeContent.findById(id);

        if (!content) {
            return res.status(404).json({
                success: false,
                message: "Knowledge content not found.",
            });
        }

        content.status = status;

        if (status === "published") {
            if (!content.publishedAt) {
                content.publishedAt = new Date();
            }

            content.reviewedAt = new Date();
        }

        await content.save();

        return res.status(200).json({
            success: true,
            message: `Content status changed to ${status}.`,
            item: content,
        });
    } catch (error) {
        console.error("[Knowledge] Status update error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to update content status.",
        });
    }
};

// --------------------------------------------------
// ADMIN: DELETE /api/knowledge/:id
// --------------------------------------------------

export const deleteKnowledgeContent = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid content ID.",
            });
        }

        const content = await KnowledgeContent.findByIdAndDelete(id);

        if (!content) {
            return res.status(404).json({
                success: false,
                message: "Knowledge content not found.",
            });
        }

        return res.status(200).json({
            success: true,
            message: "Knowledge content deleted successfully.",
        });
    } catch (error) {
        console.error("[Knowledge] Delete error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to delete knowledge content.",
        });
    }
};