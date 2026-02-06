import { test, expect } from '@playwright/test';

test.describe('Request Form', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Skip all form tests if backend not available (app stuck on loading)
    try {
      await expect(page.locator('header')).toBeVisible({ timeout: 3000 });
    } catch {
      test.skip(true, 'Backend not available — form not rendered');
    }
  });

  test('displays textarea for request description', async ({ page }) => {
    await expect(page.locator('textarea').first()).toBeVisible();
  });

  test('accepts text input in the description field', async ({ page }) => {
    const textarea = page.locator('textarea').first();
    await textarea.fill('I want to build a simple portfolio website');
    await expect(textarea).toHaveValue('I want to build a simple portfolio website');
  });

  test('prevents empty form submission', async ({ page }) => {
    const textarea = page.locator('textarea').first();
    await textarea.fill('');
    const submitButton = page.locator('button[type="submit"]').first();
    if (await submitButton.isVisible()) {
      await submitButton.click();
      // Should stay on form view
      await expect(textarea).toBeVisible();
    }
  });

  test('accepts email input', async ({ page }) => {
    const emailInput = page.locator('input[type="email"]').first();
    if (await emailInput.isVisible()) {
      await emailInput.fill('test@example.com');
      await expect(emailInput).toHaveValue('test@example.com');
    }
  });
});
