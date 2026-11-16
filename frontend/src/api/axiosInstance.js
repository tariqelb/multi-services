import axios from "axios";

const axiosInstance = axios.create({
    baseURL: import.meta.env.VITE_API_URL || "/api",
    withCredentials: true,
});

// Requests that should never trigger an automatic login redirect.
const AUTH_REQUESTS = [
    "/auth/login",
    "/auth/signup",
    "/auth/verify-email",
    "/auth/resend-code",
];

const isAuthRequest = (requestUrl = "") => {
    return AUTH_REQUESTS.some((path) => requestUrl.includes(path));
};

// Redirect to login when authentication expires or is invalid.
axiosInstance.interceptors.response.use(
    (response) => response,

    (error) => {
        const status = error.response?.status;
        const requestUrl = error.config?.url || "";

        if (
            status === 401 &&
            !isAuthRequest(requestUrl) &&
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