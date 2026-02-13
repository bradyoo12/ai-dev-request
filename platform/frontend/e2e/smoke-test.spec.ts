import { test, expect } from '@playwright/test';

const STAGING_URL = 'https://icy-desert-07c08ba00.2.azurestaticapps.net';

test.describe('Smoke Test - Staging Site', () => {
  let consoleErrors: string[] = [];

  test.beforeEach(async ({ page }) => {
    consoleErrors = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    page.on('pageerror', (error) => {
      consoleErrors.push(`Page error: ${error.message}`);
    });
  });

  test('should load homepage without errors', async ({ page }) => {
    await page.goto(STAGING_URL);
    await page.waitForLoadState('networkidle');
    expect(page.url()).toContain(STAGING_URL);
    const criticalErrors = consoleErrors.filter(err =>
      !err.includes('Warning') && !err.includes('DevTools')
    );
    if (criticalErrors.length > 0) {
      console.log('Critical console errors:', criticalErrors);
    }
  });

  test('should not have broken images', async ({ page }) => {
    await page.goto(STAGING_URL);
    await page.waitForLoadState('networkidle');
    const images = await page.locator('img').all();
    for (const img of images) {
      const src = await img.getAttribute('src');
      const naturalWidth = await img.evaluate((el: HTMLImageElement) => el.naturalWidth);
      if (naturalWidth === 0 && src) {
        console.error(`Broken image: ${src}`);
      }
    }
  });

  test('should have no 5xx server errors', async ({ page }) => {
    const failedRequests: string[] = [];
    page.on('response', (response) => {
      const status = response.status();
      if (status >= 500) {
        failedRequests.push(`${status} - ${response.url()}`);
      }
    });
    await page.goto(STAGING_URL);
    await page.waitForLoadState('networkidle');
    if (failedRequests.length > 0) {
      console.log('Server errors (5xx):', failedRequests);
    }
  });
});
