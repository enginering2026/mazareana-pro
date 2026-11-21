import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  // GitHub Pages: يعمل تحت /mazareana-pro/
  base: mode === 'production' ? '/mazareana-pro/' : '/',
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.png", "favicon.ico", "logo.png"],
      manifest: {
        name: "مزارعنا برو - إدارة المزارع",
        short_name: "مزارعنا",
        description: "نظام إدارة مالية شامل للمزارع والإنتاج الحيواني",
        theme_color: "#7c3aed",
        background_color: "#0f0f1a",
        display: "standalone",
        orientation: "portrait",
        scope: "/",
        start_url: "/",
        lang: "ar",
        dir: "rtl",
        categories: ["finance", "business", "productivity"],
        icons: [
          {
            src: "/icons/icon-48.webp",
            sizes: "48x48",
            type: "image/webp",
            purpose: "any maskable",
          },
          {
            src: "/icons/icon-72.webp",
            sizes: "72x72",
            type: "image/webp",
            purpose: "any maskable",
          },
          {
            src: "/icons/icon-96.webp",
            sizes: "96x96",
            type: "image/webp",
            purpose: "any maskable",
          },
          {
            src: "/icons/icon-128.webp",
            sizes: "128x128",
            type: "image/webp",
            purpose: "any maskable",
          },
          {
            src: "/icons/icon-192.webp",
            sizes: "192x192",
            type: "image/webp",
            purpose: "any maskable",
          },
          {
            src: "/icons/icon-256.webp",
            sizes: "256x256",
            type: "image/webp",
            purpose: "any maskable",
          },
          {
            src: "/icons/icon-512.webp",
            sizes: "512x512",
            type: "image/webp",
            purpose: "any maskable",
          },
        ],
      },
      workbox: {
        // Cache كل الأصول الأساسية للعمل بدون نت
        globPatterns: ["**/*.{js,css,html,ico,png,svg,webp,woff2}"],
        // استراتيجية: استخدام الـ cache أولاً، تحديث في الخلفية
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "google-fonts-cache",
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "gstatic-fonts-cache",
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
        // تأكد إن SPA routing يشتغل صح
        navigateFallback: "index.html",
        navigateFallbackDenylist: [/^\/api\//],
      },
      devOptions: {
        enabled: false,
      },
    }),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    target: "es2020",
    cssCodeSplit: true,
    chunkSizeWarningLimit: 800,
    rollupOptions: {
      output: {
        manualChunks: {
          "vendor-react": ["react", "react-dom", "react-router-dom"],
          "vendor-query": ["@tanstack/react-query"],
          "vendor-ui": [
            "@radix-ui/react-dialog",
            "@radix-ui/react-select",
            "@radix-ui/react-tabs",
            "@radix-ui/react-dropdown-menu",
            "@radix-ui/react-popover",
            "@radix-ui/react-tooltip",
            "@radix-ui/react-slot",
            "@radix-ui/react-switch"
          ],
          "vendor-charts": ["recharts"],
          "vendor-icons": ["lucide-react"],
        },
      },
    },
  },
}));
