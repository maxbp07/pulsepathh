import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// Despliegue como ruta estática en el VPS MatForge: http://158.220.119.17/pulsepath/
const DEPLOY_BASE = process.env.VITE_BASE_PATH ?? '/pulsepath/';

export default defineConfig({
  base: DEPLOY_BASE,
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      base: DEPLOY_BASE,
      includeAssets: ['favicon.svg', 'robots.txt'],
      manifest: {
        name: 'PulsePath',
        short_name: 'PulsePath',
        description: 'Alertness & fatigue self-monitoring (PVT-BA).',
        theme_color: '#264dd9',
        background_color: '#faf8ff',
        display: 'standalone',
        start_url: DEPLOY_BASE,
        scope: DEPLOY_BASE,
        icons: [
          { src: `${DEPLOY_BASE}icons/icon.svg`, sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
          { src: `${DEPLOY_BASE}icons/icon.svg`, sizes: 'any', type: 'image/svg+xml', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff,woff2}'],
        // No hijackear rutas ajenas en el VPS compartido
        navigateFallback: `${DEPLOY_BASE}index.html`,
        navigateFallbackDenylist: [/^\/$/, /^\/(webhook|webhook\/)/],
      },
    }),
  ],
  server: { port: 5173, host: true },
  preview: { port: 4173, host: true },
});
