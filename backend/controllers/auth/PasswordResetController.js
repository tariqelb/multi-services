
import crypto from "node:crypto";
import bcrypt from "bcryptjs";

import User from "../../DatabaseModels/Schema/User.js";
import PasswordResetToken from "../../DatabaseModels/Schema/PasswordResetToken.js";

import {
    sendPasswordResetEmail,
} from "../../services/emailService.js";

const RESET_TOKEN_EXPIRY = 15 * 60 * 1000;

const normalizeLanguage = (language) =>
    ["en", "fr", "ar"].includes(language) ? language : "en";

/**
 * Request password reset.
 * Always returns a generic response to avoid revealing registered emails.
 */
export const forgotPassword = async (req, res) => {
    try {
        const email = req.body?.email?.trim().toLowerCase();

        if (!email) {
            return res.status(400).json({
                success: false,
                message: "Email is required.",
            });
        }

        const genericMessage =
            "If an account exists with this email, a password reset link will be sent.";

        const user = await User.findOne({ email });

        if (!user) {
            return res.status(200).json({
                success: true,
                message: genericMessage,
            });
        }

        // Remove previous reset tokens for this user.
        await PasswordResetToken.deleteMany({
            userId: user._id,
        });

        // Generate a cryptographically secure token.
        const resetToken = crypto.randomBytes(32).toString("hex");

        // Store only its SHA-256 hash.
        const tokenHash = crypto
            .createHash("sha256")
            .update(resetToken)
            .digest("hex");

        const expiresAt = new Date(
            Date.now() + RESET_TOKEN_EXPIRY
        );

        await PasswordResetToken.create({
            userId: user._id,
            tokenHash,
            expiresAt,
        });

        const frontendUrl = (
            process.env.FRONTEND_URL ||
            "https://multi-services-frontend.vercel.app"
        ).replace(/\/$/, "");

        const resetUrl =
            `${frontendUrl}/reset-password/${resetToken}`;

        try {
            await sendPasswordResetEmail({
                to: user.email,
                resetUrl,
                language: normalizeLanguage(user.language),
            });
        } catch (emailError) {
            // Invalidate the token if the email could not be sent.
            await PasswordResetToken.deleteOne({ tokenHash });

            throw emailError;
        }

        return res.status(200).json({
            success: true,
            message: genericMessage,
        });
    } catch (error) {
        console.error("[FORGOT PASSWORD] Error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to process your request. Please try again.",
        });
    }
};

/**
 * Reset password using the emailed token.
 */
export const resetPassword = async (req, res) => {
    try {
        const { token, password, confirmPassword } = req.body || {};

        if (!token || !password || !confirmPassword) {
            return res.status(400).json({
                success: false,
                message: "All fields are required.",
            });
        }

        if (!/^[a-f0-9]{64}$/i.test(token)) {
            return res.status(400).json({
                success: false,
                message: "This password reset link is invalid or expired.",
            });
        }

        if (password.length < 8) {
            return res.status(400).json({
                success: false,
                message: "Password must contain at least 8 characters.",
            });
        }

        if (password !== confirmPassword) {
            return res.status(400).json({
                success: false,
                message: "Passwords do not match.",
            });
        }

        const tokenHash = crypto
            .createHash("sha256")
            .update(token)
            .digest("hex");

        const resetRecord = await PasswordResetToken.findOne({
            tokenHash,
            expiresAt: { $gt: new Date() },
        });

        if (!resetRecord) {
            return res.status(400).json({
                success: false,
                message: "This password reset link is invalid or expired.",
            });
        }

        const hashedPassword = await bcrypt.hash(password, 12);

        const user = await User.findByIdAndUpdate(
            resetRecord.userId,
            {
                $set: {
                    password: hashedPassword,
                },
            },
            {
                returnDocument: "after",
                runValidators: true,
            }
        );

        // Consume the token after a successful password update.
        await PasswordResetToken.deleteOne({
            _id: resetRecord._id,
        });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "Account not found.",
            });
        }

        // Invalidate any other outstanding reset links.
        await PasswordResetToken.deleteMany({
            userId: user._id,
        });

        return res.status(200).json({
            success: true,
            message: "Your password has been reset successfully.",
        });
    } catch (error) {
        console.error("[RESET PASSWORD] Error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to reset your password. Please try again.",
        });
    }
};
