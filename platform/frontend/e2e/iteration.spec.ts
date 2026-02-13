import { test, expect } from '@playwright/test'

/**
 * E2E Tests for Iterative Code Refinement (#528)
 *
 * These tests validate the chat-based iterative refinement feature.
 *
 * Prerequisites:
 * - Backend API endpoints must be implemented and running
 * - Test user must have sufficient token balance
 * - Test project/request must exist with ID known to tests
 */

test.describe('Iterative Code Refinement', () => {
  // TODO: Replace with actual test request ID after backend integration
  const TEST_REQUEST_ID = 'test-request-123'
  const REFINEMENT_URL = `/requests/${TEST_REQUEST_ID}/refine`

  test.beforeEach(async ({ page }) => {
    // TODO: Set up authentication and test data
    // - Log in test user
    // - Ensure test user has tokens
    // - Create or use existing test project
  })

  test.describe('Page Load and Layout', () => {
    test('should load iterative refinement page', async ({ page }) => {
      // TODO: Implement after backend is ready
      await page.goto(REFINEMENT_URL)

      // Verify page title
      await expect(page.locator('h1')).toContainText('Iterative Code Refinement')

      // Verify split view panels exist
      await expect(page.locator('[data-testid="chat-panel"]')).toBeVisible()
      await expect(page.locator('[data-testid="code-panel"]')).toBeVisible()
      await expect(page.locator('[data-testid="preview-panel"]')).toBeVisible()
    })

    test('should show empty state when no chat history', async ({ page }) => {
      // TODO: Implement after backend is ready
      await page.goto(REFINEMENT_URL)

      await expect(page.getByText('Start refining your project')).toBeVisible()
      await expect(page.getByText('Make the header sticky')).toBeVisible()
    })

    test('should toggle between layout modes', async ({ page }) => {
      // TODO: Implement after backend is ready
      await page.goto(REFINEMENT_URL)

      // Click "Chat Only" button
      await page.click('button:has-text("Chat Only")')
      await expect(page.locator('[data-testid="code-panel"]')).not.toBeVisible()

      // Click "Split View" button
      await page.click('button:has-text("Split View")')
      await expect(page.locator('[data-testid="code-panel"]')).toBeVisible()

      // Click "Code Only" button
      await page.click('button:has-text("Code Only")')
      await expect(page.locator('[data-testid="chat-panel"]')).not.toBeVisible()
    })
  })

  test.describe('Chat Interaction', () => {
    test('should send iteration message and display response', async ({ page }) => {
      // TODO: Implement after backend is ready
      await page.goto(REFINEMENT_URL)

      // Type message in chat input
      const chatInput = page.locator('textarea[placeholder*="Describe the changes"]')
      await chatInput.fill('Make the header sticky')

      // Click send button
      await page.click('button:has-text("Send")')

      // Verify user message appears
      await expect(page.locator('.bg-blue-600:has-text("Make the header sticky")')).toBeVisible()

      // Verify typing indicator appears
      await expect(page.getByText('AI is thinking...')).toBeVisible()

      // Wait for assistant response (with timeout for AI generation)
      await expect(page.locator('.bg-warm-800:has-text("header")')).toBeVisible({ timeout: 15000 })

      // Verify typing indicator disappears
      await expect(page.getByText('AI is thinking...')).not.toBeVisible()
    })

    test('should show file change indicators', async ({ page }) => {
      // TODO: Implement after backend is ready
      // This test requires backend to return file changes

      await page.goto(REFINEMENT_URL)
      await page.locator('textarea').fill('Add dark mode toggle')
      await page.click('button:has-text("Send")')

      // Wait for response with file changes
      await page.waitForSelector('.bg-warm-800', { timeout: 15000 })

      // Verify file change summary
      await expect(page.getByText(/\d+ modified/)).toBeVisible()

      // Verify file list with operation badges
      await expect(page.locator('text=/[M+-]/')).toBeVisible()
    })

    test('should handle insufficient tokens error', async ({ page }) => {
      // TODO: Implement after backend is ready
      // Requires test user with 0 tokens or backend mock

      await page.goto(REFINEMENT_URL)
      await page.locator('textarea').fill('Make changes')
      await page.click('button:has-text("Send")')

      // Verify error message appears
      await expect(page.getByText(/Insufficient tokens/)).toBeVisible()

      // Verify user message was not added
      await expect(page.locator('.bg-blue-600:has-text("Make changes")')).not.toBeVisible()
    })

    test('should use suggestion buttons', async ({ page }) => {
      // TODO: Implement after backend is ready
      await page.goto(REFINEMENT_URL)

      // Click suggestion button
      await page.click('button:has-text("Make the header sticky")')

      // Verify input is filled
      await expect(page.locator('textarea')).toHaveValue('Make the header sticky')

      // Could also auto-send - verify behavior once implemented
    })
  })

  test.describe('Accept/Revert Workflow', () => {
    test('should accept file changes', async ({ page }) => {
      // TODO: Implement after backend is ready
      await page.goto(REFINEMENT_URL)

      // Send message that generates file changes
      await page.locator('textarea').fill('Change primary color to blue')
      await page.click('button:has-text("Send")')

      // Wait for response with changes
      await page.waitForSelector('button:has-text("Accept Changes")', { timeout: 15000 })

      // Click Accept Changes button
      await page.click('button:has-text("Accept Changes")')

      // Verify "Applying..." loading state
      await expect(page.getByText('Applying...')).toBeVisible()

      // Verify "Applied" badge appears
      await expect(page.getByText('Applied')).toBeVisible({ timeout: 5000 })

      // Verify Accept button is replaced with badge
      await expect(page.locator('button:has-text("Accept Changes")')).not.toBeVisible()
    })

    test('should revert file changes', async ({ page }) => {
      // TODO: Implement after backend is ready
      await page.goto(REFINEMENT_URL)

      // Send message and wait for changes
      await page.locator('textarea').fill('Add login page')
      await page.click('button:has-text("Send")')
      await page.waitForSelector('button:has-text("Revert")', { timeout: 15000 })

      // Click Revert button
      await page.click('button:has-text("Revert")')

      // Verify "Reverting..." loading state
      await expect(page.getByText('Reverting...')).toBeVisible()

      // Verify "Reverted" badge appears
      await expect(page.getByText('Reverted')).toBeVisible({ timeout: 5000 })

      // Verify confirmation message
      await expect(page.getByText(/Changes reverted/)).toBeVisible()
    })

    test('should not show accept/revert for already applied changes', async ({ page }) => {
      // TODO: Implement after backend is ready
      // Load page with chat history containing accepted changes

      await page.goto(REFINEMENT_URL)

      // Find message with "Applied" badge
      const appliedMessage = page.locator('.bg-warm-800:has-text("Applied")')

      // Verify Accept/Revert buttons don't exist within this message
      await expect(appliedMessage.locator('button:has-text("Accept")')).not.toBeVisible()
      await expect(appliedMessage.locator('button:has-text("Revert")')).not.toBeVisible()
    })
  })

  test.describe('Code Editor Panel', () => {
    test('should display file tabs', async ({ page }) => {
      // TODO: Implement after backend is ready
      await page.goto(REFINEMENT_URL)

      // Verify file tabs exist
      await expect(page.locator('[data-testid="file-tab"]')).toBeVisible()
    })

    test('should switch between files', async ({ page }) => {
      // TODO: Implement after backend is ready
      await page.goto(REFINEMENT_URL)

      // Click second file tab
      await page.locator('[data-testid="file-tab"]').nth(1).click()

      // Verify file content changes
      // (Implementation depends on how file names are displayed)
    })

    test('should display file content', async ({ page }) => {
      // TODO: Implement after backend is ready
      await page.goto(REFINEMENT_URL)

      // Verify code content is visible
      await expect(page.locator('pre code')).toBeVisible()
    })
  })

  test.describe('Live Preview Panel', () => {
    test('should start and pause live preview', async ({ page }) => {
      // TODO: Implement after backend is ready
      await page.goto(REFINEMENT_URL)

      // Click "Start Preview" button
      await page.click('button:has-text("Start Preview")')

      // Verify iframe becomes visible
      await expect(page.locator('iframe[title="Live Preview"]')).toBeVisible()

      // Verify button text changes to "Pause Preview"
      await expect(page.getByText('Pause Preview')).toBeVisible()

      // Click "Pause Preview"
      await page.click('button:has-text("Pause Preview")')

      // Verify iframe is hidden or cleared
      await expect(page.locator('iframe[title="Live Preview"]')).not.toBeVisible()
    })
  })

  test.describe('Token Balance', () => {
    test('should display token balance', async ({ page }) => {
      // TODO: Implement after backend is ready
      await page.goto(REFINEMENT_URL)

      // Verify token balance is shown
      await expect(page.getByText(/Token.*balance|Balance/i)).toBeVisible()
    })

    test('should update token balance after message', async ({ page }) => {
      // TODO: Implement after backend is ready
      await page.goto(REFINEMENT_URL)

      // Get initial token balance
      const balanceText = await page.locator('[data-testid="token-balance"]').textContent()
      const initialBalance = parseInt(balanceText?.match(/\d+/)?.[0] || '0')

      // Send message
      await page.locator('textarea').fill('Test message')
      await page.click('button:has-text("Send")')

      // Wait for response
      await page.waitForSelector('.bg-warm-800', { timeout: 15000 })

      // Get updated token balance
      const newBalanceText = await page.locator('[data-testid="token-balance"]').textContent()
      const newBalance = parseInt(newBalanceText?.match(/\d+/)?.[0] || '0')

      // Verify balance decreased
      expect(newBalance).toBeLessThan(initialBalance)
    })
  })

  test.describe('Chat History Persistence', () => {
    test('should load existing chat history', async ({ page }) => {
      // TODO: Implement after backend is ready
      // Requires existing chat history in backend

      await page.goto(REFINEMENT_URL)

      // Verify previous messages are loaded
      await expect(page.locator('.bg-blue-600, .bg-warm-800')).toHaveCount(2, { timeout: 5000 })
    })

    test('should persist chat after page reload', async ({ page }) => {
      // TODO: Implement after backend is ready
      await page.goto(REFINEMENT_URL)

      // Send a message
      await page.locator('textarea').fill('Add footer')
      await page.click('button:has-text("Send")')
      await page.waitForSelector('.bg-warm-800', { timeout: 15000 })

      // Reload page
      await page.reload()

      // Verify message is still visible
      await expect(page.locator('.bg-blue-600:has-text("Add footer")')).toBeVisible()
    })
  })

  test.describe('Error Handling', () => {
    test('should handle network errors gracefully', async ({ page }) => {
      // TODO: Implement after backend is ready
      // May require intercepting network requests

      await page.route('**/api/dev-request/*/iterate', route => route.abort())

      await page.goto(REFINEMENT_URL)
      await page.locator('textarea').fill('Test')
      await page.click('button:has-text("Send")')

      // Verify error message appears
      await expect(page.getByText(/Failed to send message/)).toBeVisible()
    })

    test('should fall back to non-streaming on stream failure', async ({ page }) => {
      // TODO: Implement after backend is ready
      // Requires mocking streaming endpoint failure

      // Mock streaming endpoint to fail
      await page.route('**/api/dev-request/*/iterate/stream', route => route.abort())

      await page.goto(REFINEMENT_URL)
      await page.locator('textarea').fill('Test fallback')
      await page.click('button:has-text("Send")')

      // Verify message is sent via non-streaming endpoint
      // (Should still complete successfully)
      await expect(page.locator('.bg-warm-800')).toBeVisible({ timeout: 15000 })
    })

    test('should handle invalid request ID', async ({ page }) => {
      // TODO: Implement after backend is ready
      await page.goto('/requests/invalid-id-999/refine')

      // Verify error state or redirect
      await expect(page.getByText(/not found|error/i)).toBeVisible()
    })
  })

  test.describe('Keyboard Shortcuts', () => {
    test('should send message on Enter key', async ({ page }) => {
      // TODO: Implement after backend is ready
      await page.goto(REFINEMENT_URL)

      // Type message and press Enter
      const textarea = page.locator('textarea')
      await textarea.fill('Test keyboard shortcut')
      await textarea.press('Enter')

      // Verify message was sent
      await expect(page.locator('.bg-blue-600:has-text("Test keyboard shortcut")')).toBeVisible()
    })

    test('should insert newline on Shift+Enter', async ({ page }) => {
      // TODO: Implement after backend is ready
      await page.goto(REFINEMENT_URL)

      // Type message and press Shift+Enter
      const textarea = page.locator('textarea')
      await textarea.fill('Line 1')
      await textarea.press('Shift+Enter')
      await textarea.press('ArrowDown') // Move to next line
      await textarea.type('Line 2')

      // Verify newline was inserted (message should not be sent)
      const value = await textarea.inputValue()
      expect(value).toContain('\n')

      // Verify message was not sent
      await expect(page.locator('.bg-blue-600')).not.toBeVisible()
    })
  })

  test.describe('Responsive Layout', () => {
    test('should adapt layout for mobile screens', async ({ page }) => {
      // TODO: Implement after backend is ready
      await page.setViewportSize({ width: 375, height: 667 }) // iPhone SE
      await page.goto(REFINEMENT_URL)

      // Verify mobile-friendly layout
      // (Implementation depends on responsive design choices)
    })

    test('should maintain functionality on tablet screens', async ({ page }) => {
      // TODO: Implement after backend is ready
      await page.setViewportSize({ width: 768, height: 1024 }) // iPad
      await page.goto(REFINEMENT_URL)

      // Verify tablet layout and functionality
    })
  })
})

