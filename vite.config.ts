/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    // Installable app: a web manifest plus a service worker that caches the app's own files, so it
    // opens instantly (and offline). Supabase requests always go to the network. `autoUpdate`
    // switches to a new version as soon as it has downloaded, so every deploy reaches the app.
    VitePWA({
      registerType: 'autoUpdate',
      // The icons are already cached by the image pattern below; don't list them twice.
      includeManifestIcons: false,
      manifest: {
        name: 'QuestLog',
        short_name: 'QuestLog',
        description: 'A gamified daily habit tracker. Earn XP, level up, keep streaks alive.',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#1a0e12',
        theme_color: '#1a0e12',
        icons: [
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: 'maskable-icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        navigateFallback: '/index.html',
        // The Outfit font from Google Fonts: keep a copy so the app looks right offline.
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\//,
            handler: 'StaleWhileRevalidate',
            options: { cacheName: 'google-fonts', expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 365 } },
          },
        ],
      },
    }),
  ],
  test: {
    include: ['src/**/*.test.ts'],
  },
})
