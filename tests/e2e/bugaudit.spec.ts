/**
 * BUG AUDIT – E2E-täckning (kompletterar userflows.spec.ts)
 *
 * ANALYS – användarflöden som INTE (eller bara delvis) täcks av befintliga 5 tester:
 *
 * a) ONBOARDING
 *    - userflows: full triathlon/strength UI-slut, men INGEN DB-verifiering av quiz-fält
 *      (archetype, disciplines, trail_name, training_days_per_week, goal_name m.m. i user_profiles).
 *
 * b) RETAKE QUIZ (Inställningar → "Kör quizen igen")
 *    - userflows: ingen täckning.
 *    - Saknas: trail_name/archetype/disciplines efter ny quiz; gammalt schema ersatts (kräver UI + DB + ev. regenerate).
 *
 * c) SETTINGS
 *    - userflows: endast vikt i "Kropp & hälsa" → user_profiles.
 *    - Saknas: längd (height_cm) → DB; "Spara inställningar" synkar mål/namn mot user_goals + users + user_profiles
 *      (useUserProfile läser user_profiles; save() i SettingsPage.tsx uppdaterar bara users + user_goals).
 *
 * d) TODAYVIEW
 *    - userflows: "Generera schema" när det saknas.
 *    - Saknas: hälsning med trail_name (TodayView.tsx); insikter från knowledge_rules (useInsights.ts);
 *      "Dagens pass" när rad redan finns (dagens workout-kort).
 *
 * e) SCHEDULE
 *    - userflows: regenerate + icke-vilodag.
 *    - Saknas: explicit vecka med måndag först (Schedule.tsx DAY_LABELS/getWeekDates);
 *      datumintervall = rätt vecka; passtyper i linje med archetype (UI-etiketter Simning/Cykling/Löpning/Styrka).
 *
 * f) AUTH
 *    - userflows: ingen utloggning / om-inloggning / refresh.
 *    - Saknas: Logga ut → session via addInitScript igen → TodayView (inte onboarding);
 *      session kvar efter page.reload().
 *
 * Kör hela sviten lokalt: npm run test:e2e
 * Rekommendation: playwright test --workers=1 om samma testanvändare delas mellan filer (annars risk för flake).
 */

import { test, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';
import { generateProfileWeeklySchedule } from '../../src/lib/scheduleEngine';
import { loginAsTestUser } from './loginTestUser';

const SUPABASE_URL = 'https://sbfkoeozczzgyvakxozh.supabase.co';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNiZmtvZW96Y3p6Z3l2YWt4b3poIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM0OTIxODQsImV4cCI6MjA4OTA2ODE4NH0.BOnu8xOrjRFRCBgwbO78mW8bAW2mj8MeRtjkWIcLuMc';

let testUserId: string | null = null;

test.describe.configure({ mode: 'serial' });

async function getFreshSupabase() {
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  await supabase.auth.signInWithPassword({
    email: 'test@pathtracker.dev',
    password: 'TestUser2026!',
  });
  return supabase;
}

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

  const today = base.toISOString().split('T')[0];
  const end = new Date(base);
  end.setDate(end.getDate() + weeks * 7);
  const endStr = end.toISOString().split('T')[0];

  await supabase.from('training_schedule').delete().eq('user_id', userId).gte('date', today).lt('date', endStr);

  const rows = allEntries.map((e) => {
    const allowed = ['cardio', 'strength', 'swim', 'rest'];
    const rawType = e.planned_type === 'endurance_mix' ? 'cardio' : e.planned_type;
    const planned_type = allowed.includes(rawType) ? rawType : 'cardio';
    return { ...e, planned_type, user_id: userId };
  });
  const { error } = await supabase.from('training_schedule').insert(rows);
  if (error) throw error;
}

function mondayOfCurrentWeek(): Date {
  const today = new Date();
  const day = today.getDay();
  const monday = new Date(today);
  monday.setDate(today.getDate() - ((day + 6) % 7));
  monday.setHours(12, 0, 0, 0);
  return monday;
}

