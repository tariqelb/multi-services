
import { createHash } from "node:crypto";

const BASE_URL = (
    process.env.ENVOISMS_BASE_URL ||
    "https://api.envoisms.ma/v1"
).replace(/\/$/, "");

/**
 * Common EnvoiSMS API request.
 */
async function envoiSmsRequest(endpoint, body, extraHeaders = {}) {
    const apiKey = process.env.ENVOISMS_API_KEY;

    if (!apiKey) {
        throw new Error("ENVOISMS_API_KEY is missing from .env");
    }

    const response = await fetch(`${BASE_URL}${endpoint}`, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
            Accept: "application/json",
            ...extraHeaders,
        },
        body: JSON.stringify(body),
    });

    const responseText = await response.text();

    let data = {};

    try {
        data = responseText ? JSON.parse(responseText) : {};
    } catch {
        data = { rawResponse: responseText };
    }

    if (!response.ok) {
        const apiError = data.error;

        console.error("EnvoiSMS request failed:", {
            status: response.status,
            code: apiError?.code,
            message: apiError?.message || data.message,
        });

        throw new Error(
            apiError?.message ||
            data.message ||
            `EnvoiSMS request failed (${response.status})`
        );
    }

    return data;
}

/**
 * Normalize and validate an international phone number.
 */
function normalizePhoneNumber(phone) {
    let number = String(phone || "").replace(/[\s().-]/g, "");

    if (number.startsWith("00212")) {
        number = `+${number.slice(2)}`;
    }

    if (/^0[5-7]\d{8}$/.test(number)) {
        number = `+212${number.slice(1)}`;
    }

    if (/^\+2120[5-7]\d{8}$/.test(number)) {
        number = `+212${number.slice(4)}`;
    }

    if (!/^\+[1-9]\d{7,14}$/.test(number)) {
        throw new Error(
            `Invalid phone number: ${phone}. Use international format.`
        );
    }

    return number;
}

/**
 * Normalize supported profile languages.
 */
function normalizeLanguage(language) {
    const normalized = String(language || "en")
        .toLowerCase()
        .split("-")[0]
        .split("_")[0];

    return ["en", "fr", "ar"].includes(normalized)
        ? normalized
        : "en";
}

/**
 * Build a roommate alert SMS in the recipient's language.
 */
function buildRoommateAlertMessage({
    roommateListing,
    language,
}) {
    const title =
        roommateListing.title || "New roommate listing";

    const city = roommateListing.city || "";

    const frontendUrl = (
        process.env.FRONTEND_URL ||
        "https://multi-services-frontend.vercel.app"
    ).replace(/\/$/, "");

    const listingUrl =
        `${frontendUrl}/roommates/${roommateListing._id}`;

    const messages = {
        en: [
            "MultiServices - New roommate listing matching your alert!",
            `Title: ${title}`,
            `City: ${city}`,
            `View listing: ${listingUrl}`,
        ].join("\n"),

        fr: [
            "MultiServices - Nouvelle annonce de colocation correspondant à votre alerte !",
            `Titre : ${title}`,
            `Ville : ${city}`,
            `Voir l'annonce : ${listingUrl}`,
        ].join("\n"),

        ar: [
            "MultiServices - إعلان سكن مشترك جديد يطابق تنبيهك!",
            `العنوان: ${title}`,
            `المدينة: ${city}`,
            `شاهد الإعلان: ${listingUrl}`,
        ].join("\n"),
    };

    return messages[language];
}

/**
 * Send a roommate listing alert using a normal SMS.
 */
export async function sendRoommateAlertSMS({
    to,
    roommateListing,
    language = "en",
}) {
    if (!roommateListing?._id) {
        throw new Error("A valid roommate listing is required.");
    }

    const recipient = normalizePhoneNumber(to);
    const recipientLanguage = normalizeLanguage(language);

    const message = buildRoommateAlertMessage({
        roommateListing,
        language: recipientLanguage,
    });

    const idempotencyKey = createHash("sha256")
        .update(
            `roommate-sms:${roommateListing._id}:${recipient}:${recipientLanguage}`
        )
        .digest("hex");

    console.log("[Roommate SMS] Sending alert:", {
        to: recipient,
        listingId: String(roommateListing._id),
        language: recipientLanguage,
    });

    const result = await envoiSmsRequest(
        "/messages",
        {
            to: recipient,
            message,
        },
        {
            "Idempotency-Key": idempotencyKey,
        }
    );

    console.log("[Roommate SMS] EnvoiSMS response:", result);

    return {
        sent: true,
        messageId: result.id || result.message_id,
        status: result.status || "queued",
        language: recipientLanguage,
        channel: "sms",
    };
}

/**
 * Request a verification code.
 * EnvoiSMS generates and manages the OTP.
 */
export async function sendVerificationSms({ to }) {
    if (!to || typeof to !== "string") {
        throw new Error("A phone number is required.");
    }

    const phoneNumber = normalizePhoneNumber(to);

    const result = await envoiSmsRequest("/verify/send", {
        to: phoneNumber,
        brand: "MultiServices",
        channel: "sms",
        code_length: 6,
        expiry: 600,
    });

    if (!result.session_id) {
        throw new Error(
            "EnvoiSMS did not return a verification session ID."
        );
    }

    // Never return the sandbox code to the frontend in production.
    return {
        sessionId: result.session_id,
        expiresAt: result.expires_at,
        resendAfterSeconds: result.resend_after_seconds ?? 30,
        sandbox: result.sandbox === true,
        sandboxCode:
            result.sandbox === true
                ? result.sandbox_code
                : undefined,
    };
}

/**
 * Verify the code entered by the user.
 */
export async function checkVerificationSms({
    sessionId,
    code,
}) {
    if (!sessionId || typeof sessionId !== "string") {
        throw new Error("A verification session ID is required.");
    }

    if (!/^\d{6}$/.test(String(code ?? ""))) {
        throw new Error("Enter the six-digit verification code.");
    }

    const result = await envoiSmsRequest("/verify/check", {
        session_id: sessionId,
        code: String(code),
    });

    return {
        verified: result.verified === true,
        verifiedAt: result.verified_at,
    };
}

/**
 * Resend a code for an existing verification session.
 */
export async function resendVerificationSms({ sessionId }) {
    if (!sessionId || typeof sessionId !== "string") {
        throw new Error("A verification session ID is required.");
    }

    const result = await envoiSmsRequest("/verify/resend", {
        session_id: sessionId,
        channel: "sms",
    });

    return {
        sessionId: result.session_id,
        expiresAt: result.expires_at,
        resendAfterSeconds: result.resend_after_seconds ?? 30,
        sandbox: result.sandbox === true,
        sandboxCode:
            result.sandbox === true
                ? result.sandbox_code
                : undefined,
    };
}
