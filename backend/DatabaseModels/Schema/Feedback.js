import mongoose from "mongoose";

const feedbackSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },

        email: {
            type: String,
            required: true,
            trim: true,
            lowercase: true,
        },

        type: {
            type: String,
            enum: ["feedback", "bug", "user_report", "other"],
            required: true,
        },

        subject: {
            type: String,
            required: true,
            trim: true,
            maxlength: 150,
        },

        description: {
            type: String,
            required: true,
            trim: true,
            maxlength: 5000,
        },

        priority: {
            type: String,
            enum: ["low", "medium", "high"],
            default: "medium",
        },

        reportedUser: {
            type: String,
            trim: true,
            maxlength: 100,
            default: null,
        },

        pageUrl: {
            type: String,
            trim: true,
            maxlength: 2048,
            default: null,
        },

        status: {
            type: String,
            enum: ["open", "in_progress", "resolved", "closed"],
            default: "open",
            index: true,
        },
    },
    {
        timestamps: true,
    }
);

const Feedback = mongoose.model("Feedback", feedbackSchema);

export default Feedback;