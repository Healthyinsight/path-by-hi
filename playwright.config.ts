import { defineConfig } from '@playwright/test';

export default defineConfig({
  testMatch: ['**/tests/e2e/**/*.spec.ts'],
  use: {
    baseURL: 'https://tracker.healthyinsight.eu',
    browserName: 'chromium',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
});
