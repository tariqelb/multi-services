// backend/apps/main/controllers/admin/adminUsersController.js
import mongoose from "mongoose";

import User from "../../models/User.js";

import { getUserDetailStats, getUserListStats } from "../../services/serviceRegistry.js";
import { forgetAccountStatus } from "../../services/accountStatus.js";
import { sendAccountStatusEmail } from "../../services/emailService.js";

import {
    DAY_MS,
    fillSeries,
    getDateKey,
    getRangeWindow,
    percentChange,
    rate,
} from "../../utils/analytics.js";
import { getUserWhatsApp } from "../../utils/whatsapp.js";

const getValidUserId = (userId) => mongoose.Types.ObjectId.isValid(userId);

// Also used by the services for their own admin user tabs.
export const getAdminUserOrRespond = async (userId, res) => {
    if (!getValidUserId(userId)) {
        res.status(400).json({
            success: false,
            message: "Invalid user ID.",
        });
        return null;
    }

    const user = await User.findById(userId)
        .select(
            [
                "firstName",
                "lastName",
                "email",
                "role",
                "accountStatus",
                "suspendedAt",
                "suspendedReason",
                "language",
                "emailVerified",
                "phoneNumber",
                "phoneVerified",
                "whatsappNumber",
                "whatsappVerified",
                "address",
                "bio",
                "profileImage",
                "notificationPreferences",
                "deletionRequestedAt",
                "scheduledDeletionAt",
                "createdAt",
                "updatedAt",
            ].join(" ")
        )
        .lean();

    if (!user) {
        res.status(404).json({
            success: false,
            message: "User not found.",
        });
        return null;
    }

    return user;
};

// GET /dashboard/users/:userId
export const getAdminUserDetails = async (req, res) => {
    try {
        const user = await getAdminUserOrRespond(req.params.userId, res);

        if (!user) return;

        // Each service adds its own numbers (publications, alerts, feedback...).
        const statistics = await getUserDetailStats(req.params.userId);

        return res.status(200).json({
            success: true,
            user,
            statistics,
        });
    } catch (error) {
        console.error("Get admin user details error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to retrieve user details.",
        });
    }
};

// -----------------------------------------------------------------------------
// Users list + user statistics
// -----------------------------------------------------------------------------

const buildUsersSummary = (users) => {
    const now = Date.now();
    const signupWindow = getRangeWindow("30d");

    const last7Days = now - 7 * DAY_MS;
    const last30Days = now - 30 * DAY_MS;
    const previous30Days = now - 60 * DAY_MS;

    const roles = new Map();
    const statuses = new Map();
    const signupsByDay = new Map();

    const summary = {
        totalUsers: users.length,
        activeUsers: 0,
        suspendedUsers: 0,
        emailVerified: 0,
        phoneVerified: 0,
        whatsappVerified: 0,
        pendingDeletion: 0,
        publishers: 0,
        activePublishers: 0,
        savers: 0,
        reporters: 0,
        newLast7Days: 0,
        newLast30Days: 0,
        newPrevious30Days: 0,
    };

    for (const user of users) {
        const role = String(user.role || "user").toLowerCase();
        const status = String(user.accountStatus || "active").toLowerCase();

        roles.set(role, (roles.get(role) || 0) + 1);
        statuses.set(status, (statuses.get(status) || 0) + 1);

        if (status === "active") summary.activeUsers += 1;
        if (status === "suspended") summary.suspendedUsers += 1;
        if (user.emailVerified) summary.emailVerified += 1;
        if (user.phoneVerified) summary.phoneVerified += 1;
        if (getUserWhatsApp(user).verified) {
            summary.whatsappVerified += 1;
        }
        if (user.deletionRequestedAt) summary.pendingDeletion += 1;
        if (user.publishedProperties > 0) summary.publishers += 1;
        if (user.activeProperties > 0) summary.activePublishers += 1;
        if (user.savedProperties > 0) summary.savers += 1;
        if (user.reports > 0) summary.reporters += 1;

        const createdAt = user.createdAt
            ? new Date(user.createdAt).getTime()
            : null;

        if (!createdAt) continue;

        if (createdAt >= last7Days) summary.newLast7Days += 1;

        if (createdAt >= last30Days) {
            summary.newLast30Days += 1;
        } else if (createdAt >= previous30Days) {
            summary.newPrevious30Days += 1;
        }

        if (createdAt >= signupWindow.start.getTime()) {
            const key = getDateKey(new Date(createdAt));
            signupsByDay.set(key, (signupsByDay.get(key) || 0) + 1);
        }
    }

    const toList = (map) =>
        Array.from(map.entries())
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value);

    return {
        ...summary,
        emailVerifiedRate: rate(summary.emailVerified, summary.totalUsers),
        phoneVerifiedRate: rate(summary.phoneVerified, summary.totalUsers),
        whatsappVerifiedRate: rate(summary.whatsappVerified, summary.totalUsers),
        publisherRate: rate(summary.publishers, summary.totalUsers),
        saverRate: rate(summary.savers, summary.totalUsers),
        newUsersChange: percentChange(
            summary.newLast30Days,
            summary.newPrevious30Days
        ),
        roles: toList(roles),
        statuses: toList(statuses),
        signupTrend: fillSeries(
            Array.from(signupsByDay.entries()).map(([date, users]) => ({
                date,
                users,
            })),
            signupWindow,
            { users: 0 }
        ),
    };
};

