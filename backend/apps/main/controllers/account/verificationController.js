//backend/apps/main/controllers/account/verificationController.js
import crypto from "node:crypto";
import User from "../../models/User.js";
import { sendVerificationEmail } from "../../services/emailService.js";
import {
    sendVerificationSms,
    checkVerificationSms,
    resendVerificationSms,
} from "../../services/smsService.js";
import axios from "axios";
import {
    getUserWhatsApp,
    getWhatsAppPreferencesView,
    isValidInternationalPhone,
    normalizePhoneNumber,
} from "../../utils/whatsapp.js";
const ENVOISMS_BASE_URL =
    process.env.ENVOISMS_BASE_URL || "https://api.envoisms.ma/v1";


async function envoismsRequest(endpoint, data) {
    const apiKey = process.env.ENVOISMS_API_KEY;

    if (!apiKey) {
        throw new Error("ENVOISMS_API_KEY is missing from backend environment.");
    }

    const startedAt = Date.now();

    console.info("[EnvoiSMS] Request started", {
        endpoint,
        channel: data?.channel,
        hasRecipient: Boolean(data?.to),
    });

    try {
        const response = await axios.post(
            `${ENVOISMS_BASE_URL}${endpoint}`,
            data,
            {
                headers: {
                    Authorization: `Bearer ${apiKey}`,
                    "Content-Type": "application/json",
                    Accept: "application/json",
                },
                timeout: 20000,
            }
        );

        console.info("[EnvoiSMS] Request succeeded", {
            endpoint,
            status: response.status,
            durationMs: Date.now() - startedAt,
            sessionId: response.data?.session_id,
            expiresAt: response.data?.expires_at,
            resendAfterSeconds: response.data?.resend_after_seconds,
            sandbox: response.data?.sandbox,
            hasSandboxCode: Boolean(response.data?.sandbox_code),
        });

        return response.data;
    } catch (error) {
        console.error("[EnvoiSMS] Request failed", {
            endpoint,
            status: error.response?.status,
            durationMs: Date.now() - startedAt,
            providerResponse: error.response?.data,
            errorCode: error.code,
            message: error.message,
        });

        throw error;
    }
}


const EMAIL_CODE_TTL_MS = 10 * 60 * 1000;

function generateEmailCode() {
    return crypto.randomInt(100000, 1000000).toString();
}

function hashCode(code) {
    return crypto.createHash("sha256").update(code).digest("hex");
}

function validEmailCode(code) {
    return /^\d{6}$/.test(String(code ?? ""));
}

// ---------------- EMAIL VERIFICATION ----------------

export async function sendEmailVerificationCode(req, res) {
    try {
        const user = await User.findById(req.user.userId)
            .select("+emailVerificationCodeHash +emailVerificationExpires");

        if (!user) {
            return res.status(404).json({ message: "User not found." });
        }

        if (user.emailVerified) {
            return res.status(400).json({
                message: "Your email is already verified.",
            });
        }

        const code = generateEmailCode();

        user.emailVerificationCodeHash = hashCode(code);
        user.emailVerificationExpires = new Date(
            Date.now() + EMAIL_CODE_TTL_MS
        );

        await user.save();

        try {
            await sendVerificationEmail({
                to: user.email,
                code,
            });
        } catch (error) {
            user.emailVerificationCodeHash = undefined;
            user.emailVerificationExpires = undefined;
            await user.save();

            throw error;
        }

        return res.status(200).json({
            message: "Verification email sent.",
        });
    } catch (error) {
        console.error("Send email verification error:", error.message);

        return res.status(500).json({
            message: "Could not send the verification email.",
        });
    }
}

