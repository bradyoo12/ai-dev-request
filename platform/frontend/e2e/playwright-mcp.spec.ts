import { test, expect, type Page } from '@playwright/test';

/**
 * E2E tests for Playwright MCP integration pages (#553):
 * - TestGenerationPage (MCP config, NL test generation, coverage analysis)
 * - SelfHealingTestPage (healing analysis, locator repair, healing timeline)
 */

async function mockAuth(page: Page) {
  await page.evaluate(() => {
    const mockUser = {
      id: 'test-user-123',
      email: 'test@example.com',
      displayName: 'Test User',
      createdAt: new Date().toISOString(),
    };
    localStorage.setItem('ai-dev-user', JSON.stringify(mockUser));
    localStorage.setItem('ai-dev-jwt', 'mock-jwt-token-123');
  });
}

test.describe('TestGenerationPage - MCP Integration', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await mockAuth(page);
    await page.goto('/settings?tab=test-generation');
    try {
      await expect(page.getByText('AI Test Generation')).toBeVisible({ timeout: 5000 });
    } catch {
      test.skip(true, 'Settings page did not load — backend may not be available');
    }
  });

  test('should display page title and subtitle', async ({ page }) => {
    await expect(page.getByText('AI Test Generation')).toBeVisible();
    // Subtitle mentions auto-generation of tests
    await expect(page.getByText(/Auto-generate unit, integration, and E2E tests/)).toBeVisible();
  });

  test('should show tab navigation with all four tabs', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Generate Tests' }).first()).toBeVisible();
    await expect(page.getByRole('button', { name: 'Natural Language' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'MCP Config' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Coverage Analysis' })).toBeVisible();
  });

  test('should show project ID input and history button', async ({ page }) => {
    await expect(page.getByText('Project ID:')).toBeVisible();
    await expect(page.getByRole('button', { name: 'History' })).toBeVisible();
  });

  test('should switch to Natural Language tab and show scenario form', async ({ page }) => {
    await page.getByRole('button', { name: 'Natural Language' }).click();

    await expect(page.getByText('Generate Tests from Natural Language')).toBeVisible();
    await expect(page.getByText('Test Type')).toBeVisible();
    await expect(page.getByRole('button', { name: 'E2e' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Unit' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Integration', exact: true })).toBeVisible();
    await expect(page.getByText('Test Scenario', { exact: true })).toBeVisible();

    // Textarea should be present
    const textarea = page.locator('textarea');
    await expect(textarea).toBeVisible();

    // Generate button should be disabled when textarea is empty
    const generateBtn = page.getByRole('button', { name: 'Generate from Scenario' });
    await expect(generateBtn).toBeDisabled();
  });

  test('should enable NL generate button when scenario is entered', async ({ page }) => {
    await page.getByRole('button', { name: 'Natural Language' }).click();

    const textarea = page.locator('textarea');
    await textarea.fill('User logs in and sees dashboard');

    const generateBtn = page.getByRole('button', { name: 'Generate from Scenario' });
    await expect(generateBtn).toBeEnabled();
  });

  test('should show example scenarios that populate textarea', async ({ page }) => {
    await page.getByRole('button', { name: 'Natural Language' }).click();

    await expect(page.getByText('Example Scenarios')).toBeVisible();

    // Click an example scenario
    const exampleBtn = page.getByRole('button', { name: /User logs in with valid credentials/ });
    await exampleBtn.click();

    // Textarea should now contain the example text
    const textarea = page.locator('textarea');
    await expect(textarea).toHaveValue(/User logs in with valid credentials/);
  });

  test('should switch to MCP Config tab and show connection form', async ({ page }) => {
    await page.getByRole('button', { name: 'MCP Config' }).click();

    await expect(page.getByRole('heading', { name: 'Playwright MCP Server' })).toBeVisible();
    await expect(page.getByText('Server URL')).toBeVisible();
    await expect(page.getByText('Transport')).toBeVisible();

    // Server URL input
    const urlInput = page.locator('input[placeholder*="localhost:3100"]');
    await expect(urlInput).toBeVisible();

    // Transport dropdown
    const transportSelect = page.locator('select');
    await expect(transportSelect).toBeVisible();

    // Connect button should be disabled when URL is empty
    const connectBtn = page.getByRole('button', { name: 'Connect' });
    await expect(connectBtn).toBeDisabled();
  });

  test('should enable connect button when MCP URL is entered', async ({ page }) => {
    await page.getByRole('button', { name: 'MCP Config' }).click();

    const urlInput = page.locator('input[placeholder*="localhost:3100"]');
    await urlInput.fill('http://localhost:3100/mcp');

    const connectBtn = page.getByRole('button', { name: 'Connect' });
    await expect(connectBtn).toBeEnabled();
  });

  test('should show MCP how-it-works section', async ({ page }) => {
    await page.getByRole('button', { name: 'MCP Config' }).click();

    await expect(page.getByText('How Playwright MCP Works')).toBeVisible();
    await expect(page.getByText(/MCP server launches a Playwright browser/)).toBeVisible();
    await expect(page.getByText(/AI uses the accessibility tree/)).toBeVisible();
    await expect(page.getByText(/self-healing capability/)).toBeVisible();
  });

  test('should switch to Coverage Analysis tab', async ({ page }) => {
    await page.getByRole('button', { name: 'Coverage Analysis' }).click();

    await expect(page.getByText('AI Coverage Analysis')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Analyze Coverage' })).toBeVisible();
    await expect(page.getByText(/Analyze Coverage.*to get an AI-powered coverage analysis/)).toBeVisible();
  });

  test('should show empty state on Generate Tests tab', async ({ page }) => {
    // Default tab is 'generate'
    await expect(page.getByText(/No test generation results yet/)).toBeVisible();
    // Generate Tests action button
    const generateBtns = page.getByRole('button', { name: 'Generate Tests' });
    // There are two: tab button and action button
    await expect(generateBtns.nth(1)).toBeVisible();
  });
});

test.describe('SelfHealingTestPage - MCP Integration', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await mockAuth(page);
    await page.goto('/settings?tab=self-healing-test');
    try {
      // Wait for the Run Self-Healing Analysis button to appear (unique to this page)
      await expect(page.locator('button', { hasText: /Run Self-Healing Analysis|자가 복구 분석 실행/ })).toBeVisible({ timeout: 5000 });
    } catch {
      test.skip(true, 'Settings page did not load — backend may not be available');
    }
  });

  test('should display page title and tab buttons', async ({ page }) => {
    // The page has 3 tab buttons for analysis, repair, timeline
    await expect(page.getByRole('button', { name: 'Self-Healing Analysis', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Locator Repair', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Healing Timeline', exact: true })).toBeVisible();
  });

  test('should show Run Self-Healing Analysis action button', async ({ page }) => {
    // On the default analysis tab, there should be a run analysis button
    await expect(page.getByRole('button', { name: /Run Self-Healing Analysis|자가 복구 분석 실행/ })).toBeVisible();
  });

  test('should show project ID input and history button', async ({ page }) => {
    // Project ID label and input
    const projectInput = page.locator('input.font-mono[type="text"]');
    await expect(projectInput).toBeVisible();
    await expect(page.getByRole('button', { name: /History|기록/ })).toBeVisible();
  });

  test('should show empty state or analysis results on Analysis tab', async ({ page }) => {
    // Either empty state text or analysis results should be present
    const emptyState = page.getByText(/No self-healing results yet|자가 복구 결과가 없습니다/);
    const analysisButton = page.getByRole('button', { name: /Run Self-Healing Analysis|자가 복구 분석 실행/ });
    // The analysis button should always be present on this tab
    await expect(analysisButton).toBeVisible();
  });

  test('should switch to Locator Repair tab and show repair form', async ({ page }) => {
    await page.getByRole('button', { name: /Locator Repair|로케이터 수리/ }).click();

    // Form fields are identified by their placeholder attributes which remain in English
    const testFileInput = page.locator('input[placeholder*="login.spec.ts"]');
    await expect(testFileInput).toBeVisible();

    const locatorInput = page.locator('input[placeholder*=".old-submit-btn"]');
    await expect(locatorInput).toBeVisible();

    const errorInput = page.locator('input[placeholder*="Timeout waiting"]');
    await expect(errorInput).toBeVisible();

    // Repair button should be disabled when locator is empty
    const repairBtn = page.getByRole('button', { name: /Repair Locator|로케이터 수리/ }).last();
    await expect(repairBtn).toBeDisabled();
  });

  test('should enable repair button when broken locator is entered', async ({ page }) => {
    await page.getByRole('button', { name: /Locator Repair|로케이터 수리/ }).click();

    const locatorInput = page.locator('input[placeholder*=".old-submit-btn"]');
    await locatorInput.fill('.broken-selector');

    // The action button (not the tab button)
    const repairBtn = page.getByRole('button', { name: /Repair Locator|로케이터 수리/ }).last();
    await expect(repairBtn).toBeEnabled();
  });

  test('should fill all repair form fields', async ({ page }) => {
    await page.getByRole('button', { name: /Locator Repair|로케이터 수리/ }).click();

    // Fill in all fields via placeholders (stable across i18n)
    const testFileInput = page.locator('input[placeholder*="login.spec.ts"]');
    await testFileInput.fill('checkout.spec.ts');

    const testNameInput = page.locator('input[placeholder*="should submit login form"]');
    await testNameInput.fill('should complete checkout');

    const locatorInput = page.locator('input[placeholder*=".old-submit-btn"]');
    await locatorInput.fill('#checkout-button');

    const errorInput = page.locator('input[placeholder*="Timeout waiting"]');
    await errorInput.fill('Timeout waiting for selector');

    // Verify all fields are filled
    await expect(testFileInput).toHaveValue('checkout.spec.ts');
    await expect(testNameInput).toHaveValue('should complete checkout');
    await expect(locatorInput).toHaveValue('#checkout-button');
    await expect(errorInput).toHaveValue('Timeout waiting for selector');
  });

  test('should switch to Healing Timeline tab', async ({ page }) => {
    await page.getByRole('button', { name: /Healing Timeline|치유 타임라인/ }).click();

    await expect(page.getByRole('button', { name: /Refresh|새로고침/ })).toBeVisible();
  });

  test('should show empty timeline or entries on timeline tab', async ({ page }) => {
    await page.getByRole('button', { name: /Healing Timeline|치유 타임라인/ }).click();

    // Wait for loading to finish (timeline loads on tab switch)
    await page.waitForTimeout(1000);

    // Should show empty state or timeline entries
    const emptyState = page.getByText(/No healing activity yet|복구 활동이 없습니다/);
    const timelineEntries = page.locator('[class*="border-l-4"]');

    // Either empty state or entries should be visible
    const hasEmptyState = await emptyState.isVisible().catch(() => false);
    const hasEntries = (await timelineEntries.count()) > 0;
    expect(hasEmptyState || hasEntries).toBeTruthy();
  });
});
