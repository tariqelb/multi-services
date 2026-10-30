//app/backend/controllers/profile/verificationController.js
import crypto from "node:crypto";
import User from "../../DatabaseModels/Schema/User.js";
import { sendVerificationEmail } from "../../services/emailService.js";
import {
    sendVerificationSms,
    checkVerificationSms,
    resendVerificationSms,
} from "../../services/smsService.js";
import axios from "axios";
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


const normalizePhoneNumber = (value = "") =>
    value.replace(/[\s().-]/g, "");

const getWhatsAppPreferences = (user) => {
    const preferences = user.notificationPreferences?.whatsapp;

    const accountPhone = normalizePhoneNumber(user.phoneNumber || "");
    const whatsappPhone = normalizePhoneNumber(
        preferences?.phoneNumber || ""
    );

    // Reuse account verification only when the numbers match.
    const isSameVerifiedNumber =
        Boolean(accountPhone) &&
        accountPhone === whatsappPhone &&
        user.phoneVerified === true;

    return {
        enabled: preferences?.enabled ?? false,
        propertyAlerts: preferences?.propertyAlerts ?? false,
        phoneNumber: preferences?.phoneNumber ?? "",
        verified: isSameVerifiedNumber
            ? true
            : preferences?.verified ?? false,
    };
};

export async function getMyWhatsAppPreferences(req, res) {
    try {
        const userId = req.user?.userId;

        if (!userId) {
            return res.status(401).json({
                message: "Authentication required.",
            });
        }

        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({
                message: "User not found.",
            });
        }

        return res.status(200).json({
            preferences: getWhatsAppPreferences(user),
            phoneVerified: user.phoneVerified,
            accountPhoneNumber: user.phoneNumber,
        });
    } catch (error) {
        console.error("Get WhatsApp preferences error:", error);

        return res.status(500).json({
            message: "Unable to load WhatsApp preferences.",
        });
    }
}

export async function updateMyWhatsAppPreferences(req, res) {
    try {
        const userId = req.user?.userId;
        console.log("update whatsapppreferences called")
        if (!userId) {
            return res.status(401).json({
                message: "Authentication required.",
            });
        }

        const {
            enabled,
            propertyAlerts,
            phoneNumber,
        } = req.body;

        if (
            typeof enabled !== "boolean" ||
            typeof propertyAlerts !== "boolean" ||
            typeof phoneNumber !== "string"
        ) {
            return res.status(400).json({
                message: "Invalid WhatsApp notification preferences.",
            });
        }

        const normalizedPhone = normalizePhoneNumber(
            phoneNumber.trim()
        );

        if (
            normalizedPhone &&
            !/^\+[1-9]\d{6,14}$/.test(normalizedPhone)
        ) {
            return res.status(400).json({
                message: "Enter a valid international phone number.",
            });
        }

        if (enabled && !normalizedPhone) {
            return res.status(400).json({
                message: "Enter a WhatsApp phone number to enable notifications.",
            });
        }

        if (enabled && !propertyAlerts) {
            // Enabling the channel without alerts is allowed.
            // No additional action is required.
        }

        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({
                message: "User not found.",
            });
        }

        const currentWhatsApp =
            user.notificationPreferences?.whatsapp;

        const previousPhone = normalizePhoneNumber(
            currentWhatsApp?.phoneNumber || ""
        );

        const phoneChanged = previousPhone !== normalizedPhone;

        const accountPhone = normalizePhoneNumber(
            user.phoneNumber || ""
        );

        const matchesVerifiedAccount =
            Boolean(normalizedPhone) &&
            normalizedPhone === accountPhone &&
            user.phoneVerified === true;

        // Do not enable messages to an unverified WhatsApp number.
       if (enabled && currentWhatsApp?.verified !== true) {
            return res.status(400).json({
                message: "Verify your WhatsApp number before enabling notifications.",
                code: "WHATSAPP_VERIFICATION_REQUIRED",
            });
        }

        user.notificationPreferences.whatsapp.enabled = enabled;
        user.notificationPreferences.whatsapp.propertyAlerts =
            propertyAlerts;
        user.notificationPreferences.whatsapp.phoneNumber =
            normalizedPhone;

        if (phoneChanged) {
            user.notificationPreferences.whatsapp.verified =
                matchesVerifiedAccount;
        } else if (matchesVerifiedAccount) {
            user.notificationPreferences.whatsapp.verified = true;
        }

        await user.save();

        return res.status(200).json({
            message: "WhatsApp preferences saved successfully.",
            preferences: getWhatsAppPreferences(user),
        });
    } catch (error) {
        console.error("Update WhatsApp preferences error:", error);

        return res.status(500).json({
            message: "Unable to save WhatsApp preferences.",
        });
    }
}

