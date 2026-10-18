
import jwt from "jsonwebtoken";

const authMiddleware = (req, res, next) => {
    const token = req.cookies?.token;

    console.log("\n========== AUTH MIDDLEWARE DEBUG ==========");

    // Check whether the token exists.
    console.log("[Auth] Token exists:", Boolean(token));

    if (!token) {
        console.log("[Auth] No token found in cookies.");
        console.log("============================================\n");

        return res.status(401).json({
            message: "Authentication required",
        });
    }

    try {
        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET,
            { algorithms: ["HS256"] }
        );

        console.log("[Auth] Token is valid: true");
        console.log("[Auth] Token payload:", decoded);
        console.log("[Auth] Decoded userId:", decoded.userId);
        console.log(
            "[Auth] userId exists:",
            Boolean(decoded.userId)
        );

        req.user = {
            userId: decoded.userId,
        };

        console.log("[Auth] req.user:", req.user);
        console.log("[Auth] Authentication successful.");
        console.log("============================================\n");

        next();
    } catch (error) {
        console.error("[Auth] Token verification failed:", error.message);
        console.log("============================================\n");

        return res.status(401).json({
            message: "Invalid or expired token",
        });
    }
};

export default authMiddleware;