// import axios from "axios";

// const axiosInstance = axios.create({
//     baseURL: import.meta.env.VITE_API_URL || "http://localhost:3000/api",
//     withCredentials: true,
// });

// export default axiosInstance;

import axios from "axios";

const axiosInstance = axios.create({
    baseURL: import.meta.env.VITE_API_URL || "/api",
    withCredentials: true,
});


// Redirect to login when an authenticated request returns 401.
axiosInstance.interceptors.response.use(
    (response) => response,
    (error) => {
        const status = error.response?.status;
        const requestUrl = error.config?.url || "";

        const isAuthRequest = [
            "/auth/login",
            "/auth/signup",
            "/auth/verify-email",
            "/auth/resend-code",
        ].some((path) => requestUrl.includes(path));

        if (status === 401 && !isAuthRequest) {
            // Prevent repeated redirects.
            if (window.location.pathname !== "/login") {
                window.location.replace("/login");
            }
        }

        return Promise.reject(error);
    }
);

export default axiosInstance;