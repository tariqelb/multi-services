// src/api/axiosInstance.js

import axios from "axios";

const axiosInstance = axios.create({
    baseURL: import.meta.env.VITE_API_URL || "/api",
    withCredentials: true,
});

// -----------------------------------------------------------------------------
// Anonymous visitor ID
// -----------------------------------------------------------------------------
// Same localStorage key as VisitTracker, so visits, property clicks and
// external clicks are all attributed to the same device.
// The logged-in user is NOT sent from here: the backend reads it securely
// from the auth cookie (req.user). A user ID header could be spoofed.

export const VISITOR_ID_KEY = "marketplace_visitor_id";

const createVisitorId = () => {
    if (typeof crypto !== "undefined" && crypto.randomUUID) {
        return crypto.randomUUID();
    }

    // Fallback for older browsers / non-HTTPS contexts.
    return `${Date.now().toString(36)}-${Math.random()
        .toString(36)
        .slice(2, 12)}-${Math.random().toString(36).slice(2, 12)}`;
};

let memoryVisitorId = null;

export function getVisitorId() {
    try {
        let visitorId = localStorage.getItem(VISITOR_ID_KEY);

        if (!visitorId) {
            visitorId = createVisitorId();
            localStorage.setItem(VISITOR_ID_KEY, visitorId);
        }

        return visitorId;
    } catch {
        // localStorage blocked (private mode, strict privacy settings).
        memoryVisitorId = memoryVisitorId || createVisitorId();
        return memoryVisitorId;
    }
}

// Attach the visitor ID to every API request.
axiosInstance.interceptors.request.use((config) => {
    config.headers = config.headers || {};
    config.headers["X-Visitor-Id"] = getVisitorId();

    return config;
});

// -----------------------------------------------------------------------------
// Authentication handling
// -----------------------------------------------------------------------------

// Requests that should never trigger an automatic login redirect.
const AUTH_REQUESTS = [
    "/auth/login",
    "/auth/signup",
    "/auth/verify-email",
    "/auth/resend-code",
];

// Background tracking requests must never kick a visitor to /login.
const TRACKING_REQUESTS = [
    "/dashboard/visits/heartbeat",
    "/dashboard/visits/end",
    "/click",
    "/dashboard/property-contacts",
    "/listing-contacts",
];

const matchesAny = (requestUrl = "", paths = []) =>
    paths.some((path) => requestUrl.includes(path));

// Redirect to login when authentication expires or is invalid.
axiosInstance.interceptors.response.use(
    (response) => response,

    (error) => {
        const status = error.response?.status;
        const requestUrl = error.config?.url || "";

        if (
            status === 401 &&
            !matchesAny(requestUrl, AUTH_REQUESTS) &&
            !matchesAny(requestUrl, TRACKING_REQUESTS) &&
            window.location.pathname !== "/login"
        ) {
            console.warn(
                "[Auth] Session expired or authentication invalid. Redirecting to login."
            );

            // Redirect the user and prevent them from returning
            // to a page that requires authentication.
            window.location.replace("/login");
        }

        return Promise.reject(error);
    }
);

export default axiosInstance;
