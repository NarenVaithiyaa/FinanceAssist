import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["logo_pwa.png"],
      manifest: {
        name: "PennyWise",
        short_name: "PennyWise",
        description: "AI-Powered Personal Finance Tracker",
        theme_color: "#09090b", // Dark theme by default
        background_color: "#09090b",
        display: "standalone",
        orientation: "portrait",
        start_url: "/",
        categories: ["finance", "productivity"],
        icons: [
          {
            src: "/logo_pwa.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "/logo_pwa.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "/logo_pwa.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          }
        ],
      },
      workbox: {
        // Safe caching limits - cache only static frontend shell
        globPatterns: ["**/*.{js,css,html,ico,png,svg}"],
        navigateFallback: "/index.html",
        navigateFallbackDenylist: [/^\/api/], // Don't intercept API routes
        runtimeCaching: [
          {
            // Specifically exclude Supabase auth and data from caching
            urlPattern: /^https:\/\/.*\.supabase\.co\/.*$/,
            handler: "NetworkOnly",
          },
          {
            // Specifically exclude API responses from caching
            urlPattern: /^\/api\/.*$/,
            handler: "NetworkOnly",
          },
        ],
      },
    }),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
