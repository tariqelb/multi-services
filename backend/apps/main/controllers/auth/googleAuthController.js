// backend/apps/main/controllers/auth/googleAuthController.js
//
// POST /api/auth/google   { credential, language? }
//
// "Sign in with Google": the frontend sends the ID token from the Google
// button. Same session cookie as the email/password login.
//   - known Google account          -> logged in
//   - same email, no Google link    -> account linked (Google verified the email)
//   - new email                     -> account created (email verified)

import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";

import User from "../../models/User.js";
import { authCookieOptions } from "../../middleware/authMiddleware.js";
import { generateToken } from "../../utils/generateToken.js";
import {
    GoogleTokenError,
    isGoogleLoginConfigured,
    verifyGoogleIdToken,
} from "../../services/googleAuth.js";

const LANGUAGES = ["en", "fr", "ar"];
const SESSION_MAX_AGE = 48 * 60 * 60 * 1000;

const pickLanguage = (...values) => {
    for (const value of values) {
        const language = String(value || "").slice(0, 2).toLowerCase();
        if (LANGUAGES.includes(language)) return language;
    }

    return "en";
};

// Required names: fall back to the email when Google has none.
const namesFrom = (profile) => {
    const emailName = profile.email.split("@")[0].replace(/[._-]+/g, " ").trim();

    return {
        firstName: (profile.firstName || emailName || "User").slice(0, 60),
        lastName: (profile.lastName || "-").slice(0, 60),
    };
};

export const googleLogin = async (req, res, { verifyToken = verifyGoogleIdToken, UserModel = User } = {}) => {
    try {
        if (!isGoogleLoginConfigured()) {
            return res.status(503).json({
                success: false,
                code: "GOOGLE_NOT_CONFIGURED",
                message: "Google sign-in is not available yet.",
            });
        }

        if (!process.env.JWT_SECRET) {
            console.error("[GOOGLE LOGIN] JWT_SECRET is not configured.");

            return res.status(500).json({
                success: false,
                code: "SERVER_CONFIGURATION_ERROR",
                message: "Login is temporarily unavailable.",
            });
        }

        const { credential, language } = req.body || {};

        if (!credential) {
            return res.status(400).json({
                success: false,
                code: "MISSING_CREDENTIAL",
                message: "Google sign-in failed. Please try again.",
            });
        }

        const profile = await verifyToken(credential);

        let user = await UserModel.findOne({ googleId: profile.googleId }).select("+googleId");
        let isNewUser = false;

        if (!user) {
            user = await UserModel.findOne({ email: profile.email }).select("+googleId");

            if (user) {
                // Same email: link the Google account.
                if (user.googleId && user.googleId !== profile.googleId) {
                    return res.status(409).json({
                        success: false,
                        code: "GOOGLE_ACCOUNT_MISMATCH",
                        message: "This email is already linked to another Google account.",
                    });
                }

                user.googleId = profile.googleId;
                user.emailVerified = true;
            } else {
                // New account. Random password nobody knows; the user can
                // set one later in the settings or with "Forgot password".
                const password = await bcrypt.hash(randomBytes(32).toString("hex"), 12);

                user = new UserModel({
                    ...namesFrom(profile),
                    email: profile.email,
                    password,
                    passwordSet: false,
                    googleId: profile.googleId,
                    emailVerified: true,
                    language: pickLanguage(language, profile.locale),
                    profileImage: profile.picture || "",
                });

                isNewUser = true;
            }
        }

        // Suspended by an administrator: no login.
        if (user.accountStatus === "suspended") {
            return res.status(403).json({
                success: false,
                code: "ACCOUNT_SUSPENDED",
                message: "Your account has been suspended. Contact us if you think this is a mistake.",
                reason: user.suspendedReason || "",
            });
        }

        // Signing in cancels a scheduled account deletion (same as login).
        if (user.scheduledDeletionAt) {
            user.deletionRequestedAt = null;
            user.scheduledDeletionAt = null;
        }

        await user.save();

        const token = generateToken(user);

        res.cookie("token", token, {
            ...authCookieOptions,
            maxAge: SESSION_MAX_AGE,
        });

        return res.status(isNewUser ? 201 : 200).json({
            success: true,
            code: "LOGIN_SUCCESS",
            message: "Login successful.",
            isNewUser,
            user: {
                id: user._id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                createdAt: user.createdAt,
            },
            token,
        });
    } catch (error) {
        if (error instanceof GoogleTokenError) {
            return res.status(401).json({
                success: false,
                code: "INVALID_GOOGLE_TOKEN",
                message: error.message,
            });
        }

        // Two requests creating the same account at once.
        if (error?.code === 11000) {
            return res.status(409).json({
                success: false,
                code: "ACCOUNT_EXISTS",
                message: "An account with this email already exists. Please try again.",
            });
        }

        console.error("[GOOGLE LOGIN] Error:", error);

        return res.status(500).json({
            success: false,
            code: "INTERNAL_SERVER_ERROR",
            message: "Google sign-in failed. Please try again.",
        });
    }
};

// GET /api/auth/google/config — lets the frontend hide the button when
// the backend has no client ID.
export const googleConfig = (req, res) => {
    res.json({ enabled: isGoogleLoginConfigured() });
};
