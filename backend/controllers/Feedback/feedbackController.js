import mongoose from "mongoose";
import Feedback from "../../DatabaseModels/Schema/Feedback.js";
import User from "../../DatabaseModels/Schema/User.js";
import { mkdir, writeFile, unlink } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
const ALLOWED_TYPES = ["feedback", "bug", "user_report", "other"];
const ALLOWED_PRIORITIES = ["low", "medium", "high"];

// POST /api/feedback

// POST /api/feedback
export const createFeedback = async (req, res) => {
    const savedFilePaths = [];

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

        const files = req.files || [];

        // Validate required fields.
        if (
            !type ||
            typeof subject !== "string" ||
            !subject.trim() ||
            typeof description !== "string" ||
            !description.trim()
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

        if (
            type === "user_report" &&
            (
                typeof reportedUser !== "string" ||
                !reportedUser.trim()
            )
        ) {
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

        // Save attachments only after validating the submission.
        const uploadDirectory = path.join(
            process.cwd(),
            "private_uploads",
            "feedback"
        );

        await mkdir(uploadDirectory, { recursive: true });

        const extensionByMimeType = {
            "image/jpeg": ".jpg",
            "image/png": ".png",
            "image/webp": ".webp",
            "image/gif": ".gif",
            "text/plain": ".txt",
        };

        const attachments = [];

        for (const file of files) {
            const extension = extensionByMimeType[file.mimetype];

            if (!extension) {
                throw new Error("Unsupported attachment file type.");
            }

            const filename = `${randomUUID()}${extension}`;
            const filePath = path.join(uploadDirectory, filename);

            await writeFile(filePath, file.buffer, {
                flag: "wx",
            });

            savedFilePaths.push(filePath);

            attachments.push({
                originalName: path.basename(file.originalname),
                filename,
                path: `private_uploads/feedback/${filename}`,
                mimetype: file.mimetype,
                size: file.size,
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
            pageUrl:
                typeof pageUrl === "string"
                    ? pageUrl.trim() || null
                    : null,
            attachments,
        });

        return res.status(201).json({
            success: true,
            message: "Your submission has been received successfully.",
            feedback: {
                _id: feedback._id,
                type: feedback.type,
                subject: feedback.subject,
                status: feedback.status,
                attachments: feedback.attachments,
                createdAt: feedback.createdAt,
            },
        });
    } catch (error) {
        // Remove uploaded files if saving the submission fails.
        await Promise.all(
            savedFilePaths.map((filePath) =>
                unlink(filePath).catch((cleanupError) => {
                    console.error(
                        "Attachment cleanup error:",
                        cleanupError
                    );
                })
            )
        );

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




// GET /api/feedback/admin-list

export const getAdminFeedback = async (req, res) => {
    try {
        res.set("Cache-Control", "no-store, private");

        const {
            status,
            type,
            priority,
            page = "1",
            limit = "10",
        } = req.query;

        const allowedStatuses = [
            "open",
            "in_progress",
            "resolved",
            "closed",
        ];

        if (status && !allowedStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: "Invalid feedback status.",
            });
        }

        if (type && !ALLOWED_TYPES.includes(type)) {
            return res.status(400).json({
                success: false,
                message: "Invalid feedback type.",
            });
        }

        if (priority && !ALLOWED_PRIORITIES.includes(priority)) {
            return res.status(400).json({
                success: false,
                message: "Invalid feedback priority.",
            });
        }

        const currentPage = Number(page);

        if (
            !Number.isSafeInteger(currentPage) ||
            currentPage < 1
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid page number.",
            });
        }

        const showAll = limit === "all";
        const pageLimit = showAll ? null : Number(limit);

        if (
            !showAll &&
            (
                !Number.isSafeInteger(pageLimit) ||
                pageLimit < 1 ||
                pageLimit > 100
            )
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid limit. Use 10, 50, or all.",
            });
        }

        const filter = {};

        if (status) filter.status = status;
        if (type) filter.type = type;
        if (priority) filter.priority = priority;

        let feedbackQuery = Feedback.find(filter)
            .select("-__v")
            .populate({
                path: "userId",
                select: "firstName lastName email",
            })
            .sort({ createdAt: -1, _id: -1 });

        if (!showAll) {
            feedbackQuery = feedbackQuery
                .skip((currentPage - 1) * pageLimit)
                .limit(pageLimit);
        }

        const [feedbacks, total] = await Promise.all([
            feedbackQuery.lean(),
            Feedback.countDocuments(filter),
        ]);

        const formattedFeedbacks = feedbacks.map((feedback) => ({
            ...feedback,

            attachments: (feedback.attachments || []).map(
                (attachment) => ({
                    _id: attachment._id,
                    originalName: attachment.originalName,
                    filename: attachment.filename,
                    mimetype: attachment.mimetype,
                    size: attachment.size,
                    downloadUrl:
                        `/api/feedback/${feedback._id}/attachments/${attachment._id}`,
                })
            ),
        }));

        return res.status(200).json({
            success: true,
            count: formattedFeedbacks.length,
            total,
            page: showAll ? 1 : currentPage,
            limit: showAll ? "all" : pageLimit,
            totalPages: showAll
                ? (total > 0 ? 1 : 0)
                : Math.ceil(total / pageLimit),
            feedbacks: formattedFeedbacks,
        });
    } catch (error) {
        console.error("Get admin feedback error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to retrieve feedback submissions.",
        });
    }
};



const ALLOWED_STATUSES = [
    "open",
    "in_progress",
    "resolved",
    "closed",
];

// PATCH /api/feedback/:feedbackId/status

export const updateFeedbackStatus = async (req, res) => {
    try {
        res.set("Cache-Control", "no-store, private");

        const { feedbackId } = req.params;
        const { status } = req.body;

        if (!mongoose.isValidObjectId(feedbackId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid feedback ID.",
            });
        }

        if (!ALLOWED_STATUSES.includes(status)) {
            return res.status(400).json({
                success: false,
                message: "Invalid feedback status.",
            });
        }

        const feedback = await Feedback.findByIdAndUpdate(
            feedbackId,
            {
                $set: { status },
            },
            {
                new: true,
                runValidators: true,
            }
        )
            .select("-__v")
            .populate({
                path: "userId",
                select: "firstName lastName email",
            })
            .lean();

        if (!feedback) {
            return res.status(404).json({
                success: false,
                message: "Feedback submission not found.",
            });
        }

        return res.status(200).json({
            success: true,
            message: "Feedback status updated successfully.",
            feedback,
        });
    } catch (error) {
        console.error("Update feedback status error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to update feedback status.",
        });
    }
};
