import jwt from "jsonwebtoken";

import { getAccountStatus } from "../services/accountStatus.js";

// Identifies the visitor when a valid token is present; never blocks.
// Suspended or deleted accounts are treated as anonymous visitors.
export default async function optionalAuthMiddleware(req, res, next) {
    req.user = null;

    try {
        const token = req.cookies?.token;

        if (token) {
            const decoded = jwt.verify(token, process.env.JWT_SECRET, {
                algorithms: ["HS256"],
            });

            if (decoded?.userId) {
                const account = await getAccountStatus(decoded.userId);

                if (account.exists && account.status !== "suspended") {
                    req.user = { userId: decoded.userId };
                }
            }
        }
    } catch {
        // Invalid or expired tokens are treated as anonymous visits.
    }

    next();
}
