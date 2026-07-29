/**
 * @file vite.config.js
 * @purpose Vite build configuration for the Stocky application.
 * @responsibilities
 * - Configures Vite plugins (Tailwind, React).
 * - Sets up development server (localhost:5000).
 * - Defines path aliases for cleaner imports (@/ → ./src).
 * @key_exports
 * - Vite configuration object (default export)
 * @dependencies
 * - @tailwindcss/vite - Tailwind CSS integration
 * - @vitejs/plugin-react - React Fast Refresh support
 * - vite - Build tool
 * @lifecycle
 * - Loaded by Vite during development and build.
 * @date 2026-02-04
 */

// =============================
// Imports
// =============================

import tailwind from "@tailwindcss/vite";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from "node:url";
import { VitePWA } from "vite-plugin-pwa";

// =============================
// Path Resolution
// =============================

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// =============================
// Vite Configuration
// =============================

export default defineConfig({
  plugins: [
    tailwind(),
    react(),
    VitePWA({
      registerType: "autoUpdate",
      devOptions: {
        enabled: false
      },
      manifest: {
        name: "Stocky",
        short_name: "Stocky",
        description: "Institutional-Grade Market Intelligence Platform",
        theme_color: "#02050e",
        background_color: "#02050e",
        display: "standalone",
        icons: [
          {
            src: "stocky_logo_white.png",
            sizes: "192x192",
            type: "image/png"
          },
          {
            src: "stocky_logo_white.png",
            sizes: "512x512",
            type: "image/png"
          }
        ]
      },
      workbox: {
        maximumFileSizeToCacheInBytes: 5000000
      }
    })
  ],
  server: {
    host: "localhost",
    port: 5173,
    strictPort: true,
    proxy: {
      "/api": {
        target: "http://127.0.0.1:5000",
        changeOrigin: true,
        secure: false,
      },
      "/socket.io": {
        target: "http://127.0.0.1:5000",
        ws: true,
        changeOrigin: true,
      }
    }
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
