import { createClient } from '@supabase/supabase-js';
import type { Page } from '@playwright/test';

const SUPABASE_URL = 'https://sbfkoeozczzgyvakxozh.supabase.co';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNiZmtvZW96Y3p6Z3l2YWt4b3poIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM0OTIxODQsImV4cCI6MjA4OTA2ODE4NH0.BOnu8xOrjRFRCBgwbO78mW8bAW2mj8MeRtjkWIcLuMc';

/**
 * Signs in test user and seeds session + Swedish UI locale before any app bundle reads i18n.
 * Assertions in specs are written for Swedish copy.
 */
export async function loginAsTestUser(page: Page) {
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const { data } = await supabase.auth.signInWithPassword({
    email: 'test@pathtracker.dev',
    password: 'TestUser2026!',
  });
  const sessionStr = JSON.stringify(data.session);
  await page.addInitScript((s: string) => {
    window.localStorage.setItem('pathTracker.locale', 'sv');
    window.localStorage.setItem('sb-sbfkoeozczzgyvakxozh-auth-token', s);
  }, sessionStr);
  await page.goto('/');
  await page.waitForTimeout(1500);
}
