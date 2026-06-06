import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

const manifest = JSON.parse(
  readFileSync(resolve(__dirname, 'manifest.webmanifest'), 'utf-8'),
);

export default defineConfig({
  plugins: [
    {
      name: 'pulsepath-serve-manifest',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          if (req.url !== '/manifest.webmanifest') {
            next();
            return;
          }
          res.setHeader('Content-Type', 'application/manifest+json');
          res.end(readFileSync(resolve(__dirname, 'manifest.webmanifest')));
        });
      },
    },
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['manifest.webmanifest'],
      manifest,
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webmanifest}'],
        navigateFallback: '/index.html',
        // Never hijack the employer dashboard — it lives under /dashboard/.
        navigateFallbackDenylist: [/^\/dashboard/],
      },
      devOptions: {
        enabled: true,
      },
    }),
  ],
  server: {
    port: 5173,
    strictPort: true,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
  preview: {
    port: 5173,
  },
});
