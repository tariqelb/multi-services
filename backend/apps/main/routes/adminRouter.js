// backend/apps/main/routes/adminRouter.js
//
// /api/dashboard — account administration (shared by every service).
//   users  : admins, and members with the "users" section (read: see, write: suspend)
//   roles  : admins only

import { Router } from "express";

import authMiddleware from "../middleware/authMiddleware.js";
import adminMiddleware from "../middleware/adminMiddleware.js";
import adminAccess from "../middleware/adminAccessMiddleware.js";
import { getRoles, updateUserRole } from "../controllers/admin/adminRolesController.js";

import {
    getAdminUsers,
    getAdminUserDetails,
    updateAdminUserStatus,
} from "../controllers/admin/adminUsersController.js";

const router = Router();

router.get("/users", authMiddleware, adminAccess("users"), getAdminUsers);
router.get("/users/:userId", authMiddleware, adminAccess("users"), getAdminUserDetails);

// Suspend / reactivate a user.
router.patch("/users/:userId/status", authMiddleware, adminAccess("users"), updateAdminUserStatus);

// Roles: client, member (sections given by an admin), admin.
router.get("/roles", authMiddleware, adminMiddleware, getRoles);
router.patch("/users/:userId/role", authMiddleware, adminMiddleware, updateUserRole);

export default router;
