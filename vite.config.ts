import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import candidates from './src/data/candidates.json'
import themes from './src/data/themes.json'
import issues from './src/data/issues.json'
import meta from './src/data/meta.json'
import { seo } from './seo'

// Publie les données à côté de l'app (`data/*.json`) pour que l'app installée puisse les recharger au démarrage.
function publishData(): Plugin {
  return {
    name: 'publish-data',
    generateBundle() {
      for (const [name, data] of Object.entries({ candidates, themes, issues, meta })) {
        this.emitFile({ type: 'asset', fileName: `data/${name}.json`, source: JSON.stringify(data) })
      }
    },
  }
}

export default defineConfig({
  // Le chemin de base suit l'adresse publique (`/` sur un domaine propre, `/-claireMonVote/` sur GitHub Pages).
  base: process.env.SITE_URL ? new URL(process.env.SITE_URL).pathname.replace(/\/?$/, '/') : '/',
  plugins: [
    react(),
    tailwindcss(),
    publishData(),
    seo(),
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
        // App shell précachée : tout fonctionne hors ligne (les données sont aussi embarquées dans le bundle).
        globPatterns: ['**/*.{js,css,html,svg,png,ico,webp,woff2,json}'],
        // Données publiées et crédits photo : jamais précachés, pour que le démarrage récupère la dernière version.
        globIgnores: ['data/**', 'photos/**', '404.html'],
        navigateFallback: 'index.html',
        // Pages statiques hors de l'app : servies telles quelles.
        navigateFallbackDenylist: [/confidentialite\.html$/, /\/\.well-known\//],
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
            // Données publiées et crédits photo : network first, repli sur le cache hors ligne.
            urlPattern: ({ url }) => url.pathname.endsWith('.json'),
            handler: 'NetworkFirst',
            options: { cacheName: 'data', networkTimeoutSeconds: 3 },
          },
        ],
      },
    }),
  ],
})