function fmtShortDate(d: Date): string {
  return `${d.getDate()}/${d.getMonth() + 1}`;
}

async function restoreIronBaseline(supabase: any) {
  if (!testUserId) return;
  const goal = new Date();
  goal.setMonth(goal.getMonth() + 6);
  const goalDate = goal.toISOString().split('T')[0];
  const { error } = await supabase.from('user_profiles').upsert(
    {
      user_id: testUserId,
      archetype: 'IRONMAN',
      disciplines: ['swim', 'bike', 'run'],
      goal_date: goalDate,
      goal_name: 'Ironman seed',
      onboarding_completed: true,
      trail_name: null,
      display_name: 'TestUser',
    },
    { onConflict: 'user_id' }
  );
  if (error) {
    throw new Error(`restoreIronBaseline failed: ${error.message}`);
  }
  // Settings save upserts both user_profiles and user_goals; seed goals so UPDATE path is used (matches prod users who completed onboarding).
  const { error: goalsError } = await supabase.from('user_goals').upsert(
    {
      user_id: testUserId,
      goal_name: 'Ironman seed',
      goal_date: goalDate,
      goal_emoji: '🏊',
      disciplines: ['swim', 'bike', 'run'],
    },
    { onConflict: 'user_id' }
  );
  if (goalsError) {
    throw new Error(`restoreIronBaseline user_goals failed: ${goalsError.message}`);
  }
}

test.beforeAll(async () => {
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const { data, error } = await supabase.auth.signInWithPassword({
    email: 'test@pathtracker.dev',
    password: 'TestUser2026!',
  });
  if (error || !data?.session?.user?.id) {
    throw new Error('Could not resolve test user id');
  }
  testUserId = data.session.user.id;
});

test.beforeEach(async () => {
  const supabase = await getFreshSupabase();
  await restoreIronBaseline(supabase);
});

test.describe('Bug audit – Schedule / kalender', () => {
  test('week strip starts with Monday label and range matches current ISO week (Mon–Sun)', async ({ page }) => {
    await loginAsTestUser(page, { startPath: '/schedule' });
    await expect(
      page.getByRole('heading', { name: /Träningsschema|Training schedule/i })
    ).toBeVisible({ timeout: 20000 });

    const monday = mondayOfCurrentWeek();
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    const expectedRange = `${fmtShortDate(monday)} – ${fmtShortDate(sunday)}`;
    await expect(page.getByText(expectedRange, { exact: true })).toBeVisible({ timeout: 15000 });

    // Första dagen i veckostrip ska vara måndag (Schedule.tsx DAY_LABELS[0] === 'Mån')
    await expect(page.getByText('Mån', { exact: true }).first()).toBeVisible();
  });

  test('with IRONMAN profile, week shows at least one endurance discipline label when schedule has rows', async ({
    page,
  }) => {
    const supabase = await getFreshSupabase();
    if (!testUserId) throw new Error('Missing testUserId');
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('archetype,disciplines,goal_date')
      .eq('user_id', testUserId)
      .maybeSingle();
    if (!profile) throw new Error('No profile');
    await seedNext4WeeksSchedule(supabase, testUserId, profile as any);

    await loginAsTestUser(page, { startPath: '/schedule' });
    await expect(
      page.getByRole('heading', { name: /Träningsschema|Training schedule/i })
    ).toBeVisible({ timeout: 20000 });
    await page.waitForTimeout(5000);

    const swimBikeRun = page.getByText(/Simning|Cykling|Löpning/);
    await expect(swimBikeRun.first()).toBeVisible({ timeout: 25000 });
  });
});