// GET /api/dashboard/users
export const getAdminUsers = async (req, res) => {
    try {
        const accounts = await User.find({})
            .select(
                "-password -emailVerificationCodeHash -emailVerificationExpires " +
                    "-phoneVerificationSessionId -phoneVerificationExpires " +
                    "-whatsappVerificationSessionId -whatsappVerificationExpires -profileImagePublicId"
            )
            .sort({ createdAt: -1 })
            .lean();

        // Each service adds per-user counters (publishedProperties, savedProperties, reports...).
        const stats = await getUserListStats(accounts.map((user) => user._id));
        const users = accounts.map((user) => ({ ...stats.defaults, ...user, ...stats.byUser.get(String(user._id)) }));

        return res.status(200).json({
            success: true,
            count: users.length,
            summary: buildUsersSummary(users),
            users,
        });
    } catch (error) {
        console.error("Get admin users error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to retrieve users.",
        });
    }
};

// -----------------------------------------------------------------------------
// Suspend / reactivate a user
// -----------------------------------------------------------------------------

// PATCH /api/dashboard/users/:userId/status   { status: "suspended" | "active", reason? }
export const updateAdminUserStatus = async (req, res) => {
    try {
        const { userId } = req.params;
        const status = String(req.body?.status || "").toLowerCase();
        const reason = String(req.body?.reason || "").trim().slice(0, 500);
        const notify = req.body?.notify !== false;

        if (!getValidUserId(userId)) {
            return res.status(400).json({ success: false, message: "Invalid user ID." });
        }

        if (!["active", "suspended"].includes(status)) {
            return res.status(400).json({
                success: false,
                message: "Status must be active or suspended.",
            });
        }

        if (String(userId) === String(req.user?.userId)) {
            return res.status(400).json({
                success: false,
                message: "You cannot change the status of your own account.",
            });
        }

        const user = await User.findById(userId).select(
            "firstName lastName email role language accountStatus suspendedAt suspendedReason suspendedBy"
        );

        if (!user) {
            return res.status(404).json({ success: false, message: "User not found." });
        }

        if (user.role === "admin" && status === "suspended") {
            return res.status(403).json({
                success: false,
                message: "Administrators cannot be suspended. Change their role first.",
            });
        }

        // Members manage ordinary accounts only; only admins change team members.
        if (user.role === "member" && req.admin && req.admin.role !== "admin") {
            return res.status(403).json({
                success: false,
                message: "Only an administrator can change the status of a team member.",
            });
        }

        if (status === "suspended" && !reason) {
            return res.status(400).json({
                success: false,
                message: "Please give a reason for the suspension.",
            });
        }

        const changed = user.accountStatus !== status;

        user.accountStatus = status;

        if (status === "suspended") {
            user.suspendedAt = user.suspendedAt && !changed ? user.suspendedAt : new Date();
            user.suspendedReason = reason;
            user.suspendedBy = req.user.userId;
        } else {
            user.suspendedAt = null;
            user.suspendedReason = "";
            user.suspendedBy = null;
        }

        await user.save();

        // Takes effect immediately everywhere.
        forgetAccountStatus(user._id);

        if (status === "suspended") {
            req.app?.get?.("io")?.in(`user:${user._id}`).disconnectSockets(true);
        }

        let emailSent = false;

        if (changed && notify && user.email) {
            try {
                await sendAccountStatusEmail({
                    to: user.email,
                    status,
                    reason,
                    language: user.language,
                });
                emailSent = true;
            } catch (emailError) {
                console.error("[Admin] Account status email failed:", emailError.message);
            }
        }

        console.log(`[Admin] ${req.user.userId} set user ${user._id} to ${status}`);

        return res.status(200).json({
            success: true,
            message: status === "suspended" ? "User suspended." : "User reactivated.",
            emailSent,
            user: {
                _id: user._id,
                accountStatus: user.accountStatus,
                suspendedAt: user.suspendedAt,
                suspendedReason: user.suspendedReason,
                suspendedBy: user.suspendedBy,
            },
        });
    } catch (error) {
        console.error("Update user status error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to update the user status.",
        });
    }
};
