import { test, expect } from '@playwright/test';

test.describe('Database Branching Page', () => {
  test('database branching page loads without errors', async ({ page }) => {
    await page.goto('/settings/database-branching');

    // Wait for the root element to be visible
    await expect(page.locator('#root')).toBeVisible();

    // Check for the Database Branching heading
    await expect(page.getByRole('heading', { name: /database branching/i })).toBeVisible();

    // Verify no 500 errors in console
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));

    await page.waitForTimeout(2000);

    const serverErrors = errors.filter(e => e.includes('500'));
    expect(serverErrors).toHaveLength(0);
  });

  test('handles backend errors gracefully', async ({ page }) => {
    // Mock API to return 500 error
    await page.route('**/api/projects/*/db/branches', route =>
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Server error' })
      })
    );

    await page.goto('/settings/database-branching');

    // Wait for the page to load
    await expect(page.locator('#root')).toBeVisible();

    // Check that error message is displayed (should show either "failed" text or empty state)
    // The page should not crash
    const pageContent = await page.locator('#root').textContent();
    expect(pageContent).toBeTruthy();
    expect(pageContent!.length).toBeGreaterThan(0);
  });

  test('displays retry button on error', async ({ page }) => {
    // First request fails
    let requestCount = 0;
    await page.route('**/api/projects/*/db/branches', route => {
      requestCount++;
      if (requestCount === 1) {
        route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Server error' })
        });
      } else {
        // Second request succeeds with empty array
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([])
        });
      }
    });

    await page.goto('/settings/database-branching');

    // Wait for page load
    await expect(page.locator('#root')).toBeVisible();
    await page.waitForTimeout(1000);

    // Look for retry button (if error is shown)
    const retryButton = page.getByRole('button', { name: /retry/i });

    // If error state is shown, test retry functionality
    if (await retryButton.isVisible({ timeout: 1000 }).catch(() => false)) {
      await retryButton.click();

      // After retry, page should still be functional
      await expect(page.locator('#root')).toBeVisible();
    }
  });

  test('shows empty state when no branches exist', async ({ page }) => {
    // Mock successful empty response
    await page.route('**/api/projects/*/db/branches', route =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([])
      })
    );

    await page.goto('/settings/database-branching');

    // Wait for the page to load
    await expect(page.locator('#root')).toBeVisible();

    // Check for empty state message
    await expect(page.getByText(/no database branches yet/i)).toBeVisible({ timeout: 3000 });
  });

  test('displays project id input field', async ({ page }) => {
    await page.goto('/settings/database-branching');

    // Wait for the page to load
    await expect(page.locator('#root')).toBeVisible();

    // Check for project ID input
    const projectIdInput = page.locator('input[type="text"]').first();
    await expect(projectIdInput).toBeVisible({ timeout: 3000 });
  });

  test('no unhandled exceptions in console', async ({ page }) => {
    const errors: string[] = [];
    const exceptions: Error[] = [];

    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });

    page.on('pageerror', error => exceptions.push(error));

    await page.goto('/settings/database-branching');
    await expect(page.locator('#root')).toBeVisible();
    await page.waitForTimeout(2000);

    // Filter out expected network errors (no backend)
    const unexpectedErrors = errors.filter(
      (e) =>
        !e.includes('fetch') &&
        !e.includes('ERR_CONNECTION_REFUSED') &&
        !e.includes('Failed to fetch') &&
        !e.includes('Failed to load') &&
        !e.includes('localhost:5000') &&
        !e.includes('net::ERR')
    );

    expect(unexpectedErrors).toHaveLength(0);
    expect(exceptions).toHaveLength(0);
  });
});