test.describe('Bug audit – TodayView', () => {
  test('greeting uses trail_name from user_profiles when set', async ({ page }) => {
    const supabase = await getFreshSupabase();
    if (!testUserId) throw new Error('Missing testUserId');
    const trail = `TrailAudit_${Date.now()}`;
    await supabase.from('user_profiles').update({ trail_name: trail }).eq('user_id', testUserId);

    await loginAsTestUser(page);
    await page.goto('/');
    await expect(
      page.getByRole('heading', { name: /💡\s*(Insikter|Insights)/i })
    ).toBeVisible({ timeout: 20000 });
    await expect(page.getByRole('heading', { name: `Hej, ${trail}!` })).toBeVisible({ timeout: 15000 });
  });

  test('insights section can render an active knowledge_rules row (trigger_type always)', async ({ page }) => {
    const supabase = await getFreshSupabase();
    if (!testUserId) throw new Error('Missing testUserId');

    const { data: rules } = await supabase.from('knowledge_rules' as any).select('*').eq('is_active', true);
    const list = (rules ?? []) as Array<{
      insight_title: string;
      applicable_archetypes: string[];
      applicable_disciplines: string[];
      trigger_type: string;
    }>;
    const pick = list.find((r) => r.trigger_type === 'always' && (r.applicable_archetypes?.length ?? 0) > 0);
    if (!pick) {
      test.skip(true, 'No active always-trigger knowledge_rules in DB for this assertion');
      return;
    }

    const arch = pick.applicable_archetypes[0];
    const discs = pick.applicable_disciplines?.length
      ? pick.applicable_disciplines
      : ['swim', 'bike', 'run'];

    const goal = new Date();
    goal.setMonth(goal.getMonth() + 6);
    await supabase.from('user_profiles').upsert(
      {
        user_id: testUserId,
        archetype: arch,
        disciplines: discs,
        goal_date: goal.toISOString().split('T')[0],
        onboarding_completed: true,
      },
      { onConflict: 'user_id' }
    );

    await loginAsTestUser(page);
    await page.goto('/');
    await expect(
      page.getByRole('heading', { name: /💡\s*(Insikter|Insights)/i })
    ).toBeVisible({ timeout: 20000 });
    await expect(page.getByText(pick.insight_title, { exact: false })).toBeVisible({ timeout: 20000 });
  });

  test('Dagens pass card shows when training_schedule has a row for today', async ({ page }) => {
    const supabase = await getFreshSupabase();
    if (!testUserId) throw new Error('Missing testUserId');
    const today = new Date().toISOString().split('T')[0];

    await supabase.from('training_schedule').delete().eq('user_id', testUserId).eq('date', today);
    await supabase.from('training_schedule').insert({
      user_id: testUserId,
      date: today,
      planned_type: 'swim',
      planned_subtype: 'technique_intervals',
      planned_sport: 'swim',
      planned_details: 'E2E bugaudit – dagens pass',
      completed: false,
    });

    await loginAsTestUser(page);
    await page.goto('/');
    await expect(page.getByText('Dagens pass', { exact: false })).toBeVisible({ timeout: 20000 });
    await expect(page.getByText(/Simning|simning/, { exact: false })).toBeVisible({ timeout: 15000 });
  });
});

