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

export default axiosInstance;
