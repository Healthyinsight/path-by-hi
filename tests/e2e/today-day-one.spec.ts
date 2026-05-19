/**
 * E2E: Day-1 TodayView value — new user completes onboarding without Garmin data.
 *
 * Asserts that immediately after onboarding the dashboard shows:
 * - Dagens pass (workout) with non-empty text
 * - Kostmål with kcal > 0
 * - Race countdown with days > 0
 * - No ring-empty elements
 */
import { test, expect, type Page } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://sbfkoeozczzgyvakxozh.supabase.co';
// IMPORTANT: anon key is public and safe to use in test code.
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNiZmtvZW96Y3p6Z3l2YWt4b3poIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM0OTIxODQsImV4cCI6MjA4OTA2ODE4NH0.BOnu8xOrjRFRCBgwbO78mW8bAW2mj8MeRtjkWIcLuMc';

const SUPABASE_AUTH_STORAGE_KEY = 'sb-sbfkoeozczzgyvakxozh-auth-token';
const PATH_TRACKER_LOCALE_KEY = 'pathTracker.locale';

let testUserId: string | null = null;
let supabaseClient: ReturnType<typeof createClient> | null = null;

test.beforeAll(async () => {
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  supabaseClient = supabase;

  const { data, error } = await supabase.auth.signInWithPassword({
    email: 'test@pathtracker.dev',
    password: 'TestUser2026!',
  });
  if (error || !data?.session?.user?.id) {
    throw new Error(`Day-1 test setup: login failed — ${error?.message ?? 'no session'}`);
  }
  testUserId = data.session.user.id;

  const today = new Date().toISOString().split('T')[0]!;
  const fourWeeksOut = new Date();
  fourWeeksOut.setDate(fourWeeksOut.getDate() + 28);
  const futureEnd = fourWeeksOut.toISOString().split('T')[0]!;

  // Clear today's schedule and nutrition so the onboarding flow generates them fresh
  await supabase
    .from('training_schedule')
    .delete()
    .eq('user_id', testUserId)
    .gte('date', today)
    .lte('date', futureEnd);

  await supabase
    .from('nutrition_plan')
    .delete()
    .eq('user_id', testUserId)
    .eq('date', today);

  // Reset profile: mark onboarding incomplete with body metrics for nutrition calc
  await supabase.from('user_profiles').upsert(
    {
      user_id: testUserId,
      onboarding_completed: false,
      weight: 82,
      height_cm: 184,
      archetype: 'triathlon',
      disciplines: ['swim', 'bike', 'run'],
      show_race_countdown: true,
    },
    { onConflict: 'user_id' },
  );
});

test.afterAll(async () => {
  // Restore onboarding_completed so the shared test user is clean for other specs
  if (!supabaseClient || !testUserId) return;
  const goal = new Date();
  goal.setMonth(goal.getMonth() + 6);
  await supabaseClient.from('user_profiles').upsert(
    {
      user_id: testUserId,
      onboarding_completed: true,
      archetype: 'triathlon',
      disciplines: ['swim', 'bike', 'run'],
      goal_date: goal.toISOString().split('T')[0],
    },
    { onConflict: 'user_id' },
  );
});

async function injectSessionAndGoToOnboarding(page: Page) {
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const { data, error } = await supabase.auth.signInWithPassword({
    email: 'test@pathtracker.dev',
    password: 'TestUser2026!',
  });
  if (error || !data.session) {
    throw new Error(`injectSession: login failed — ${error?.message}`);
  }

  const sessionStr = JSON.stringify(data.session);
  await page.addInitScript(
    ([authKey, json, localeKey]: [string, string, string]) => {
      window.localStorage.setItem(authKey, json);
      window.localStorage.setItem(localeKey, 'sv');
    },
    [SUPABASE_AUTH_STORAGE_KEY, sessionStr, PATH_TRACKER_LOCALE_KEY],
  );

  await page.goto('/onboarding', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1200);
}