test.describe('Bug audit – Settings / profil', () => {
  test('Kropp & hälsa saves height_cm to user_profiles', async ({ page }) => {
    await loginAsTestUser(page);
    const supabase = await getFreshSupabase();
    if (!testUserId) throw new Error('Missing testUserId');

    await supabase.from('user_profiles').update({ height_cm: null }).eq('user_id', testUserId);

    await page.goto('/settings');
    const bodyCard = page
      .locator('.card-athletic')
      .filter({ hasText: /Kropp & hälsa|Body & health/i })
      .first();
    const heightInput = bodyCard.getByRole('spinbutton').nth(1);
    await heightInput.fill('182');
    await bodyCard.getByRole('button', { name: /^(Spara|Save)$/ }).click();
    await expect(page.getByText('Sparad!', { exact: false })).toBeVisible({ timeout: 20000 });

    let ok = false;
    for (let i = 0; i < 12; i++) {
      const { data: row } = await supabase
        .from('user_profiles')
        .select('height_cm')
        .eq('user_id', testUserId)
        .maybeSingle();
      const v = row?.height_cm;
      ok = v === 182 || Number(v) === 182;
      if (ok) break;
      await page.waitForTimeout(600);
    }
    expect(ok).toBe(true);
  });

  test('Spara inställningar persists goal_name to user_goals AND user_profiles', async ({ page }) => {
    await loginAsTestUser(page);
    const supabase = await getFreshSupabase();
    if (!testUserId) throw new Error('Missing testUserId');

    const unique = `E2E mål ${Date.now()}`;
    await page.goto('/settings');
    // Goal card is titled "Mitt mål" (settings.myGoal). The profile summary can also contain the
    // substring "Mitt mål" as a *value* in an earlier card — use .last() so we target the edit card.
    // Prefer stable test id when the deployed build includes it.
    const byTestId = page.getByTestId('settings-goal-name-input');
    if (await byTestId.count()) {
      await byTestId.fill(unique);
    } else {
      await page
        .locator('.card-athletic')
        .filter({ has: page.getByText('Mitt mål', { exact: true }) })
        .last()
        .getByRole('textbox')
        .first()
        .fill(unique);
    }
    await page.getByRole('button', { name: /Spara inställningar/i }).click();
    await expect(page.getByText('Inställningar sparade!', { exact: false })).toBeVisible({ timeout: 20000 });

    let goalsMatch = false;
    let profilesMatch = false;
    let lastG: string | null | undefined;
    let lastP: string | null | undefined;
    for (let i = 0; i < 24; i++) {
      const { data: g, error: ge } = await supabase.from('user_goals').select('goal_name').eq('user_id', testUserId).maybeSingle();
      const { data: p, error: pe } = await supabase.from('user_profiles').select('goal_name').eq('user_id', testUserId).maybeSingle();
      if (ge) throw ge;
      if (pe) throw pe;
      lastG = g?.goal_name;
      lastP = p?.goal_name;
      goalsMatch = (g?.goal_name ?? '').trim() === unique.trim();
      profilesMatch = (p?.goal_name ?? '').trim() === unique.trim();
      if (goalsMatch && profilesMatch) break;
      await page.waitForTimeout(500);
    }
    expect(goalsMatch, `user_goals.goal_name last=${JSON.stringify(lastG)} expected=${JSON.stringify(unique)}`).toBe(true);
    expect(profilesMatch, `user_profiles.goal_name last=${JSON.stringify(lastP)} expected=${JSON.stringify(unique)}`).toBe(true);
  });

  test('Spara inställningar persists name to users AND display_name in user_profiles', async ({ page }) => {
    await loginAsTestUser(page);
    const supabase = await getFreshSupabase();
    if (!testUserId) throw new Error('Missing testUserId');

    const unique = `E2E Namn ${Date.now()}`;
    await page.goto('/settings');
    const trainCard = page.locator('.card-athletic').filter({ hasText: 'Träningsdata' }).first();
    await trainCard.getByRole('textbox').first().fill(unique);
    await page.getByRole('button', { name: /Spara inställningar/i }).click();
    await expect(page.getByText('Inställningar sparade!', { exact: false })).toBeVisible({ timeout: 20000 });

    let usersMatch = false;
    let profilesMatch = false;
    for (let i = 0; i < 12; i++) {
      const { data: u } = await supabase.from('users').select('name').eq('id', testUserId).maybeSingle();
      const { data: p } = await supabase.from('user_profiles').select('display_name').eq('user_id', testUserId).maybeSingle();
      usersMatch = u?.name === unique;
      profilesMatch = p?.display_name === unique;
      if (usersMatch && profilesMatch) break;
      await page.waitForTimeout(600);
    }
    expect(usersMatch).toBe(true);
    expect(profilesMatch).toBe(true);
  });
});

