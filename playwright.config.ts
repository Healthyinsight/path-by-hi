import { defineConfig } from '@playwright/test';

export default defineConfig({
  testMatch: ['**/tests/e2e/**/*.spec.ts'],
  use: {
    baseURL: 'https://tracker.healthyinsight.eu',
    browserName: 'chromium',
    // Match assertions that expect Swedish UI (i18n keys in sv.ts).
    locale: 'sv-SE',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
});
