import { test, expect } from '@playwright/test';
import { loginAsTestUser } from './loginTestUser';

test.describe.configure({ mode: 'serial' });

test.describe('Theme – default and persistence', () => {

  test('new user (no theme in localStorage) gets dark theme by default', async ({ page }) => {
    await page.addInitScript(() => { localStorage.removeItem('theme'); });
    await loginAsTestUser(page, { startPath: '/' });
    await expect(page.locator('html')).toHaveClass(/dark/);
  });

  test('clicking Ljust in Settings removes dark class and persists to localStorage', async ({ page }) => {
    await page.addInitScript(() => { localStorage.removeItem('theme'); });
    await loginAsTestUser(page, { startPath: '/settings' });
    await page.getByTestId('theme-light').click();
    await expect(page.locator('html')).not.toHaveClass(/dark/);
    const stored = await page.evaluate(() => localStorage.getItem('theme'));
    expect(stored).toBe('light');
  });

  test('light theme persists across a full page reload', async ({ page }) => {
    await page.addInitScript(() => { localStorage.setItem('theme', 'light'); });
    await loginAsTestUser(page, { startPath: '/' });
    await expect(page.locator('html')).not.toHaveClass(/dark/);
    await page.reload({ waitUntil: 'domcontentloaded' });
    await expect(page.locator('html')).not.toHaveClass(/dark/);
  });

});
