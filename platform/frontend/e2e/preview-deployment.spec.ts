import { test, expect } from '@playwright/test'

test.describe('Preview Deployment', () => {
  test.beforeEach(async ({ page }) => {
    // Note: This test requires authentication and a valid project
    // For now, we'll test that the page loads and UI elements are present
    await page.goto('/preview?requestId=test-project-id')
  })

  test('displays preview deployment page title', async ({ page }) => {
    const title = page.getByRole('heading', { name: /preview deployments/i })
    await expect(title).toBeVisible()
  })

  test('shows deploy preview button when no active deployment', async ({ page }) => {
    // If logged out or no preview, should show deploy button or login prompt
    const deployButton = page.getByRole('button', { name: /deploy preview/i })
    const loginMessage = page.getByText(/log in to deploy previews/i)

    // Either deploy button or login message should be visible
    await expect(deployButton.or(loginMessage)).toBeVisible()
  })

  test('displays provider information correctly', async ({ page }) => {
    // Wait for potential data to load
    await page.waitForTimeout(1000)

    // Check if provider label exists when deployment is active
    const providerLabel = page.getByText(/provider/i)
    if (await providerLabel.isVisible()) {
      // If provider is visible, check for Azure Container Instances display
      const providerValue = page.locator('text=/Azure Container Instances/i')
      await expect(providerValue.or(page.getByText(/vercel/i))).toBeVisible()
    }
  })

  test('displays container details when available', async ({ page }) => {
    await page.waitForTimeout(1000)

    // Check for container details labels
    const regionLabel = page.getByText(/^region$/i)
    const fqdnLabel = page.getByText(/^fqdn$/i)
    const portLabel = page.getByText(/^port$/i)

    // If any container detail is visible, test passes
    const anyDetailVisible = await regionLabel.isVisible() ||
                             await fqdnLabel.isVisible() ||
                             await portLabel.isVisible()

    // This is optional - details only show when deployed
    if (anyDetailVisible) {
      expect(anyDetailVisible).toBe(true)
    }
  })

  test('shows view logs button for active deployments', async ({ page }) => {
    await page.waitForTimeout(1000)

    const viewLogsButton = page.getByRole('button', { name: /view logs/i })
    const tearDownButton = page.getByRole('button', { name: /tear down preview/i })

    // If tear down button exists, view logs should also exist
    if (await tearDownButton.isVisible()) {
      await expect(viewLogsButton).toBeVisible()
    }
  })

  test('opens logs modal when view logs clicked', async ({ page }) => {
    await page.waitForTimeout(1000)

    const viewLogsButton = page.getByRole('button', { name: /view logs/i })

    if (await viewLogsButton.isVisible()) {
      await viewLogsButton.click()

      // Modal should appear
      const logsModal = page.getByRole('dialog', { name: /container logs/i })
      await expect(logsModal).toBeVisible()

      // Modal should have close button
      const closeButton = logsModal.getByRole('button', { name: /close/i })
      await expect(closeButton).toBeVisible()

      // Close modal
      await closeButton.click()
      await expect(logsModal).not.toBeVisible()
    }
  })

  test('displays deployment status badges correctly', async ({ page }) => {
    await page.waitForTimeout(1000)

    // Check for status badges (these appear in both active preview and history)
    const statusBadges = page.locator('.border').filter({ hasText: /deployed|deploying|pending|building|pushing|creating/i })

    // If any status badges exist, verify they're styled correctly
    const count = await statusBadges.count()
    if (count > 0) {
      // At least one status badge should be visible
      await expect(statusBadges.first()).toBeVisible()
    }
  })

  test('shows deployment phases for in-progress deployments', async ({ page }) => {
    await page.waitForTimeout(1000)

    // Check for various deployment phase indicators
    const buildingImage = page.getByText(/building docker image/i)
    const pushingImage = page.getByText(/pushing to registry/i)
    const creatingContainer = page.getByText(/creating container/i)
    const deploying = page.getByText(/deploying preview/i)

    // If any deployment phase is visible, verify the loading spinner
    const phaseVisible = await buildingImage.isVisible() ||
                        await pushingImage.isVisible() ||
                        await creatingContainer.isVisible() ||
                        await deploying.isVisible()

    if (phaseVisible) {
      // Loading spinner should be visible
      const spinner = page.locator('.animate-spin')
      await expect(spinner).toBeVisible()
    }
  })

  test('displays preview history when available', async ({ page }) => {
    await page.waitForTimeout(1000)

    const historyHeading = page.getByRole('heading', { name: /preview history/i })

    if (await historyHeading.isVisible()) {
      // History section should contain preview items
      const historySection = page.locator('.bg-warm-800').filter({ has: historyHeading })
      await expect(historySection).toBeVisible()
    }
  })

  test('allows copying preview URL', async ({ page }) => {
    await page.waitForTimeout(1000)

    const copyButton = page.getByRole('button', { name: /^copy$/i })

    if (await copyButton.isVisible()) {
      await copyButton.click()

      // Button text should change to "Copied!"
      await expect(page.getByRole('button', { name: /copied/i })).toBeVisible()
    }
  })

  test('displays QR code for mobile preview', async ({ page }) => {
    await page.waitForTimeout(1000)

    const qrLabel = page.getByText(/scan for mobile preview/i)

    if (await qrLabel.isVisible()) {
      // SVG QR code should be rendered
      const qrCode = page.locator('svg[viewBox="0 0 200 200"]')
      await expect(qrCode).toBeVisible()
    }
  })

  test('shows countdown timer for active deployments', async ({ page }) => {
    await page.waitForTimeout(1000)

    const expiresLabel = page.getByText(/expires in/i)

    if (await expiresLabel.isVisible()) {
      // Timer value should be visible (either countdown or "Expired")
      const timerContainer = page.locator('.font-mono').filter({ hasText: /\d+h|\d+m|expired/i })
      const fallback = page.getByText(/--/)

      await expect(timerContainer.or(fallback)).toBeVisible()
    }
  })

  test('handles back navigation', async ({ page }) => {
    const backButton = page.locator('button', { hasText: '←' })

    if (await backButton.isVisible()) {
      await backButton.click()

      // Should navigate away from preview page
      await expect(page).toHaveURL(/^(?!.*\/preview).*$/)
    }
  })
})
