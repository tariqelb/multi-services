import jwt from "jsonwebtoken";

import { getAccountStatus } from "../services/accountStatus.js";

// Same options as the login cookie, so the browser really removes it.
export const authCookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    path: "/",
};

// Set AUTH_DEBUG=true in .env to log every authentication.
const debug = (...args) => {
    if (process.env.AUTH_DEBUG === "true") console.log("[Auth]", ...args);
};

const authMiddleware = async (req, res, next) => {
    const token = req.cookies?.token;

    if (!token) {
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

    let decoded;

    try {
        decoded = jwt.verify(token, process.env.JWT_SECRET, {
            algorithms: ["HS256"],
        });
    } catch (error) {
        debug("Token verification failed:", error.message);

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

    if (!decoded?.userId) {
        return res.status(401).json({
            message: "Invalid authentication token",
            code: "INVALID_TOKEN",
        });
    }

    try {
        // Deleted or suspended accounts lose access immediately
        // (status is cached for 30 seconds).
        const account = await getAccountStatus(decoded.userId);

        if (!account.exists) {
            res.clearCookie("token", authCookieOptions);

            return res.status(401).json({
                message: "Your account no longer exists.",
                code: "ACCOUNT_NOT_FOUND",
            });
        }

        if (account.status === "suspended") {
            res.clearCookie("token", authCookieOptions);

            return res.status(403).json({
                message: "Your account has been suspended.",
                code: "ACCOUNT_SUSPENDED",
                reason: account.reason,
            });
        }
    } catch (error) {
        console.error("[Auth] Account status check failed:", error.message);

        return res.status(500).json({
            message: "Unable to verify your account. Please try again.",
        });
    }

    req.user = {
        userId: decoded.userId,
    };

    debug("Authenticated user", decoded.userId);

    return next();
};

export default authMiddleware;
