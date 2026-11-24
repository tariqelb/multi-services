// backend/apps/main/controllers/admin/adminRolesController.js
//
// Admin panel > Account > Roles (admins only).
//
//   GET   /api/dashboard/roles?q=&role=all|client|member|admin&page=&limit=
//         -> { users: [{ id, firstName, lastName, email, profileImage, role, permissions, accountStatus }],
//              counts: { all, client, member, admin }, sections, pagination }
//   PATCH /api/dashboard/users/:userId/role   { role, permissions? }
//         role: client | member | admin; permissions (members only):
//         { users: "read" | "write", vehiclePublications: "write", ... }
//
// Safety: an admin cannot change their own role, and the last admin cannot
// lose the admin role.

import mongoose from "mongoose";

import User from "../../models/User.js";
import { ADMIN_SECTIONS, GRANTABLE_SECTIONS, ROLES, cleanPermissions, permissionsOf } from "../../services/adminAccess.js";
import { forgetAccountStatus } from "../../services/accountStatus.js";

const MAX_LIMIT = 50;
const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const view = (user) => ({
    id: String(user._id),
    firstName: user.firstName || "",
    lastName: user.lastName || "",
    email: user.email || "",
    profileImage: user.profileImage || "",
    role: user.role || "client",
    permissions: user.role === "member" ? permissionsOf(user) : {},
    accountStatus: user.accountStatus || "active",
    createdAt: user.createdAt,
});

/** Search filter: names, email (each word must match). */
export function rolesFilter({ q = "", role = "all" } = {}) {
    const filter = {};
    if (ROLES.includes(role)) filter.role = role === "client" ? { $in: ["client", null] } : role;

    const words = String(q).trim().slice(0, 80).split(/\s+/).filter(Boolean);
    if (words.length) {
        filter.$and = words.map((word) => {
            const pattern = new RegExp(escapeRegex(word), "i");
            return { $or: [{ firstName: pattern }, { lastName: pattern }, { email: pattern }] };
        });
    }
    return filter;
}

// GET /api/dashboard/roles
export const getRoles = async (req, res) => {
    try {
        const role = String(req.query.role || "all").toLowerCase();
        const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
        const limit = Math.min(MAX_LIMIT, Math.max(1, Number.parseInt(req.query.limit, 10) || 20));
        const filter = rolesFilter({ q: req.query.q, role });

        const [total, accounts, counted] = await Promise.all([
            User.countDocuments(filter),
            User.find(filter)
                .select("firstName lastName email profileImage role adminPermissions accountStatus createdAt")
                // Admins and members first, then the newest accounts.
                .sort({ role: 1, createdAt: -1 })
                .skip((page - 1) * limit)
                .limit(limit)
                .lean(),
            User.aggregate([{ $group: { _id: "$role", count: { $sum: 1 } } }]),
        ]);

        const counts = { all: 0, client: 0, member: 0, admin: 0 };
        counted.forEach(({ _id, count }) => {
            const key = ROLES.includes(_id) ? _id : "client";
            counts[key] += count;
            counts.all += count;
        });

        return res.status(200).json({
            success: true,
            users: accounts.map(view),
            counts,
            sections: ADMIN_SECTIONS.map(({ id, group, adminOnly }) => ({ id, group, grantable: !adminOnly })),
            pagination: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) },
        });
    } catch (error) {
        console.error("[Roles] List error:", error);
        return res.status(500).json({ success: false, message: "Failed to retrieve roles." });
    }
};

// PATCH /api/dashboard/users/:userId/role
export const updateUserRole = async (req, res) => {
    try {
        const { userId } = req.params;
        const role = String(req.body?.role || "").toLowerCase();

        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ success: false, message: "Invalid user ID." });
        }
        if (!ROLES.includes(role)) {
            return res.status(400).json({ success: false, message: "Invalid role." });
        }
        if (String(userId) === String(req.user?.userId)) {
            return res.status(400).json({ success: false, message: "You cannot change your own role." });
        }

        const permissions = role === "member" ? cleanPermissions(req.body?.permissions) : {};
        if (role === "member" && !Object.keys(permissions).length) {
            return res.status(400).json({ success: false, message: "Give this member access to at least one section." });
        }

        const user = await User.findById(userId).select("firstName lastName email profileImage role adminPermissions accountStatus createdAt");
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found." });
        }
        if (role === "admin" && user.accountStatus === "suspended") {
            return res.status(400).json({ success: false, message: "Reactivate this account before making it an admin." });
        }
        if (user.role === "admin" && role !== "admin") {
            const admins = await User.countDocuments({ role: "admin" });
            if (admins <= 1) {
                return res.status(400).json({ success: false, message: "There must always be at least one admin." });
            }
        }

        user.role = role;
        user.adminPermissions = role === "member" ? new Map(Object.entries(permissions)) : undefined;
        await user.save();
        forgetAccountStatus(user._id);

        console.log(`[Roles] Admin ${req.user?.userId} set ${user._id} to ${role}`, role === "member" ? permissions : "");

        return res.status(200).json({ success: true, message: "Role updated.", user: view(user.toObject()) });
    } catch (error) {
        console.error("[Roles] Update error:", error);
        return res.status(500).json({ success: false, message: "Failed to update the role." });
    }
};

export { GRANTABLE_SECTIONS };
