import { createClient } from '@supabase/supabase-js';
import { expect, type Page } from '@playwright/test';

const SUPABASE_URL = 'https://sbfkoeozczzgyvakxozh.supabase.co';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNiZmtvZW96Y3p6Z3l2YWt4b3poIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM0OTIxODQsImV4cCI6MjA4OTA2ODE4NH0.BOnu8xOrjRFRCBgwbO78mW8bAW2mj8MeRtjkWIcLuMc';

const SUPABASE_AUTH_STORAGE_KEY = 'sb-sbfkoeozczzgyvakxozh-auth-token';
/** Same as `LOCALE_STORAGE_KEY` in src/i18n/config.ts */
const PATH_TRACKER_LOCALE_KEY = 'pathTracker.locale';

/**
 * Signs in test user and seeds session + Swedish UI locale before any app bundle reads i18n.
 * Assertions in specs are written for Swedish copy.
 */
export async function loginAsTestUser(page: Page, opts?: { startPath?: string }) {
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const { data, error } = await supabase.auth.signInWithPassword({
    email: 'test@pathtracker.dev',
    password: 'TestUser2026!',
  });
  if (error || !data.session) {
    throw new Error(`E2E login failed: ${error?.message ?? 'no session'}`);
  }

  const sessionStr = JSON.stringify(data.session);
  const storageTuple = [SUPABASE_AUTH_STORAGE_KEY, sessionStr, PATH_TRACKER_LOCALE_KEY] as [
    string,
    string,
    string,
  ];

  await page.addInitScript(
    ([authKey, json, localeKey]: [string, string, string]) => {
      window.localStorage.setItem(authKey, json);
      window.localStorage.setItem(localeKey, 'sv');
    },
    storageTuple
  );

  const startPath = opts?.startPath ?? '/';
  await page.goto(startPath, { waitUntil: 'domcontentloaded' });

  async function injectSessionAndMaybeReload() {
    await page.evaluate(
      ([authKey, json, localeKey]: [string, string, string]) => {
        window.localStorage.setItem(authKey, json);
        window.localStorage.setItem(localeKey, 'sv');
      },
      storageTuple
    );
    await page.reload({ waitUntil: 'domcontentloaded' });
  }

  if (!(await page.locator('.app-container').first().isVisible().catch(() => false))) {
    await injectSessionAndMaybeReload();
  }

  await page.waitForTimeout(800);
  await expect(page).not.toHaveURL(/\/(login|onboarding)/, {
    timeout: 20000,
  });
  await expect(page.locator('.app-container').first()).toBeVisible({ timeout: 20000 });
}