export async function confirmEmailVerificationCode(req, res) {
    try {
        const { code } = req.body;

        if (!validEmailCode(code)) {
            return res.status(400).json({
                message: "Enter the six-digit verification code.",
            });
        }

        const user = await User.findById(req.user.userId)
            .select("+emailVerificationCodeHash +emailVerificationExpires");

        if (!user) {
            return res.status(404).json({ message: "User not found." });
        }

        if (user.emailVerified) {
            return res.status(200).json({
                message: "Email already verified.",
                emailVerified: true,
            });
        }

        if (
            !user.emailVerificationCodeHash ||
            !user.emailVerificationExpires ||
            user.emailVerificationExpires.getTime() <= Date.now()
        ) {
            user.emailVerificationCodeHash = undefined;
            user.emailVerificationExpires = undefined;
            await user.save();

            return res.status(400).json({
                message: "The code expired. Request a new code.",
            });
        }

        const submittedHash = hashCode(String(code));

        const expected = Buffer.from(
            user.emailVerificationCodeHash,
            "hex"
        );
        const actual = Buffer.from(submittedHash, "hex");

        if (
            expected.length !== actual.length ||
            !crypto.timingSafeEqual(expected, actual)
        ) {
            return res.status(400).json({
                message: "The verification code is incorrect.",
            });
        }

        user.emailVerified = true;
        user.emailVerificationCodeHash = undefined;
        user.emailVerificationExpires = undefined;

        await user.save();

        return res.status(200).json({
            message: "Email verified successfully.",
            emailVerified: true,
        });
    } catch (error) {
        console.error("Confirm email verification error:", error.message);

        return res.status(500).json({
            message: "Could not verify the email.",
        });
    }
}

// ---------------- PHONE VERIFICATION ----------------

export async function sendPhoneVerificationCode(req, res) {
    try {
        const user = await User.findById(req.user.userId)
        .select(
            "+phoneVerificationSessionId +phoneVerificationExpires"
        );

        if (!user) {
            return res.status(404).json({ message: "User not found." });
        }

        if (!user.phoneNumber) {
            return res.status(400).json({
                message: "Add a phone number to your profile first.",
            });
        }

        if (user.phoneVerified) {
            return res.status(400).json({
                message: "Your phone number is already verified.",
            });
        }

        const result = await sendVerificationSms({
            to: user.phoneNumber,
        });

        user.phoneVerificationSessionId = result.sessionId;
        user.phoneVerificationExpires = result.expiresAt
            ? new Date(result.expiresAt)
            : undefined;

        await user.save();

        const response = {
            message: "Phone verification code requested.",
            expiresAt: result.expiresAt,
            resendAfterSeconds: result.resendAfterSeconds,
        };

        if (
            process.env.NODE_ENV !== "production" &&
            result.sandbox &&
            result.sandboxCode
        ) {
            response.sandboxCode = result.sandboxCode;
        }

        return res.status(200).json(response);
    } catch (error) {
        console.error("Send phone verification error:", error.message);

        return res.status(502).json({
            message: error.message || "Could not request a phone code.",
        });
    }
}

export async function confirmPhoneVerificationCode(req, res) {
    try {
        const { code } = req.body;

        if (!validEmailCode(code)) {
            return res.status(400).json({
                message: "Enter the six-digit verification code.",
            });
        }

        const user = await User.findById(req.user.userId)
            .select("+phoneVerificationSessionId");

        if (!user) {
            return res.status(404).json({ message: "User not found." });
        }

        if (user.phoneVerified) {
            return res.status(200).json({
                message: "Phone already verified.",
                phoneVerified: true,
            });
        }

        if (!user.phoneVerificationSessionId) {
            return res.status(400).json({
                message: "Request a new verification code first.",
            });
        }

        if (
            user.phoneVerificationExpires &&
            user.phoneVerificationExpires.getTime() <= Date.now()
        ) {
            user.phoneVerificationSessionId = undefined;
            user.phoneVerificationExpires = undefined;
            await user.save();

            return res.status(400).json({
                message: "The verification session expired. Request a new code.",
            });
        }

        const result = await checkVerificationSms({
            sessionId: user.phoneVerificationSessionId,
            code: String(code),
        });

        if (!result.verified) {
            return res.status(400).json({
                message: "The verification code is incorrect.",
            });
        }

        user.phoneVerified = true;

        // Same number on WhatsApp: verified too.
        if (
            user.whatsappNumber &&
            normalizePhoneNumber(user.whatsappNumber) ===
                normalizePhoneNumber(user.phoneNumber || "")
        ) {
            user.whatsappVerified = true;
        }
        user.phoneVerificationSessionId = undefined;
        user.phoneVerificationExpires = undefined;

        await user.save();

        return res.status(200).json({
            message: "Phone verified successfully.",
            phoneVerified: true,
        });
    } catch (error) {
        console.error("Confirm phone verification error:", error.message);

        return res.status(400).json({
            message: error.message || "Could not verify the phone.",
        });
    }
}

