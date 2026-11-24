import mongoose from "mongoose";

const knowledgeContentSchema = new mongoose.Schema(
    {
        type: {
            type: String,
            enum: ["article", "video"],
            required: true,
            index: true,
        },

        title: {
            type: String,
            required: true,
            trim: true,
            maxlength: 200,
        },

        slug: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            index: true,
        },

        description: {
            type: String,
            trim: true,
            default: "",
            maxlength: 3000,
        },

        // Article source information.
        sourceUrl: {
            type: String,
            trim: true,
            default: "",
        },

        sourceName: {
            type: String,
            trim: true,
            default: "",
            maxlength: 150,
        },

        // YouTube information.
        youtubeVideoId: {
            type: String,
            trim: true,
            default: "",
        },

        thumbnailUrl: {
            type: String,
            trim: true,
            default: "",
        },

        category: {
            type: String,
            required: true,
            trim: true,
            maxlength: 100,
            index: true,
        },

        language: {
            type: String,
            enum: ["en", "fr", "ar"],
            required: true,
            default: "en",
            index: true,
        },

        tags: {
            type: [String],
            default: [],
        },

        isFeatured: {
            type: Boolean,
            default: false,
            index: true,
        },

        status: {
            type: String,
            enum: ["draft", "published", "archived"],
            default: "draft",
            index: true,
        },

        author: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },

        publishedAt: {
            type: Date,
            default: null,
        },

        reviewedAt: {
            type: Date,
            default: null,
        },
    },
    {
        timestamps: true,
    }
);

// Useful compound indexes for public filtering and admin management.
knowledgeContentSchema.index({
    status: 1,
    type: 1,
    category: 1,
    language: 1,
    publishedAt: -1,
});

knowledgeContentSchema.index({
    status: 1,
    isFeatured: 1,
    publishedAt: -1,
});

knowledgeContentSchema.index(
    {
        title: "text",
        tags: "text",
    },
    {
        default_language: "none",
        language_override: "textSearchLanguage",
    }
);

const KnowledgeContent =
    mongoose.models.KnowledgeContent ||
    mongoose.model("KnowledgeContent", knowledgeContentSchema);

export default KnowledgeContent;