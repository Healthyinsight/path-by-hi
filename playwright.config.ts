import { defineConfig } from '@playwright/test';

/** Dedicated port avoids clashing with a developer's normal `npm run dev` on 8080. */
const E2E_ORIGIN = process.env.PLAYWRIGHT_BASE_URL || 'http://127.0.0.1:4173';

export default defineConfig({
  testMatch: ['**/tests/e2e/**/*.spec.ts'],
  // Shared Supabase test user: parallel workers cause profile/DB races and flaky redirects.
  workers: 1,
  webServer: {
    command: 'npx vite --host 127.0.0.1 --port 4173 --strictPort',
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: false,
    timeout: 120000,
  },
  use: {
    baseURL: E2E_ORIGIN,
    browserName: 'chromium',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    serviceWorkers: 'block',
  },
});
