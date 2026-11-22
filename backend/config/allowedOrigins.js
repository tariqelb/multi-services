// config/allowedOrigins.js
//
// Websites allowed to call the API with the login cookie (CORS) and to open
// the live connection (socket.io).
//
// Set in .env (comma separated):
//   FRONTEND_URLS=https://your-site.vercel.app,https://www.your-domain.ma
// FRONTEND_URL (single address) is also read. Local Vite addresses are
// allowed outside production.

const DEV_ORIGINS = [
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:4173",
    "http://127.0.0.1:5173",
];

const normalize = (origin) => String(origin || "").trim().replace(/\/+$/, "");

export function getAllowedOrigins() {
    const configured = [process.env.FRONTEND_URLS, process.env.FRONTEND_URL]
        .filter(Boolean)
        .join(",")
        .split(",")
        .map(normalize)
        .filter(Boolean);

    return [
        ...new Set([
            ...configured,
            ...(process.env.NODE_ENV !== "production" ? DEV_ORIGINS : []),
        ]),
    ];
}

export function isOriginAllowed(origin, allowed = getAllowedOrigins()) {
    // Requests without Origin: same site, server to server, curl, mobile apps.
    if (!origin) return true;

    return allowed.includes(normalize(origin));
}
