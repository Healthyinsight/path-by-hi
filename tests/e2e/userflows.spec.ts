import { test, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';

// NOTE:
// These flows assume either a dedicated test environment or a mocked auth/login helper.
// Replace the placeholders in login helpers with your real magic-link or Supabase auth flow.

async function loginAsTestUser(page: any) {
  const supabase = createClient(
    'https://sbfkoeozczzgyvakxozh.supabase.co',
    process.env.VITE_SUPABASE_ANON_KEY ?? ''
  );
  const { data } = await supabase.auth.signInWithPassword({
    email: 'test@pathtracker.dev',
    password: 'TestUser2026!',
  });
  await page.goto('/');
  await page.evaluate((session: any) => {
    if (session) {
      localStorage.setItem(
        'sb-sbfkoeozczzgyvakxozh-auth-token',
        JSON.stringify(session)
      );
    }
  }, data.session);
  await page.reload();
  await page.waitForTimeout(800);
}

test.describe('Onboarding – triathlon user', () => {
  test('should complete triathlon onboarding flow', async ({ page }) => {
    await loginAsTestUser(page);

    // Archetype: Triathlon
    await expect(page.getByText('Vad vill du uppnå?')).toBeVisible();
    await page.getByText('Triathlon / Ironman', { exact: false }).click();

    // Tri distance
    await expect(page.getByText('Vilken distans siktar du på?')).toBeVisible();
    await page.getByText('Halv Ironman', { exact: false }).click().catch(() => {
      // fallback: click Ironman 70.3 option if copy differs
      page.getByText('Ironman 70.3', { exact: false }).click();
    });

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
    await loginAsTestUser(page);

    await expect(page.getByText('Vad vill du uppnå?')).toBeVisible();
    await page.getByText('Bli starkare', { exact: false }).click();

    await expect(page.getByText('Vad har du tillgång till?', { exact: false })).toBeVisible();
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
  test('should regenerate schedule with at least one non-rest day', async ({ page }) => {
    await loginAsTestUser(page);

    await page.goto('/schedule');
    await page.getByRole('button', { name: /Generera nytt/i }).click();

    // Wait for schedule cards to appear
    const weekStrip = page.getByText('Träningsschema', { exact: false });
    await expect(weekStrip).toBeVisible();

    // Look for at least one cell in the upcoming week that is not rest
    const nonRest = page.locator('button', { hasText: 'Styrka' }).first()
      .or(page.locator('button', { hasText: 'Löpning' }).first())
      .or(page.locator('button', { hasText: 'Cykling' }).first())
      .or(page.locator('button', { hasText: 'Simning' }).first());

    await expect(nonRest).toBeVisible();
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

    const weightInput = page.getByLabel('Vikt (kg)', { exact: false });
    await weightInput.fill('');
    await weightInput.fill('75');

    await page.getByRole('button', { name: /^Spara inställningar$/i }).click();

    // Expect success toast
    await expect(page.getByText('Inställningar sparade', { exact: false })).toBeVisible();
  });
});