// ---------------- WHATSAPP VERIFICATION ----------------

export async function sendWhatsAppVerificationCode(req, res) {
    try {
        console.log("send whatsapp verification code called")
        const userId = req.user?.userId;
        const phoneNumber = normalizePhoneNumber(
            String(req.body.phoneNumber || "").trim()
        );

        if (!/^\+[1-9]\d{6,14}$/.test(phoneNumber)) {
            return res.status(400).json({
                message: "Enter a valid international phone number.",
            });
        }

        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({
                message: "User not found.",
            });
        }

        user.notificationPreferences ??= {};
        user.notificationPreferences.whatsapp ??= {};

        const whatsapp = user.notificationPreferences.whatsapp;
        const currentNumber = normalizePhoneNumber(
            whatsapp.phoneNumber || ""
        );

        if (currentNumber !== phoneNumber) {
            whatsapp.phoneNumber = phoneNumber;
            whatsapp.verified = false;
            whatsapp.enabled = false;
            whatsapp.propertyAlerts = false;
        }

        if (
            normalizePhoneNumber(whatsapp.phoneNumber || "") === phoneNumber &&
            whatsapp.verified === true
        ) {
            return res.status(400).json({
                message: "This WhatsApp number is already verified.",
            });
        }

        const result = await envoismsRequest("/verify/send", {
            to: phoneNumber,
            channel: "whatsapp",
            purpose: "otp",
        });

        // Store the provider's session ID, never the OTP itself.
        whatsapp.verificationSessionId = result.session_id;
        whatsapp.verificationExpires = result.expires_at
            ? new Date(result.expires_at)
            : undefined;

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
        console.error(
            "Send WhatsApp verification error:",
            error.response?.data || error.message
        );

        return res.status(502).json({
            message:
                error.response?.data?.message ||
                "Could not send the WhatsApp verification code.",
        });
    }
}

export async function confirmWhatsAppVerificationCode(req, res) {
    try {
        const { code } = req.body;

        if (!validEmailCode(code)) {
            return res.status(400).json({
                message: "Enter the six-digit verification code.",
            });
        }

        const user = await User.findById(req.user?.userId).select(
            "+notificationPreferences.whatsapp.verificationSessionId " +
            "+notificationPreferences.whatsapp.verificationExpires"
        );

        if (!user) {
            return res.status(404).json({
                message: "User not found.",
            });
        }

        const whatsapp = user.notificationPreferences?.whatsapp;

        if (!whatsapp?.verificationSessionId) {
            return res.status(400).json({
                message: "Request a new WhatsApp verification code first.",
            });
        }

        if (
            whatsapp.verificationExpires &&
            whatsapp.verificationExpires.getTime() <= Date.now()
        ) {
            whatsapp.verificationSessionId = undefined;
            whatsapp.verificationExpires = undefined;
            await user.save();

            return res.status(400).json({
                message: "The code expired. Request a new code.",
            });
        }

        const result = await envoismsRequest("/verify/check", {
            session_id: whatsapp.verificationSessionId,
            code: String(code),
        });

        if (!result.verified) {
            return res.status(400).json({
                message: "The verification code is incorrect.",
            });
        }

        whatsapp.verified = true;
        whatsapp.enabled = false;
        whatsapp.verificationSessionId = undefined;
        whatsapp.verificationExpires = undefined;

        await user.save();

        return res.status(200).json({
            message: "WhatsApp number verified successfully.",
            preferences: {
                whatsapp: getWhatsAppPreferences(user),
            },
        });
    } catch (error) {
        console.error(
            "Confirm WhatsApp verification error:",
            error.response?.data || error.message
        );

        return res.status(400).json({
            message:
                error.response?.data?.message ||
                "Could not verify the WhatsApp number.",
        });
    }
}