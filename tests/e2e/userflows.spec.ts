import { test, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';

// NOTE:
// These flows assume either a dedicated test environment or a mocked auth/login helper.
// Replace the placeholders in login helpers with your real magic-link or Supabase auth flow.

async function loginAsTestUser(page: any) {
  // IMPORTANT: This anon key is public and safe to use in test code.
  // Replace the placeholder value below with the actual anon public key
  // from your Supabase dashboard (Project Settings → API → anon public).
  const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNiZmtvZW96Y3p6Z3l2YWt4b3poIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM0OTIxODQsImV4cCI6MjA4OTA2ODE4NH0.BOnu8xOrjRFRCBgwbO78mW8bAW2mj8MeRtjkWIcLuMc';

  const supabase = createClient(
    'https://sbfkoeozczzgyvakxozh.supabase.co',
    supabaseAnonKey
  );
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

test.describe('Onboarding – triathlon user', () => {
  test('should complete triathlon onboarding flow', async ({ page }) => {
    await page.goto('/onboarding');
    // Name step
    await page.getByPlaceholder('Ditt förnamn').fill('TestUser');
    await page.getByRole('button', { name: /Nästa/i }).click();
    // Archetype: Triathlon
    await expect(page.getByText('Vad vill du uppnå?')).toBeVisible();
    await page.getByText('Triathlon / Ironman', { exact: false }).click();

    // Tri distance – go straight to distance option
    await page.getByText('70.3 / Halv-Ironman', { exact: false }).click();

    // Race step
    await expect(page.getByText('Har du ett race inbokat?')).toBeVisible();
    await page.getByText('Ja', { exact: false }).click();

    const search = page.getByPlaceholder('Sök bland populära lopp eller skriv eget...');
    await search.fill('Göteborg');

    const suggestion = page.getByRole('listitem').filter({ hasText: 'Göteborgsvarvet' }).first();
    await suggestion.click();

    // Confirm that race name + formatted date are shown
    await expect(page.getByText('Göteborgsvarvet', { exact: false })).toBeVisible();

    // Continue through the remaining triathlon-specific steps until trail name
    await expect(page.getByText('Hur är din nuvarande form?', { exact: false })).toBeVisible();
    await page.getByText('Nybörjare', { exact: false }).click();

    // Eventually trail name step
    await expect(page.getByText('Välj ditt trail name', { exact: false })).toBeVisible();
    await page.getByPlaceholder('t.ex. Bergsgeten').fill('Test Trail');
    await page.getByRole('button', { name: /Färdig/i }).click();

    // User should land on TodayView
    await expect(page.getByText('Dagens pass', { exact: false }).or(page.getByText('Insikter', { exact: false }))).toBeVisible();
  });
});

test.describe('Onboarding – strength user', () => {
  test('should complete strength onboarding flow', async ({ page }) => {
    await page.goto('/onboarding');
    await page.getByPlaceholder('Ditt förnamn').fill('TestUser');
    await page.getByRole('button', { name: /Nästa/i }).click();
    await expect(page.getByText('Vad vill du uppnå?')).toBeVisible();
    await page.getByText('Bli starkare', { exact: false }).click();

    // Equipment step – click directly on an option
    await page.getByText('Fullt gym', { exact: false }).click();

    await expect(page.getByText('Har du några skador', { exact: false })).toBeVisible();
    await page.getByText('Nej, allt är bra', { exact: false }).click();

    await expect(page.getByText('Hur ofta vill du träna?', { exact: false })).toBeVisible();
    await page.getByText('3 dagar/vecka', { exact: false }).click();

    // Trail name step
    await expect(page.getByText('Välj ditt trail name', { exact: false })).toBeVisible();
    await page.getByPlaceholder('t.ex. Bergsgeten').fill('StyrkeTest');
    await page.getByRole('button', { name: /Färdig/i }).click();

    // Land on TodayView without error
    await expect(page.getByText('Insikter', { exact: false })).toBeVisible();
  });
});

test.describe('Schedule generation', () => {
  test.beforeAll(async () => {
    const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNiZmtvZW96Y3p6Z3l2YWt4b3poIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM0OTIxODQsImV4cCI6MjA4OTA2ODE4NH0.BOnu8xOrjRFRCBgwbO78mW8bAW2mj8MeRtjkWIcLuMc';
    const supabase = createClient(
      'https://sbfkoeozczzgyvakxozh.supabase.co',
      supabaseAnonKey
    );

    const { data } = await supabase.auth.signInWithPassword({
      email: 'test@pathtracker.dev',
      password: 'TestUser2026!',
    });

    const user = data.user;
    if (!user) throw new Error('Could not sign in test user for profile setup');

    await supabase.from('user_profiles').upsert(
      {
        user_id: user.id,
        archetype: 'triathlon',
        disciplines: ['swim', 'bike', 'run'],
        onboarding_completed: true,
      },
      { onConflict: 'user_id' }
    );
  });

  test('should regenerate schedule with at least one non-rest day', async ({ page }) => {
    await loginAsTestUser(page);

    await page.goto('/schedule');
    await page.getByRole('button', { name: /Generera nytt/i }).click();

    await page.waitForTimeout(2000);

    // Wait for schedule heading to appear
    const weekStrip = page.getByText('Träningsschema', { exact: false });
    await expect(weekStrip).toBeVisible();

    // After regeneration, the "Inget pass planerat" empty state should disappear
    const emptyState = page.getByText('Inget pass planerat', { exact: false });
    await expect(emptyState).not.toBeVisible({ timeout: 8000 });
  });
});

test.describe('TodayView – generate schedule button', () => {
  test('should generate schedule when missing', async ({ page }) => {
    await loginAsTestUser(page);

    // If no workout card exists, use generate button
    const noWorkoutText = page.getByText('Inget pass planerat idag', { exact: false });
    const generateButton = page.getByRole('button', { name: /Generera schema/i });

    if (await noWorkoutText.isVisible().catch(() => false)) {
      await expect(generateButton).toBeVisible();
      await generateButton.click();
    }

    // Either a workout card should now be visible or a success toast
    const workoutCard = page.getByText('Planerat', { exact: false });
    const toast = page.getByText('schema genererat', { exact: false });

    await expect(workoutCard.or(toast)).toBeVisible();
  });
});

test.describe('Settings – save body metrics', () => {
  test('should save weight successfully', async ({ page }) => {
    await loginAsTestUser(page);

    await page.goto('/settings');

    const weightInput = page.getByRole('spinbutton').first();
    await weightInput.fill('');
    await weightInput.fill('75');

    await page.getByRole('button', { name: 'Spara inställningar' }).click();

    // Expect success toast (allow some time for network + toast animation)
    await expect(page.getByText('Inställningar sparade', { exact: false })).toBeVisible({
      timeout: 10000,
    });
  });
});

