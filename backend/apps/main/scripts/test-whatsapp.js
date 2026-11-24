
import "dotenv/config";
import crypto from "node:crypto";

const BASE_URL =
    process.env.ENVOISMS_BASE_URL || "https://api.envoisms.ma/v1";

const API_KEY = process.env.ENVOISMS_API_KEY;

// Your WhatsApp number in international format.
const PHONE_NUMBER = "+212655261677";

const TEMPLATE_NAME =
    process.env.ENVOISMS_ROOMMATE_ALERT_TEMPLATE_EN || "roommate_alert";

async function testWhatsApp() {
    if (!API_KEY) {
        console.error("❌ ENVOISMS_API_KEY is missing from .env");
        return;
    }

    const payload = {
        to: PHONE_NUMBER,
        channel: "whatsapp",
        template: {
            name: TEMPLATE_NAME,
            language: "en",
        },
        metadata: {
            variables: [
                "WhatsApp API Test",
                "Marrakesh",
                "https://multi-services-frontend.vercel.app",
            ],
        },
    };

    const idempotencyKey = crypto
        .createHash("sha256")
        .update(`whatsapp-test-${Date.now()}`)
        .digest("hex");

    console.log("========== WHATSAPP API TEST ==========");
    console.log("Endpoint:", `${BASE_URL}/messages`);
    console.log("Recipient:", PHONE_NUMBER);
    console.log("Template:", TEMPLATE_NAME);
    console.log("Sending message...");

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
            console.error("❌ WhatsApp API request failed.");
            return;
        }

        console.log("✅ Request accepted by the API.");
        console.log("Check your WhatsApp for the message.");
    } catch (error) {
        console.error("❌ Request error:", error.message);
    }

    console.log("=======================================");
}

testWhatsApp();
