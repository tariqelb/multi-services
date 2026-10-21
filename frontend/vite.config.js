// import { defineConfig } from "vite";
// import react from "@vitejs/plugin-react";
// import tailwindcss from "@tailwindcss/vite";

// export default defineConfig({
//     plugins: [
//         react(),
//         tailwindcss(),
//     ],
// });

// import { defineConfig } from "vite";
// import react from "@vitejs/plugin-react";
// import tailwindcss from "@tailwindcss/vite";

// export default defineConfig({
//     plugins: [
//         react(),
//         tailwindcss(),
//     ],
//     server: {
//         host: "0.0.0.0",
//         allowedHosts: true,
//         proxy: {
//             "/api": {
//                 target: "http://localhost:3000",
//                 changeOrigin: true,
//             },
//         },
//     },
// });

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
    plugins: [
        react(),
        tailwindcss(),
    ],
    server: {
        host: "0.0.0.0",
        allowedHosts: true,
        proxy: {
            "/api": {
                target: "http://localhost:3000",
                changeOrigin: true,
            },
            "/uploads": {
                target: "http://localhost:3000",
                changeOrigin: true,
            },
        },
    },
});