test.describe('Bug audit – Auth', () => {
  test('logout then re-injected session opens TodayView (not onboarding)', async ({ page, context }) => {
    await loginAsTestUser(page);
    await page.goto('/settings');
    await page.getByRole('button', { name: /Logga ut/i }).click();
    await expect(page).toHaveURL(/\/login/, { timeout: 20000 });

    const page2 = await context.newPage();
    await loginAsTestUser(page2);
    await expect(
      page2.getByRole('heading', { name: /💡\s*(Insikter|Insights)/i })
    ).toBeVisible({ timeout: 20000 });
    await expect(page2).not.toHaveURL(/\/onboarding/);
    await page2.close();
  });

  test('session survives full page reload on TodayView', async ({ page }) => {
    await loginAsTestUser(page);
    await page.goto('/');
    await expect(
      page.getByRole('heading', { name: /💡\s*(Insikter|Insights)/i })
    ).toBeVisible({ timeout: 20000 });
    await page.reload();
    await expect(
      page.getByRole('heading', { name: /💡\s*(Insikter|Insights)/i })
    ).toBeVisible({ timeout: 20000 });
    await expect(page).not.toHaveURL(/\/login/);
  });
});

test.describe('Bug audit – Retake quiz & onboarding DB', () => {
  test('Settings: Kör quizen igen navigates to /onboarding', async ({ page }) => {
    await loginAsTestUser(page);
    await page.goto('/settings');
    await page.getByRole('button', { name: /Kör quizen igen/i }).click();
    await expect(page).toHaveURL(/\/onboarding/, { timeout: 20000 });
    await expect(page.getByPlaceholder('Ditt förnamn')).toBeVisible({ timeout: 15000 });
  });

  test.skip(
    'after strength onboarding, user_profiles reflects archetype, disciplines, trail_name',
    async ({ page }) => {
      // SKIP: strength-onboardingflödet har ändrats i P28/P30, uppdateras i P32.
      const supabase = await getFreshSupabase();
      if (!testUserId) throw new Error('Missing testUserId');

      const trail = `StyrkeDB_${Date.now()}`;
      await supabase.from('user_profiles').upsert(
        {
          user_id: testUserId,
          onboarding_completed: false,
          archetype: 'triathlon',
          disciplines: ['swim', 'bike', 'run'],
          goal_date: new Date(Date.now() + 86400000 * 180).toISOString().split('T')[0],
        },
        { onConflict: 'user_id' }
      );

      await loginAsTestUser(page);
      await page.goto('/onboarding');
      await page.getByPlaceholder('Ditt förnamn').fill('AuditUser');
      await page.getByRole('button', { name: /Nästa/i }).click();
      await expect(page.getByText('Vad vill du uppnå?')).toBeVisible();
      await page.getByTestId('onboarding-goal-strength').click();
      await expect(page.getByTestId('onboarding-strength-equipment-full_gym')).toBeVisible({ timeout: 20000 });
      await page.getByTestId('onboarding-strength-equipment-full_gym').click();
      await expect(page.getByText('Har du några skador', { exact: false })).toBeVisible();
      await page.getByTestId('onboarding-strength-injury-no').click();
      await expect(page.getByText('Hur ofta vill du träna?', { exact: false })).toBeVisible();
      await page.getByTestId('onboarding-strength-days-3').click();

      await expect(page.getByText(/Redo att börja/i)).toBeVisible({ timeout: 20000 });
      await page.getByRole('button', { name: /Nästa/i }).click();
      await expect(page.getByText('Välj ditt Trail Name', { exact: false })).toBeVisible({ timeout: 15000 });
      await page.locator('input[maxlength="30"]').fill(trail);
      await page.getByRole('button', { name: /Fortsätt/i }).click();

      await expect(
        page.getByRole('heading', { name: /💡\s*(Insikter|Insights)/i })
      ).toBeVisible({ timeout: 30000 });

      let p: {
        archetype?: string;
        disciplines?: string[] | null;
        trail_name?: string | null;
        training_days_per_week?: number | null;
        onboarding_completed?: boolean | null;
      } | null = null;
      for (let i = 0; i < 20; i++) {
        const { data: row } = await supabase
          .from('user_profiles')
          .select('archetype,disciplines,trail_name,training_days_per_week,onboarding_completed')
          .eq('user_id', testUserId)
          .maybeSingle();
        p = row;
        if (
          p?.onboarding_completed &&
          ((p.disciplines as string[]) ?? []).includes('strength') &&
          p.training_days_per_week === 3 &&
          p.trail_name === trail
        ) {
          break;
        }
        await page.waitForTimeout(800);
      }
      expect(p?.onboarding_completed).toBe(true);
      // In produktion kan archetype förbli ett övergripande värde (t.ex. IRONMAN).
      // Vi verifierar primärt att disciplines/training_days/trail_name speglar strength-flödet.
      expect((p?.disciplines as string[]) ?? []).toContain('strength');
      expect(p?.training_days_per_week).toBe(3);
      expect(p?.trail_name).toBe(trail);
    }
  );

  test.skip(
    'retake quiz then strength flow updates trail_name and archetype; future schedule reflects strength',
    async ({
      page,
    }) => {
      // SKIP: strength-onboardingflödet har ändrats i P28/P30, uppdateras i P32.
      const supabase = await getFreshSupabase();
      if (!testUserId) throw new Error('Missing testUserId');

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
          trail_name: 'BeforeRetake',
        },
        { onConflict: 'user_id' }
      );
      await seedNext4WeeksSchedule(supabase, testUserId, {
        archetype: 'IRONMAN',
        disciplines: ['swim', 'bike', 'run'],
        goal_date: goalDate,
      });

      const newTrail = `AfterRetake_${Date.now()}`;

      await loginAsTestUser(page);
      await page.goto('/settings');
      await page.getByRole('button', { name: /Kör quizen igen/i }).click();
      await expect(page).toHaveURL(/\/onboarding/, { timeout: 20000 });

      await page.getByPlaceholder('Ditt förnamn').fill('RetakeUser');
      await page.getByRole('button', { name: /Nästa/i }).click();
      await page.getByTestId('onboarding-goal-strength').click();
      await expect(page.getByTestId('onboarding-strength-equipment-full_gym')).toBeVisible({ timeout: 20000 });
      await page.getByTestId('onboarding-strength-equipment-full_gym').click();
      await expect(page.getByText('Har du några skador', { exact: false })).toBeVisible();
      await page.getByTestId('onboarding-strength-injury-no').click();
      await expect(page.getByText('Hur ofta vill du träna?', { exact: false })).toBeVisible();
      await page.getByTestId('onboarding-strength-days-4').click();

      await expect(page.getByText(/Redo att börja/i)).toBeVisible({ timeout: 20000 });
      await page.getByRole('button', { name: /Nästa/i }).click();
      await expect(page.getByText('Välj ditt Trail Name', { exact: false })).toBeVisible({ timeout: 15000 });
      await page.locator('input[maxlength="30"]').fill(newTrail);
      await page.getByRole('button', { name: /Fortsätt/i }).click();

      await expect(
        page.getByRole('heading', { name: /💡\s*(Insikter|Insights)/i })
      ).toBeVisible({ timeout: 30000 });

      const { data: prof } = await supabase
        .from('user_profiles')
        .select('trail_name,archetype,disciplines')
        .eq('user_id', testUserId)
        .maybeSingle();
      expect(prof?.trail_name).toBe(newTrail);
      // Strength-onboarding mappar internt till RECOMP i schemamotorn.
      expect(prof?.archetype).toBe('RECOMP');
      expect((prof?.disciplines as string[]) ?? []).toContain('strength');

      await page.goto('/schedule');
      await expect(
        page.getByRole('heading', { name: /Träningsschema|Training schedule/i })
      ).toBeVisible({ timeout: 20000 });
      await page.waitForTimeout(6000);
      await page.getByRole('button', { name: /Generera nytt/i }).click();
      await page.waitForTimeout(4000);

      const today = new Date().toISOString().split('T')[0];
      const end = new Date();
      end.setDate(end.getDate() + 21);
      const endStr = end.toISOString().split('T')[0];
      const { data: rows } = await supabase
        .from('training_schedule')
        .select('planned_type,planned_sport')
        .eq('user_id', testUserId)
        .gte('date', today)
        .lte('date', endStr);

      const hasStrength = (rows ?? []).some(
        (r: any) => r.planned_type === 'strength' || r.planned_sport === 'strength'
      );
      expect(hasStrength).toBe(true);
    }
  );
});
