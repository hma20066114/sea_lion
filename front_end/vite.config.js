// import { defineConfig } from "vite";
// import react from "@vitejs/plugin-react";

// export default defineConfig({
//   server: {
//     proxy: {
//       "/api": {
//         target: "http://localhost:3000",
//         changeOrigin: true,
//       },
//       "/public": {
//         target: "http://localhost:3000",
//         changeOrigin: true,
//       },
//     },
//   },
//   plugins: [react()],
// });

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': { // If your backend API starts with /api
        target: 'http://127.0.0.1:8000', // Your Django backend address
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''), // Rewrite /api to ""
      },
    },
  },
});