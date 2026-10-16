/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// Se publica en https://<usuario>.github.io/gym-app/
export default defineConfig({
  base: '/gym-app/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['apple-touch-icon.png', 'sample-data.json'],
      manifest: {
        name: 'Gym',
        short_name: 'Gym',
        description: 'Rutinas, entrenos y progreso',
        lang: 'es',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/gym-app/',
        scope: '/gym-app/',
        background_color: '#000000',
        theme_color: '#000000',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,png,svg,json}'],
        maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
      },
    }),
  ],
  test: {
    environment: 'node',
  },
})
