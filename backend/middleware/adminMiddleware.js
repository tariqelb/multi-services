import User from "../DatabaseModels/Schema/User.js";

export default async function adminMiddleware(req, res, next) {
    try {
        if (!req.user?.userId) {
            return res.status(401).json({
                success: false,
                message: "Authentication required.",
            });
        }

        const user = await User.findById(req.user.userId)
            .select("role");

        if (!user) {
            return res.status(401).json({
                success: false,
                message: "User account not found.",
            });
        }

        if (user.role !== "admin") {
            return res.status(403).json({
                success: false,
                message: "Administrator access required.",
            });
        }

        req.admin = user;

        next();
    } catch (error) {
        console.error("Admin authorization error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to verify administrator permissions.",
        });
    }
}