import { defineConfig } from '@playwright/test';

export default defineConfig({
  testMatch: ['**/tests/e2e/**/*.spec.ts'],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:8080',
    reuseExistingServer: !process.env.CI,
    timeout: 30000,
  },
  use: {
    baseURL: 'https://tracker.healthyinsight.eu',
    browserName: 'chromium',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
});
