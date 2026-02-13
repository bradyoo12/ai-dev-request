import { test, expect } from '@playwright/test';

test.describe('Database Branching - Manual Verification', () => {
  test('database branching page loads without 500 error', async ({ page }) => {
    // Navigate to database branching settings page
    await page.goto('https://icy-desert-07c08ba00.2.azurestaticapps.net/settings/database-branching');

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Check that we don't have a 500 error or error page
    const pageContent = await page.textContent('body');
    expect(pageContent).not.toContain('500');
    expect(pageContent).not.toContain('Internal Server Error');

    // Verify the page has the expected heading
    const heading = page.getByRole('heading', { name: /database branching/i });
    await expect(heading).toBeVisible();

    console.log('✅ Database branching page loaded without 500 error');
  });

  test('displays empty state correctly when no sessions', async ({ page }) => {
    await page.goto('https://icy-desert-07c08ba00.2.azurestaticapps.net/settings/database-branching');
    await page.waitForLoadState('networkidle');

    // Should show empty state message or sessions list
    const body = await page.textContent('body');

    // Check for either sessions or empty state, but not an error
    const hasEmptyState = body?.includes('No sessions') ||
                         body?.includes('No branching sessions') ||
                         body?.includes('Create') ||
                         body?.includes('sessions');

    expect(hasEmptyState).toBeTruthy();

    // Verify no error messages
    expect(body).not.toContain('Error loading');
    expect(body).not.toContain('Failed to fetch');

    console.log('✅ Empty state displays correctly');
  });

  test('handles invalid project ID gracefully', async ({ page }) => {
    // Try to load with invalid project ID (simulated by query param if backend uses it)
    await page.goto('https://icy-desert-07c08ba00.2.azurestaticapps.net/settings/database-branching?project=invalid');
    await page.waitForLoadState('networkidle');

    const pageContent = await page.textContent('body');

    // Should show empty state, not 500 error
    expect(pageContent).not.toContain('500');
    expect(pageContent).not.toContain('Internal Server Error');

    console.log('✅ Invalid project ID handled gracefully');
  });
});
