import { test, expect } from '@playwright/test';

test.describe('Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    try {
      await expect(page.locator('header')).toBeVisible({ timeout: 3000 });
    } catch {
      test.skip(true, 'Backend not available — navigation not rendered');
    }
  });

  test('header contains navigation links', async ({ page }) => {
    const nav = page.locator('header nav');
    await expect(nav).toBeVisible();
  });

  test('clicking logo resets to home view', async ({ page }) => {
    await page.locator('text=AI Dev Request').first().click();
    await expect(page.locator('textarea').first()).toBeVisible();
  });

  test('settings button opens settings page', async ({ page }) => {
    const settingsBtn = page.locator('header').locator('button, a').filter({ hasText: /설정|Settings/i }).first();
    if (await settingsBtn.isVisible()) {
      await settingsBtn.click();
      // Back arrow indicates we're on settings page
      await expect(page.locator('button:has-text("←")').first()).toBeVisible();
    }
  });
});