export async function resendPhoneVerificationCode(req, res) {
    try {
        const user = await User.findById(req.user.userId)
            .select("+phoneVerificationSessionId");

        if (!user) {
            return res.status(404).json({ message: "User not found." });
        }

        if (user.phoneVerified) {
            return res.status(400).json({
                message: "Your phone number is already verified.",
            });
        }

        if (!user.phoneVerificationSessionId) {
            return res.status(400).json({
                message: "Request a new verification code first.",
            });
        }

        const result = await resendVerificationSms({
            sessionId: user.phoneVerificationSessionId,
        });

        user.phoneVerificationSessionId = result.sessionId;
        user.phoneVerificationExpires = result.expiresAt
            ? new Date(result.expiresAt)
            : undefined;

        await user.save();

        const response = {
            message: "A new verification code was requested.",
            expiresAt: result.expiresAt,
            resendAfterSeconds: result.resendAfterSeconds,
        };

        if (
            process.env.NODE_ENV !== "production" &&
            result.sandbox &&
            result.sandboxCode
        ) {
            response.sandboxCode = result.sandboxCode;
        }

        return res.status(200).json(response);
    } catch (error) {
        console.error("Resend phone verification error:", error.message);

        return res.status(400).json({
            message: error.message || "Could not resend the phone code.",
        });
    }
}


// WhatsApp number: user.whatsappNumber / user.whatsappVerified.
// notificationPreferences.whatsapp holds the switches only.

export async function getMyWhatsAppPreferences(req, res) {
    try {
        const user = await User.findById(req.user?.userId);

        if (!user) {
            return res.status(404).json({ message: "User not found." });
        }

        return res.status(200).json({
            preferences: getWhatsAppPreferencesView(user),
            whatsappNumber: user.whatsappNumber || "",
            whatsappVerified: getUserWhatsApp(user).verified,
            phoneVerified: user.phoneVerified,
            accountPhoneNumber: user.phoneNumber,
        });
    } catch (error) {
        console.error("Get WhatsApp preferences error:", error);

        return res.status(500).json({ message: "Unable to load WhatsApp preferences." });
    }
}

// PUT /profile/me/verification/whatsapp   { enabled, propertyAlerts, vehicleAlerts? }
// The number itself is changed from the profile (PUT /profile/me).
export async function updateMyWhatsAppPreferences(req, res) {
    try {
        const { enabled, propertyAlerts, vehicleAlerts } = req.body || {};

        if (
            typeof enabled !== "boolean" ||
            typeof propertyAlerts !== "boolean" ||
            (vehicleAlerts !== undefined && typeof vehicleAlerts !== "boolean")
        ) {
            return res.status(400).json({ message: "Invalid WhatsApp notification preferences." });
        }

        const user = await User.findById(req.user?.userId);

        if (!user) {
            return res.status(404).json({ message: "User not found." });
        }

        const { number, verified } = getUserWhatsApp(user);

        if (enabled && (!number || !verified)) {
            return res.status(400).json({
                message: "Add and verify your WhatsApp number in your profile before enabling notifications.",
                code: "WHATSAPP_VERIFICATION_REQUIRED",
            });
        }

        user.notificationPreferences ??= {};
        user.notificationPreferences.whatsapp ??= {};
        user.notificationPreferences.whatsapp.enabled = enabled;
        user.notificationPreferences.whatsapp.propertyAlerts = enabled && propertyAlerts;
        // Older screens do not send vehicleAlerts: keep the saved value.
        const keepVehicle = user.notificationPreferences.whatsapp.vehicleAlerts === true;
        user.notificationPreferences.whatsapp.vehicleAlerts = enabled && (vehicleAlerts ?? keepVehicle);

        // Remember a "same as phone" verification.
        if (verified && !user.whatsappVerified) user.whatsappVerified = true;

        await user.save();

        return res.status(200).json({
            message: "WhatsApp preferences saved successfully.",
            preferences: getWhatsAppPreferencesView(user),
        });
    } catch (error) {
        console.error("Update WhatsApp preferences error:", error);

        return res.status(500).json({ message: "Unable to save WhatsApp preferences." });
    }
}

