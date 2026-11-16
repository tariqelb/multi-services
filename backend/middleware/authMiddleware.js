import jwt from "jsonwebtoken";

const authMiddleware = (req, res, next) => {
    const token = req.cookies?.token;

    console.log("\n========== AUTH MIDDLEWARE ==========");
    console.log("[Auth] Token exists:", Boolean(token));

    if (!token) {
        console.log("[Auth] No token found.");
        console.log("=====================================\n");

        return res.status(401).json({
            message: "Authentication required",
            code: "NO_TOKEN",
        });
    }

    if (!process.env.JWT_SECRET) {
        console.error("[Auth] JWT_SECRET is not configured.");

        return res.status(500).json({
            message: "Authentication configuration error",
        });
    }

    try {
        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET,
            { algorithms: ["HS256"] }
        );

        if (!decoded.userId) {
            console.log("[Auth] Token has no userId.");

            return res.status(401).json({
                message: "Invalid authentication token",
                code: "INVALID_TOKEN",
            });
        }

        req.user = {
            userId: decoded.userId,
        };

        console.log("[Auth] Authentication successful.");
        console.log("[Auth] User ID:", decoded.userId);
        console.log("=====================================\n");

        return next();

    } catch (error) {
        console.error("[Auth] Token verification failed:", error.message);
        console.log("=====================================\n");

        if (error.name === "TokenExpiredError") {
            return res.status(401).json({
                message: "Your session has expired. Please log in again.",
                code: "TOKEN_EXPIRED",
            });
        }

        return res.status(401).json({
            message: "Invalid authentication token. Please log in again.",
            code: "INVALID_TOKEN",
        });
    }
};

export default authMiddleware;