/**
 * Integration Test Checklist (for manual testing):
 *
 * Backend Prerequisites:
 * - [ ] All endpoints implemented (/iterate, /iterate/stream, /accept, /revert, /chat-history)
 * - [ ] SSE streaming works correctly with proper event format
 * - [ ] Token balance validation and deduction working
 * - [ ] File change operations (create/modify/delete) implemented
 * - [ ] Accept/revert operations are idempotent
 * - [ ] Chat history returns empty array for new requests
 *
 * Frontend Validation:
 * - [ ] Page loads without errors
 * - [ ] Chat interface displays correctly
 * - [ ] Messages send and receive properly
 * - [ ] Streaming shows real-time updates
 * - [ ] File changes display with correct badges
 * - [ ] Accept/Revert buttons work correctly
 * - [ ] Token balance updates after each message
 * - [ ] Layout toggles work (Chat/Split/Code modes)
 * - [ ] File tabs and code viewer work
 * - [ ] Live preview iframe loads
 * - [ ] Error handling works (insufficient tokens, network errors)
 * - [ ] Chat history persists across page reloads
 * - [ ] i18n works for both English and Korean
 *
 * Performance Validation:
 * - [ ] First message response < 5 seconds
 * - [ ] Streaming first token < 1 second
 * - [ ] Accept/Revert operations < 500ms
 * - [ ] Chat history loads < 500ms
 * - [ ] No memory leaks during extended use
 * - [ ] Page remains responsive during AI generation
 */
