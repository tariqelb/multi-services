import mongoose from "mongoose";
import Feedback from "../../DatabaseModels/Schema/Feedback.js";
import User from "../../DatabaseModels/Schema/User.js";

const ALLOWED_TYPES = ["feedback", "bug", "user_report", "other"];
const ALLOWED_PRIORITIES = ["low", "medium", "high"];

// POST /api/feedback
export const createFeedback = async (req, res) => {
    try {
        const userId = req.user?.userId;

        if (!userId || !mongoose.isValidObjectId(userId)) {
            return res.status(401).json({
                success: false,
                message: "Authentication required.",
            });
        }

        const {
            type,
            subject,
            description,
            priority,
            reportedUser,
            pageUrl,
        } = req.body;

        // Validate required fields.
        if (
            !type ||
            !subject?.trim() ||
            !description?.trim()
        ) {
            return res.status(400).json({
                success: false,
                message: "Type, subject, and description are required.",
            });
        }

        if (!ALLOWED_TYPES.includes(type)) {
            return res.status(400).json({
                success: false,
                message: "Invalid feedback type.",
            });
        }

        if (
            priority !== undefined &&
            !ALLOWED_PRIORITIES.includes(priority)
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid priority.",
            });
        }

        if (subject.trim().length > 150) {
            return res.status(400).json({
                success: false,
                message: "Subject cannot exceed 150 characters.",
            });
        }

        if (description.trim().length > 5000) {
            return res.status(400).json({
                success: false,
                message: "Description cannot exceed 5000 characters.",
            });
        }

        if (type === "user_report" && !reportedUser?.trim()) {
            return res.status(400).json({
                success: false,
                message: "Please identify the user you want to report.",
            });
        }

        // Never trust the email supplied by the frontend.
        const user = await User.findById(userId).select("email");

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User account not found.",
            });
        }

        const feedback = await Feedback.create({
            userId: user._id,
            email: user.email,
            type,
            subject: subject.trim(),
            description: description.trim(),
            priority: priority || "medium",
            reportedUser:
                type === "user_report"
                    ? reportedUser.trim()
                    : null,
            pageUrl: pageUrl?.trim() || null,
        });

        return res.status(201).json({
            success: true,
            message: "Your submission has been received successfully.",
            feedback: {
                _id: feedback._id,
                type: feedback.type,
                subject: feedback.subject,
                status: feedback.status,
                createdAt: feedback.createdAt,
            },
        });
    } catch (error) {
        console.error("Create feedback error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to submit your feedback. Please try again.",
        });
    }
};

// GET /api/feedback/mine
export const getMyFeedback = async (req, res) => {
    try {
        const userId = req.user?.userId;

        if (!userId || !mongoose.isValidObjectId(userId)) {
            return res.status(401).json({
                success: false,
                message: "Authentication required.",
            });
        }

        const feedback = await Feedback.find({ userId })
            .select("-__v")
            .sort({ createdAt: -1 })
            .lean();

        return res.status(200).json({
            success: true,
            count: feedback.length,
            feedback,
        });
    } catch (error) {
        console.error("Get my feedback error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to retrieve your submissions.",
        });
    }
};