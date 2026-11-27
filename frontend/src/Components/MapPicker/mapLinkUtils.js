// src/Components/MapPicker/mapLinkUtils.js
//
// Helpers for the "pick on map" button used next to every Google Maps link field.
// The link we build (https://www.google.com/maps?q=lat,lng) is read by the
// backend (apps/main/utils/googleMapsLocation.js) through its "q" parameter.

export const MOROCCO_CENTER = { lat: 31.7917, lng: -7.0926 };

export const GOOGLE_MAPS_API_KEY = String(import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "").trim();

const round = (value) => Math.round(Number(value) * 1e6) / 1e6;

export const isValidPoint = (point) =>
    Boolean(point) &&
    Number.isFinite(Number(point.lat)) &&
    Number.isFinite(Number(point.lng)) &&
    Math.abs(Number(point.lat)) <= 90 &&
    Math.abs(Number(point.lng)) <= 180;

export const buildGoogleMapsLink = (point) =>
    isValidPoint(point) ? `https://www.google.com/maps?q=${round(point.lat)},${round(point.lng)}` : "";

export const googleMapsSearchUrl = (query = "") => {
    const text = String(query || "").trim();
    return text
        ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(text)}`
        : "https://www.google.com/maps";
};

// Google's public embed page works without an API key.
export const buildEmbedUrl = ({ point, query, zoom = 15 } = {}) => {
    const q = isValidPoint(point) ? `${round(point.lat)},${round(point.lng)}` : String(query || "").trim();
    if (!q) return `https://maps.google.com/maps?q=${MOROCCO_CENTER.lat},${MOROCCO_CENTER.lng}&z=5&output=embed`;
    return `https://maps.google.com/maps?q=${encodeURIComponent(q)}&z=${zoom}&output=embed`;
};

// Same patterns as the backend parser, so a pasted link opens the picker on its pin.
export const parseCoordinates = (url = "") => {
    const text = String(url || "");
    if (!text) return null;
    const patterns = [
        /@(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)/,
        /!3d(-?\d+(?:\.\d+)?)!4d(-?\d+(?:\.\d+)?)/,
        /\/maps\/(?:search|place)\/(-?\d+(?:\.\d+)?),\s*\+?(-?\d+(?:\.\d+)?)/i,
    ];
    for (const pattern of patterns) {
        const match = text.match(pattern);
        if (match) {
            const point = { lat: Number(match[1]), lng: Number(match[2]) };
            if (isValidPoint(point)) return point;
        }
    }
    try {
        const parsed = new URL(text);
        for (const key of ["q", "query", "ll", "center"]) {
            const match = String(parsed.searchParams.get(key) || "").match(/(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)/);
            if (match) {
                const point = { lat: Number(match[1]), lng: Number(match[2]) };
                if (isValidPoint(point)) return point;
            }
        }
    } catch {
        // not a URL
    }
    return null;
};

export const isHttpUrl = (value = "") => /^https?:\/\//i.test(String(value || "").trim());

// Place search with OpenStreetMap Nominatim (free, no key). Called only when the
// user presses Search, as its usage policy asks (no search-as-you-type).
export async function searchPlaces(query, { language = "en", fetchImpl = globalThis.fetch, signal } = {}) {
    const text = String(query || "").trim();
    if (!text) return [];
    const params = new URLSearchParams({
        format: "jsonv2",
        q: text,
        limit: "6",
        countrycodes: "ma",
        "accept-language": language || "en",
    });
    const response = await fetchImpl(`https://nominatim.openstreetmap.org/search?${params}`, {
        headers: { Accept: "application/json" },
        signal,
    });
    if (!response.ok) throw new Error(`search failed (${response.status})`);
    const rows = await response.json();
    return (Array.isArray(rows) ? rows : [])
        .map((row) => ({
            id: String(row.place_id ?? `${row.lat},${row.lon}`),
            label: String(row.display_name || ""),
            point: { lat: Number(row.lat), lng: Number(row.lon) },
        }))
        .filter((row) => isValidPoint(row.point));
}

export const joinHint = (...parts) =>
    parts
        .map((part) => String(part ?? "").trim())
        .filter(Boolean)
        .join(", ");
