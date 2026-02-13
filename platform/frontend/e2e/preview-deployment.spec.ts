import { test, expect } from '@playwright/test'

test.describe('Preview Page (Code Preview)', () => {
  test('displays code preview page title', async ({ page }) => {
    await page.goto('/preview')

    // The /preview route renders PreviewPage which shows "Code Preview" as h2 heading
    const title = page.locator('h2', { hasText: /code preview/i })
    await expect(title).toBeVisible({ timeout: 10000 })
  })

  test('shows sample preview when no requestId is provided', async ({ page }) => {
    await page.goto('/preview')

    // Without a requestId, the page loads sample project files
    // and shows a "Sample Preview" notice
    await expect(page.getByText(/sample preview/i)).toBeVisible({ timeout: 10000 })
  })
})