// ---------------- WHATSAPP VERIFICATION ----------------

// POST /profile/me/verification/whatsapp/send   { phoneNumber? }
// Without phoneNumber, the saved WhatsApp number is used.
export async function sendWhatsAppVerificationCode(req, res) {
    try {
        const user = await User.findById(req.user?.userId);

        if (!user) {
            return res.status(404).json({ message: "User not found." });
        }

        const requested = normalizePhoneNumber(req.body?.phoneNumber || user.whatsappNumber || "");

        if (!isValidInternationalPhone(requested)) {
            return res.status(400).json({
                message: "Add a valid WhatsApp number in international format (e.g. +2126...) first.",
            });
        }

        if (requested !== normalizePhoneNumber(user.whatsappNumber || "")) {
            user.whatsappNumber = requested;
            user.whatsappVerified = false;
            user.notificationPreferences.whatsapp.enabled = false;
            user.notificationPreferences.whatsapp.propertyAlerts = false;
            user.notificationPreferences.whatsapp.vehicleAlerts = false;
        }

        if (getUserWhatsApp(user).verified) {
            if (!user.whatsappVerified) {
                user.whatsappVerified = true;
                await user.save();
            }

            return res.status(400).json({ message: "This WhatsApp number is already verified." });
        }

        const result = await envoismsRequest("/verify/send", {
            to: requested,
            channel: "whatsapp",
            purpose: "otp",
        });

        if (!result?.session_id) {
            return res.status(502).json({ message: "Could not send the WhatsApp verification code." });
        }

        // Store the provider's session ID, never the OTP itself.
        user.whatsappVerificationSessionId = result.session_id;
        user.whatsappVerificationExpires = result.expires_at ? new Date(result.expires_at) : undefined;

        await user.save();

        const payload = {
            message: "WhatsApp verification code requested.",
            expiresAt: result.expires_at,
            resendAfterSeconds: result.resend_after_seconds,
        };

        if (result.sandbox && result.sandbox_code) {
            payload.sandboxCode = result.sandbox_code;
        }

        return res.status(200).json(payload);
    } catch (error) {
        console.error("Send WhatsApp verification error:", error.response?.data || error.message);

        return res.status(502).json({
            message: error.response?.data?.message || "Could not send the WhatsApp verification code.",
        });
    }
}

// POST /profile/me/verification/whatsapp/confirm   { code }
export async function confirmWhatsAppVerificationCode(req, res) {
    try {
        const { code } = req.body || {};

        if (!validEmailCode(code)) {
            return res.status(400).json({ message: "Enter the six-digit verification code." });
        }

        const user = await User.findById(req.user?.userId).select(
            "+whatsappVerificationSessionId +whatsappVerificationExpires"
        );

        if (!user) {
            return res.status(404).json({ message: "User not found." });
        }

        if (!user.whatsappVerificationSessionId) {
            return res.status(400).json({ message: "Request a new WhatsApp verification code first." });
        }

        if (user.whatsappVerificationExpires && user.whatsappVerificationExpires.getTime() <= Date.now()) {
            user.whatsappVerificationSessionId = undefined;
            user.whatsappVerificationExpires = undefined;
            await user.save();

            return res.status(400).json({ message: "The code expired. Request a new code." });
        }

        const result = await envoismsRequest("/verify/check", {
            session_id: user.whatsappVerificationSessionId,
            code: String(code),
        });

        if (!result?.verified) {
            return res.status(400).json({ message: "The verification code is incorrect." });
        }

        user.whatsappVerified = true;
        user.whatsappVerificationSessionId = undefined;
        user.whatsappVerificationExpires = undefined;

        await user.save();

        return res.status(200).json({
            message: "WhatsApp number verified successfully.",
            whatsappNumber: user.whatsappNumber,
            whatsappVerified: true,
            preferences: {
                whatsapp: getWhatsAppPreferencesView(user),
            },
        });
    } catch (error) {
        console.error("Confirm WhatsApp verification error:", error.response?.data || error.message);

        return res.status(400).json({
            message: error.response?.data?.message || "Could not verify the WhatsApp number.",
        });
    }
}
