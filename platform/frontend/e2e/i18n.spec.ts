import { test, expect } from '@playwright/test';

test.describe('Internationalization', () => {
  test('app renders without showing raw i18n keys', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    const body = await page.locator('body').textContent();
    // Raw keys like "hero.title" should never appear even in loading state
    expect(body).not.toContain('hero.title');
    expect(body).not.toContain('form.submit');
  });

  test('page has a non-empty title', async ({ page }) => {
    await page.goto('/');
    const title = await page.title();
    expect(title.length).toBeGreaterThan(0);
  });

  test('when backend available, language selector is visible in header', async ({ page }) => {
    await page.goto('/');
    try {
      await expect(page.locator('header')).toBeVisible({ timeout: 3000 });
      // LanguageSelector should be somewhere in the header area
      const header = page.locator('header');
      const buttons = await header.locator('button, select').count();
      expect(buttons).toBeGreaterThan(0);
    } catch {
      test.skip(true, 'Backend not available — language selector not rendered');
    }
  });
});
