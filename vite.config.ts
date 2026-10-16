import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon-180x180.png', 'logo.svg', 'avatars/*.svg'],
      manifest: {
        name: 'ÉclaireMonVote',
        short_name: 'ÉclaireMonVote',
        description: 'Consulter et comparer les programmes des candidats, thème par thème, en toute neutralité.',
        lang: 'fr',
        // start_url et scope suivent le chemin de base de Vite (`/` ou `/-claireMonVote/` sur GitHub Pages).
        display: 'standalone',
        orientation: 'portrait-primary',
        background_color: '#f8fafc',
        theme_color: '#0f172a',
        icons: [
          { src: 'pwa-64x64.png', sizes: '64x64', type: 'image/png' },
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: 'maskable-icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // App shell + données JSON (embarquées dans le bundle) sont précachées : tout fonctionne hors ligne.
        globPatterns: ['**/*.{js,css,html,svg,png,ico,webp,woff2,json}'],
        navigateFallback: 'index.html',
        runtimeCaching: [
          {
            // Images distantes éventuelles (photos officielles) : cache first.
            urlPattern: ({ request }) => request.destination === 'image',
            handler: 'CacheFirst',
            options: {
              cacheName: 'images',
              expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 * 30 },
            },
          },
          {
            // Futures données distantes (API / JSON hébergé) : network first, repli sur le cache.
            urlPattern: ({ url }) => url.pathname.endsWith('.json'),
            handler: 'NetworkFirst',
            options: { cacheName: 'data', networkTimeoutSeconds: 3 },
          },
        ],
      },
    }),
  ],
})
