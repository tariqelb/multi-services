// backend/apps/main/services/whatsappService.js
//
// WhatsApp messages through the WhatsApp Business Cloud API (Meta).
// Messages sent first by a business must use a template approved by Meta,
// so alerts are sent with one template whose body has 4 variables:
//
//   {{1}} what was published ("New vehicle matching your alert")
//   {{2}} title            {{3}} city · price            {{4}} link
//
// .env (WhatsApp is off when the first three are missing):
//   WHATSAPP_TOKEN               permanent access token of the WhatsApp Business account
//   WHATSAPP_PHONE_NUMBER_ID     id of the sending phone number
//   WHATSAPP_ALERT_TEMPLATE      name of the approved template (e.g. listing_alert)
//   WHATSAPP_TEMPLATE_LANGUAGES  languages the template exists in, first = default (e.g. fr,ar,en)
//   WHATSAPP_API_VERSION         Graph API version (default v21.0)

import axios from "axios";

import { normalizePhoneNumber } from "../utils/whatsapp.js";

export const isWhatsAppConfigured = () =>
    Boolean(process.env.WHATSAPP_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID && process.env.WHATSAPP_ALERT_TEMPLATE);

/** Template language for the user's language (the first configured one when missing). */
export function templateLanguage(language) {
    const available = String(process.env.WHATSAPP_TEMPLATE_LANGUAGES || "fr")
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);
    const wanted = String(language || "").toLowerCase().split(/[-_]/)[0];
    return available.find((item) => item.toLowerCase().split(/[-_]/)[0] === wanted) || available[0] || "fr";
}

const clip = (value, max = 120) => String(value ?? "").replace(/\s+/g, " ").trim().slice(0, max) || "-";

/**
 * Send an alert message. Returns { sent, reason? } and never throws for a
 * configuration problem (alerts must not fail because WhatsApp is off).
 */
export async function sendWhatsAppAlert({ to, language, heading, title, details, url }, { httpPost = axios.post } = {}) {
    if (!isWhatsAppConfigured()) return { sent: false, reason: "WhatsApp is not configured" };

    const number = normalizePhoneNumber(to).replace(/^\+/, "");
    if (!/^\d{8,15}$/.test(number)) return { sent: false, reason: "Invalid WhatsApp number" };

    const version = process.env.WHATSAPP_API_VERSION || "v21.0";
    const endpoint = `https://graph.facebook.com/${version}/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`;

    await httpPost(
        endpoint,
        {
            messaging_product: "whatsapp",
            to: number,
            type: "template",
            template: {
                name: process.env.WHATSAPP_ALERT_TEMPLATE,
                language: { code: templateLanguage(language) },
                components: [
                    {
                        type: "body",
                        parameters: [heading, title, details, url].map((text) => ({ type: "text", text: clip(text, 200) })),
                    },
                ],
            },
        },
        {
            timeout: 10000,
            headers: { Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`, "Content-Type": "application/json" },
        },
    );
    return { sent: true };
}
