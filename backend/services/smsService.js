
const BASE_URL =
    process.env.ENVOISMS_BASE_URL || "https://api.envoisms.ma/v1";

async function envoiSmsRequest(endpoint, body) {
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
        },
        body: JSON.stringify(body),
    });

    const data = await response.json().catch(() => ({}));

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
 * Request a verification code.
 * EnvoiSMS generates and manages the OTP.
 */
export async function sendVerificationSms({ to }) {
    if (!to || typeof to !== "string") {
        throw new Error("A phone number is required.");
    }

    const phoneNumber = to.trim();

    if (!/^\+[1-9]\d{7,14}$/.test(phoneNumber)) {
        throw new Error(
            "Use international phone format, for example +212612345678."
        );
    }

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
