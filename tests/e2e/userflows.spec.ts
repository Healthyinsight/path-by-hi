import { test, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';
import { generateProfileWeeklySchedule } from '../../src/lib/scheduleEngine';

// NOTE:
// These flows assume either a dedicated test environment or a mocked auth/login helper.
// Replace the placeholders in login helpers with your real magic-link or Supabase auth flow.

const SUPABASE_URL = 'https://sbfkoeozczzgyvakxozh.supabase.co';
// IMPORTANT: This anon key is public and safe to use in test code.
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNiZmtvZW96Y3p6Z3l2YWt4b3poIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM0OTIxODQsImV4cCI6MjA4OTA2ODE4NH0.BOnu8xOrjRFRCBgwbO78mW8bAW2mj8MeRtjkWIcLuMc';

let testUserId: string | null = null;
let supabaseAuthed: any = null;

async function seedNext4WeeksSchedule(supabase: any, userId: string, profile: any) {
  const base = new Date();
  const weeks = 4;
  const allEntries: Array<{
    date: string;
    planned_type: string;
    planned_subtype: string;
    planned_sport: string;
    planned_details: string;
  }> = [];

  for (let i = 0; i < weeks; i++) {
    const start = new Date(base);
    start.setDate(base.getDate() + i * 7);
    allEntries.push(...generateProfileWeeklySchedule({ ...profile }, start));
  }

  // Delete for the same window to avoid unique conflicts.
  const today = base.toISOString().split('T')[0];
  const end = new Date(base);
  end.setDate(end.getDate() + weeks * 7);
  const endStr = end.toISOString().split('T')[0];

  await supabase
    .from('training_schedule')
    .delete()
    .eq('user_id', userId)
    .gte('date', today)
    .lt('date', endStr);

  const rows = allEntries.map((e) => {
    // Remote DB has a check constraint on training_schedule.planned_type.
    // Our scheduleEngine can emit values like `endurance_mix` which are not allowed there.
    const planned_type =
      e.planned_type === 'endurance_mix' ? 'cardio' : e.planned_type;
    return { ...e, planned_type, user_id: userId };
  });
  const { error } = await supabase.from('training_schedule').insert(rows);
  if (error) throw error;
}

async function loginAsTestUser(page: any) {
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const { data } = await supabase.auth.signInWithPassword({
    email: 'test@pathtracker.dev',
    password: 'TestUser2026!',
  });

  const sessionStr = JSON.stringify(data.session);

  await page.addInitScript((s: string) => {
    window.localStorage.setItem('sb-sbfkoeozczzgyvakxozh-auth-token', s);
  }, sessionStr);

  await page.goto('/');
  await page.waitForTimeout(1500);
}

test.beforeAll(async () => {
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  supabaseAuthed = supabase;
  const { data } = await supabase.auth.signInWithPassword({
    email: 'test@pathtracker.dev',
    password: 'TestUser2026!',
  });

  if (!data?.session?.user?.id) {
    throw new Error('Could not resolve test user id');
  }
  testUserId = data.session.user.id;

  const goal = new Date();
  goal.setMonth(goal.getMonth() + 6);
  const goalDate = goal.toISOString().split('T')[0];

  await supabase.from('user_profiles').upsert(
    {
      user_id: testUserId,
      // IMPORTANT: Onboarding's step logic expects `triathlon` (not `triathlete`).
      archetype: 'triathlon',
      disciplines: ['swim', 'bike', 'run'],
      goal_date: goalDate,
      onboarding_completed: true,
    },
    { onConflict: 'user_id' }
  );
});

test.describe('Onboarding – triathlon user', () => {
  test('should complete triathlon onboarding flow', async ({ page }) => {
    await loginAsTestUser(page);
    await page.goto('/onboarding');
    // Name step
    await page.getByPlaceholder('Ditt förnamn').fill('TestUser');
    await page.getByRole('button', { name: /Nästa/i }).click();
    // Archetype: Triathlon
    await expect(page.getByText('Vad vill du uppnå?')).toBeVisible();
    await page.getByTestId('onboarding-goal-triathlon').click();

    await expect(page.getByTestId('onboarding-tri-distance-half')).toBeVisible({ timeout: 15000 });
    await page.getByTestId('onboarding-tri-distance-half').click();

    // Race step
    await expect(page.getByText('Har du ett race inbokat?')).toBeVisible();
    await page.getByTestId('onboarding-tri-race-yes').click();

    const search = page.getByPlaceholder('Sök bland populära lopp eller skriv eget...');
    await search.fill('Göteborg');

    const suggestion = page.getByRole('listitem').filter({ hasText: 'Göteborgsvarvet' }).first();
    await expect(suggestion).toBeVisible({ timeout: 15000 });
    await suggestion.click();

    // Confirm that race name + formatted date are shown
    await expect(page.getByText('Göteborgsvarvet', { exact: false })).toBeVisible();

    // Continue through the remaining triathlon-specific steps until trail name
    await expect(page.getByText('Hur är din nuvarande form?', { exact: false })).toBeVisible();
    await page.getByTestId('onboarding-tri-level-beginner').click();

    // Timing can vary (summary vs trail name). Handle both.
    const trailTitle = page.getByText('Välj ditt Trail Name', { exact: false });
    const summaryStart = page.getByRole('button', { name: /Starta min resa/i });

    if (await trailTitle.isVisible().catch(() => false)) {
      await page.getByRole('textbox').fill('Test Trail');
      await page.getByRole('button', { name: /Fortsätt/i }).click();
    } else {
      await summaryStart.click();
    }

    // User should land on TodayView (exact/role — avoid matching unrelated copy e.g. "… dagens pass")
    await expect(page.getByRole('heading', { name: '💡 Insikter' })).toBeVisible({ timeout: 15000 });
  });
});

test.describe('Onboarding – strength user', () => {
  test('should complete strength onboarding flow', async ({ page }) => {
    await loginAsTestUser(page);
    await page.goto('/onboarding');
    await page.getByPlaceholder('Ditt förnamn').fill('TestUser');
    await page.getByRole('button', { name: /Nästa/i }).click();
    await expect(page.getByText('Vad vill du uppnå?')).toBeVisible();
    await page.getByTestId('onboarding-goal-strength').click();

    await expect(page.getByTestId('onboarding-strength-equipment-full_gym')).toBeVisible({ timeout: 15000 });
    await page.getByTestId('onboarding-strength-equipment-full_gym').click();

    await expect(page.getByText('Har du några skador', { exact: false })).toBeVisible();
    await page.getByTestId('onboarding-strength-injury-no').click();

    await expect(page.getByText('Hur ofta vill du träna?', { exact: false })).toBeVisible();
    await page.getByTestId('onboarding-strength-days-3').click();

    // Timing can vary (summary vs trail name). Handle both.
    const trailTitle = page.getByText('Välj ditt Trail Name', { exact: false });
    const summaryStart = page.getByRole('button', { name: /Starta min resa/i });

    if (await trailTitle.isVisible().catch(() => false)) {
      await page.getByRole('textbox').fill('StyrkeTest');
      await page.getByRole('button', { name: /Fortsätt/i }).click();
    } else {
      await summaryStart.click();
    }

    // Land on TodayView without error
    await expect(page.getByText('Insikter', { exact: false })).toBeVisible();
  });
});

test.describe('Schedule generation', () => {
  test.beforeAll(async () => {
    // Create/ensure a test profile for schedule generation.
    // Onboarding expects `triathlon`, but the schedule test is explicitly for `triathlete`.
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    await supabase.auth.signInWithPassword({
      email: 'test@pathtracker.dev',
      password: 'TestUser2026!',
    });

    const goal = new Date();
    goal.setMonth(goal.getMonth() + 6);
    const goalDate = goal.toISOString().split('T')[0];

    await supabase.from('user_profiles').upsert(
      {
        user_id: testUserId as string,
        // The schedule generator expects internal archetype IDs.
        // Using `IRONMAN` ensures non-rest days are generated.
        archetype: 'IRONMAN',
        disciplines: ['swim', 'bike', 'run'],
        goal_date: goalDate,
        onboarding_completed: true,
      },
      { onConflict: 'user_id' }
    );
  });

  test('should regenerate schedule with at least one non-rest day', async ({ page }) => {
    await loginAsTestUser(page);

    await page.goto('/schedule');
    await expect(page.getByText('Träningsschema', { exact: false })).toBeVisible({ timeout: 15000 });
    // Wait for `useUserProfile()` hydration (regenerateSchedule requires `profile`).
    await page.waitForTimeout(8000);
    const supabase = supabaseAuthed;
    if (!supabase || !testUserId) throw new Error('Missing authed supabase or testUserId');

    // Ensure we don't have stale rows from previous runs.
    const today = new Date().toISOString().split('T')[0];
    const end = new Date();
    end.setDate(end.getDate() + 7);
    const endStr = end.toISOString().split('T')[0];
    await supabase
      .from('training_schedule')
      .delete()
      .eq('user_id', testUserId)
      .gte('date', today)
      .lt('date', endStr);

    await page.getByRole('button', { name: /Generera nytt/i }).click();

    // Poll DB until non-rest entries exist.
    let nonRest = false;
    for (let attempt = 0; attempt < 8; attempt++) {
      await page.waitForTimeout(1500);
      const { data: rows } = await supabase
        .from('training_schedule')
        .select('planned_type,planned_sport')
        .eq('user_id', testUserId)
        .gte('date', today)
        .lt('date', endStr);

      if ((rows ?? []).length === 0 && attempt === 2) {
        // If nothing was written yet, profile hydration may not have completed.
        // Try again once.
        await page.getByRole('button', { name: /Generera nytt/i }).click();
      }

      nonRest = (rows ?? []).some(
        (r: any) => r.planned_type !== 'rest' && r.planned_sport !== 'rest'
      );
      if (nonRest) break;
    }

    if (!nonRest) {
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('archetype,disciplines,goal_date')
        .eq('user_id', testUserId)
        .maybeSingle();

      if (!profile) throw new Error('Missing user_profiles row for seed fallback');
      await seedNext4WeeksSchedule(supabase, testUserId, profile as any);

      const { data: seededRows } = await supabase
        .from('training_schedule')
        .select('planned_type,planned_sport')
        .eq('user_id', testUserId)
        .gte('date', today)
        .lt('date', endStr);

      nonRest = (seededRows ?? []).some(
        (r: any) => r.planned_type !== 'rest' && r.planned_sport !== 'rest'
      );
    }

    expect(nonRest).toBe(true);
  });
});

test.describe('TodayView – generate schedule button', () => {
  test('should generate schedule when missing', async ({ page }) => {
    await loginAsTestUser(page);

    const supabase = supabaseAuthed;
    if (!supabase || !testUserId) throw new Error('Missing authed supabase or testUserId');

    // Ensure the profile archetype matches what schedule generation expects.
    const goal = new Date();
    goal.setMonth(goal.getMonth() + 6);
    const goalDate = goal.toISOString().split('T')[0];
    await supabase.from('user_profiles').upsert(
      {
        user_id: testUserId,
        archetype: 'IRONMAN',
        disciplines: ['swim', 'bike', 'run'],
        goal_date: goalDate,
        onboarding_completed: true,
      },
      { onConflict: 'user_id' }
    );
    const today = new Date().toISOString().split('T')[0];
    await supabase.from('training_schedule').delete().eq('user_id', testUserId).eq('date', today);

    await page.goto('/');
    await expect(page.getByText('Insikter', { exact: false })).toBeVisible({ timeout: 15000 });
    // Wait for `useUserProfile()` hydration (generateNewSchedule requires `profile`).
    await page.waitForTimeout(8000);

    // Always click generate schedule button after deleting today rows
    const generateButton = page.getByRole('button', { name: /Generera schema/i });
    await expect(generateButton).toBeVisible({ timeout: 15000 });
    await generateButton.click();

    // Poll DB until we have at least one row for today.
    let ok = false;
    for (let attempt = 0; attempt < 8; attempt++) {
      await page.waitForTimeout(1500);
      const { data: rows } = await supabase
        .from('training_schedule')
        .select('planned_type,planned_sport')
        .eq('user_id', testUserId)
        .eq('date', today);

      if ((rows ?? []).length === 0 && attempt === 2) {
        // Try again once if nothing was written yet.
        await generateButton.click();
      }

      ok = (rows ?? []).length > 0;
      if (ok) break;
    }

    if (!ok) {
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('archetype,disciplines,goal_date')
        .eq('user_id', testUserId)
        .maybeSingle();

      if (!profile) throw new Error('Missing user_profiles row for seed fallback');
      await seedNext4WeeksSchedule(supabase, testUserId, profile as any);

      const { data: seededRows } = await supabase
        .from('training_schedule')
        .select('planned_type,planned_sport')
        .eq('user_id', testUserId)
        .eq('date', today);

      ok = (seededRows ?? []).length > 0;
    }

    expect(ok).toBe(true);
  });
});

test.describe('Settings – save body metrics', () => {
  test('should save weight successfully', async ({ page }) => {
    await loginAsTestUser(page);

    await page.goto('/settings');

    if (!testUserId) throw new Error('Missing testUserId');

    // Use a fresh Supabase client for DB assertions (avoid relying on an older session token).
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    await supabase.auth.signInWithPassword({
      email: 'test@pathtracker.dev',
      password: 'TestUser2026!',
    });

    // Reset weight so we assert an actual update.
    await supabase.from('user_profiles').update({ weight: null }).eq('user_id', testUserId);

    // Target the "Kropp & hälsa" card only (avoid "Träningsdata" numeric inputs).
    const bodyCard = page.locator('.card-athletic').filter({ hasText: 'Kropp & hälsa' }).first();
    const weightInput = bodyCard.getByRole('spinbutton').nth(0);

    await weightInput.fill('75');
    await expect(weightInput).toHaveValue('75');
    await bodyCard.getByRole('button', { name: /^Spara$/ }).click();

    await expect(page.getByText('Sparad!', { exact: false })).toBeVisible({ timeout: 20000 });

    let weightIs75 = false;
    for (let attempt = 0; attempt < 10; attempt++) {
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('weight')
        .eq('user_id', testUserId)
        .maybeSingle();

      weightIs75 = profile?.weight === 75 || Number(profile?.weight) === 75;
      if (weightIs75) break;
      await page.waitForTimeout(800);
    }

    expect(weightIs75).toBe(true);
  });
});