test('dag-1: TodayView visar pass, kostmål och nedräkning direkt efter onboarding', async ({ page }) => {
  await injectSessionAndGoToOnboarding(page);

  // Step 1 – Name
  await expect(page.getByPlaceholder('Ditt förnamn')).toBeVisible({ timeout: 10000 });
  await page.getByPlaceholder('Ditt förnamn').fill('TestUser');
  await page.getByRole('button', { name: /Nästa/i }).click();

  // Step 2 – Goal: triathlon
  await expect(page.getByTestId('onboarding-goal-triathlon')).toBeVisible({ timeout: 10000 });
  await page.getByTestId('onboarding-goal-triathlon').click();

  // Step 3 – Distance: half (70.3)
  await expect(page.getByTestId('onboarding-tri-distance-half')).toBeVisible({ timeout: 10000 });
  await page.getByTestId('onboarding-tri-distance-half').click();

  // Step 4 – Race: no race booked (auto-advances)
  await expect(page.getByTestId('onboarding-tri-race-no')).toBeVisible({ timeout: 10000 });
  await page.getByTestId('onboarding-tri-race-no').click();

  // Step 5 – Level: intermediate (auto-advances)
  await expect(page.getByTestId('onboarding-tri-level-intermediate')).toBeVisible({ timeout: 10000 });
  await page.getByTestId('onboarding-tri-level-intermediate').click();

  // Step 6 – Summary
  await expect(page.getByText(/Redo att börja/i)).toBeVisible({ timeout: 10000 });
  await page.getByRole('button', { name: /Nästa/i }).click();

  // Step 7 – Trail name: skip
  await expect(page.getByText(/Trail Name/i)).toBeVisible({ timeout: 10000 });
  await page.getByRole('button', { name: /Fortsätt/i }).click();

  // Wait for navigation to TodayView (handleFinish runs generateAndUpsert + generateForToday first)
  await expect(page).toHaveURL('/', { timeout: 25000 });
  await expect(page.locator('.app-container').first()).toBeVisible({ timeout: 15000 });

  // ── Assert 1: Workout card shows non-empty text ───────────────────────────
  // Look for workout-type keywords or the "no workout" card
  const workoutText = page.locator('text=/Styrka|Löpning|Simning|Cykling|Vilodag|Ingen träning/i').first();
  await expect(workoutText).toBeVisible({ timeout: 15000 });

  // ── Assert 2: Nutrition shows kcal > 0 ───────────────────────────────────
  // The nutrition card renders "0 / XXXX kcal" — assert target (after slash) > 0
  const kcalLocator = page.locator('text=/\\/\\s*\\d+\\s*kcal/').first();
  await expect(kcalLocator).toBeVisible({ timeout: 15000 });
  const kcalRaw = await kcalLocator.textContent();
  const kcalMatch = kcalRaw?.match(/\/\s*(\d+)\s*kcal/);
  expect(kcalMatch, 'kcal target should be visible and parseable').toBeTruthy();
  expect(parseInt(kcalMatch![1]!), 'target_kcal should be > 0').toBeGreaterThan(0);

  // ── Assert 3: Race countdown shows days > 0 ──────────────────────────────
  // RaceCountdownArc renders daysLeft in the weekProgress text (translation key raceCountdown.weekProgress)
  const countdownText = page.locator('text=/\\d+\\s*dagar/i').first();
  await expect(countdownText).toBeVisible({ timeout: 10000 });
  const countdownRaw = await countdownText.textContent();
  const daysMatch = countdownRaw?.match(/(\d+)\s*dagar/i);
  expect(daysMatch, 'race countdown days should be visible').toBeTruthy();
  expect(parseInt(daysMatch![1]!), 'days until race should be > 0').toBeGreaterThan(0);

  // ── Assert 4: No ring-empty elements ─────────────────────────────────────
  await expect(page.locator('[data-testid*="ring-empty"]')).toHaveCount(0);
});
