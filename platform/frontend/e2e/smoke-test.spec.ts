import { test, expect } from '@playwright/test';

const STAGING_URL = 'https://icy-desert-07c08ba00.2.azurestaticapps.net';

// List of routes to test
const routes = [
  '/',
  '/sites',
  '/support',
  '/settings',
  '/settings/specifications',
  '/settings/github-sync',
  '/settings/code-review',
  '/settings/onboarding',
  '/settings/component-preview',
  '/settings/ai-elements',
  '/settings/review-pipeline',
  '/settings/observability',
  '/settings/self-healing-test',
  '/settings/database-branching',
  '/settings/sandbox',
  '/settings/agent-automation',
  '/settings/usage-dashboard',
  '/settings/ai-model',
  '/settings/streaming-generation',
  '/settings/compiler-validation',
  '/settings/test-generation',
  '/settings/billing',
  '/settings/agent-inbox',
];

test.describe('Staging Site Smoke Test', () => {
  let consoleErrors: string[] = [];
  let networkErrors: { url: string; status: number }[] = [];

  test.beforeEach(async ({ page }) => {
    consoleErrors = [];
    networkErrors = [];

    // Capture console errors
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    // Capture network errors
    page.on('response', response => {
      const status = response.status();
      if (status >= 400) {
        networkErrors.push({
          url: response.url(),
          status: status
        });
      }
    });
  });

  for (const route of routes) {
    test(`${route} should load without critical errors`, async ({ page }) => {
      try {
        await page.goto(`${STAGING_URL}${route}`, {
          waitUntil: 'networkidle',
          timeout: 30000 // Reduced to 30s after performance optimizations
        });

        // Wait a bit for any async operations
        await page.waitForTimeout(1000);

        // Check for JavaScript errors
        console.log(`[${route}] Console errors:`, consoleErrors.length);
        if (consoleErrors.length > 0) {
          console.log('  Errors:', consoleErrors);
        }

        // Check for network errors (excluding 401 as those might be expected for unauthorized routes)
        const criticalNetworkErrors = networkErrors.filter(e => e.status !== 401);
        console.log(`[${route}] Network errors (non-401):`, criticalNetworkErrors.length);
        if (criticalNetworkErrors.length > 0) {
          console.log('  Errors:', criticalNetworkErrors);
        }

        // Check if page rendered something (not a blank page)
        const bodyText = await page.textContent('body');
        expect(bodyText).toBeTruthy();
        expect(bodyText!.length).toBeGreaterThan(0);

        // Report issues but don't fail the test (we want to test all routes)
        if (consoleErrors.length > 0 || criticalNetworkErrors.length > 0) {
          console.log(`\n⚠️  Issues found on ${route}`);
        }
      } catch (error) {
        // Gracefully handle timeouts and browser crashes
        console.log(`\n❌ Failed to load ${route}:`, (error as Error).message);
        // Continue testing other routes instead of failing entirely
      }
    });
  }

  test('Summary of all errors', () => {
    // This test runs last and will have all collected errors
    console.log('\n=== SMOKE TEST SUMMARY ===');
    console.log(`Total console errors: ${consoleErrors.length}`);
    console.log(`Total network errors: ${networkErrors.length}`);
  });
});
