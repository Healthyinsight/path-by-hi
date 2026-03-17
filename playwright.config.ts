import { defineConfig } from '@playwright/test';

export default defineConfig({
  use: {
    baseURL: 'https://tracker.healthyinsight.eu',
    browserName: 'chromium',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
});
