import jwt from "jsonwebtoken";

export default function optionalAuthMiddleware(req, res, next) {
    req.user = null;

    try {
        const token = req.cookies?.token;

        if (token) {
            const decoded = jwt.verify(
                token,
                process.env.JWT_SECRET
            );

            req.user = {
                userId: decoded.userId,
            };
        }
    } catch {
        // Invalid or expired tokens are treated as anonymous visits.
    }

    next();
}