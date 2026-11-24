// backend/apps/main/middleware/adminAccessMiddleware.js
//
// adminAccess("section"): the route is for admins, and for members who were
// given this section. Reading (GET / HEAD) needs "read", every other method
// needs "write". Use after authMiddleware.
//
//   router.get("/visits", authMiddleware, adminAccess("visits"), getVisitAnalytics);
//
// Admin-only routes (setting roles) keep using adminMiddleware.

import User from "../models/User.js";
import { accessLevel } from "../services/adminAccess.js";

const READ_METHODS = ["GET", "HEAD", "OPTIONS"];

export default function adminAccess(section, { UserModel = User } = {}) {
    return async function adminAccessMiddleware(req, res, next) {
        try {
            if (!req.user?.userId) {
                return res.status(401).json({ success: false, message: "Authentication required." });
            }

            const user = await UserModel.findById(req.user.userId).select("role adminPermissions accountStatus").lean();
            if (!user) {
                return res.status(401).json({ success: false, message: "User account not found." });
            }
            if (user.accountStatus === "suspended") {
                return res.status(403).json({ success: false, message: "This account is suspended." });
            }

            const granted = accessLevel(user, section);
            const needed = READ_METHODS.includes(req.method) ? "read" : "write";

            if (!granted) {
                return res.status(403).json({ success: false, message: "You do not have access to this part of the admin panel." });
            }
            if (needed === "write" && granted !== "write") {
                return res.status(403).json({ success: false, message: "You can only view this part of the admin panel." });
            }

            req.admin = user;
            req.adminAccess = granted;
            return next();
        } catch (error) {
            console.error("Admin access error:", error);
            return res.status(500).json({ success: false, message: "Unable to verify admin permissions." });
        }
    };
}
