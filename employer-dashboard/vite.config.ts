import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));

// PulsePath — Dashboard del empleador.
// Mantiene la base /dashboard/ y el proxy /api -> backend (puerto 3000) del
// dashboard original en Vanilla JS, para no romper el despliegue (Nginx) ni la
// integración con el backend Express existente.
export default defineConfig({
  base: '/dashboard/',
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  server: {
    port: 5174,
    strictPort: true,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
});
