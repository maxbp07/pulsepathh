import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  timeout: 60_000,
  use: {
    ...devices['Pixel 5'],
    baseURL: process.env.E2E_BASE_URL || 'http://localhost:5173/',
  },
  webServer: process.env.CI
    ? undefined
    : {
        command: 'npm run dev',
        cwd: '../employee-app-stitch',
        url: 'http://localhost:5173/',
        reuseExistingServer: true,
      },
});
