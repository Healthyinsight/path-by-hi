import { test, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || 'https://tracker.healthyinsight.eu';
const SCREENSHOT_DIR = path.join(__dirname, '../ux-screenshots');

test.beforeAll(() => {
  if (!fs.existsSync(SCREENSHOT_DIR)) fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
});

test('UX screenshots — all screens', async ({ page }) => {
  // Login
  await page.goto(`${BASE_URL}/login`);
  await page.screenshot({ path: `${SCREENSHOT_DIR}/01-login.png`, fullPage: true });

  await page.fill('input[type="email"]', 'ux-eval@healthyinsight.eu');
  await page.fill('input[type="password"]', process.env.UX_EVAL_PASSWORD || '');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/today', { timeout: 10000 });

  // TodayView
  await page.screenshot({ path: `${SCREENSHOT_DIR}/02-today-view.png`, fullPage: true });

  // Schedule
  await page.goto(`${BASE_URL}/schedule`);
  await page.waitForLoadState('networkidle');
  await page.screenshot({ path: `${SCREENSHOT_DIR}/03-schedule.png`, fullPage: true });

  // Profile / Settings
  await page.goto(`${BASE_URL}/profile`);
  await page.waitForLoadState('networkidle');
  await page.screenshot({ path: `${SCREENSHOT_DIR}/04-profile.png`, fullPage: true });

  // Nutrition (if exists)
  await page.goto(`${BASE_URL}/nutrition`);
  await page.waitForLoadState('networkidle');
  await page.screenshot({ path: `${SCREENSHOT_DIR}/05-nutrition.png`, fullPage: true });

  // Onboarding (separate, no auth)
  await page.goto(`${BASE_URL}/onboarding`);
  await page.waitForLoadState('networkidle');
  await page.screenshot({ path: `${SCREENSHOT_DIR}/06-onboarding.png`, fullPage: true });

  console.log(`✅ Screenshots sparade i: ${SCREENSHOT_DIR}`);
});
