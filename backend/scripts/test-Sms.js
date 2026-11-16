
import "dotenv/config";
import crypto from "node:crypto";

const BASE_URL =
    process.env.ENVOISMS_BASE_URL || "https://api.envoisms.ma/v1";

const API_KEY = process.env.ENVOISMS_API_KEY;

// Recipient number in international format.
const PHONE_NUMBER = "+212655261677";

const FRONTEND_URL =
    process.env.FRONTEND_URL ||
    "https://multi-services-frontend.vercel.app";

async function testSMS() {
    if (!API_KEY) {
        console.error("❌ ENVOISMS_API_KEY is missing from .env");
        return;
    }

    const message = [
        "Multi-Services SMS API Test",
        "",
        "Your SMS integration is working!",
        "",
        "Location: Marrakesh",
        `Website: ${FRONTEND_URL}`,
    ].join("\n");

    const payload = {
        to: PHONE_NUMBER,
        message,
    };

    const idempotencyKey = crypto
        .createHash("sha256")
        .update(`sms-test-${Date.now()}`)
        .digest("hex");

    console.log("========== SMS API TEST ==========");
    console.log("Endpoint:", `${BASE_URL}/messages`);
    console.log("Recipient:", PHONE_NUMBER);
    console.log("Channel: SMS");
    console.log("Message:", message);
    console.log("Sending SMS...");

    try {
        const response = await fetch(`${BASE_URL}/messages`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${API_KEY}`,
                "Content-Type": "application/json",
                "Idempotency-Key": idempotencyKey,
            },
            body: JSON.stringify(payload),
        });

        const responseText = await response.text();

        let result;
        try {
            result = JSON.parse(responseText);
        } catch {
            result = responseText;
        }

        console.log("HTTP Status:", response.status);
        console.log("Response:", result);

        if (!response.ok) {
            console.error("❌ SMS API request failed.");
            return;
        }

        console.log("✅ SMS request accepted by the API.");
        console.log("Check your phone for the SMS.");
    } catch (error) {
        console.error("❌ Request error:", error.message);
    }

    console.log("==================================");
}

testSMS();
