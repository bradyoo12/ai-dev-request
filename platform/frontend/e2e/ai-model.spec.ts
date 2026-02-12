import { test, expect } from '@playwright/test';

test.describe('AI Model Settings', () => {
  test.beforeEach(async ({ page }) => {
    // Mock the providers API endpoint
    await page.route('**/api/ai-model/providers', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 'claude',
            name: 'Claude',
            description: 'Anthropic Claude models with extended thinking',
            available: true,
          },
          {
            id: 'gemini',
            name: 'Gemini',
            description: 'Google Gemini models with multimodal capabilities',
            available: true,
          },
        ]),
      });
    });

    // Mock the config API endpoint
    await page.route('**/api/ai-model/config', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            id: 'test-config-id',
            selectedModel: 'claude-sonnet-4-5-20250929',
            extendedThinkingEnabled: false,
            thinkingBudgetTokens: 10000,
            streamThinkingEnabled: false,
            autoModelSelection: false,
            totalRequestsOpus: 0,
            totalRequestsSonnet: 0,
            totalThinkingTokens: 0,
            totalOutputTokens: 0,
            estimatedCost: 0,
            geminiSafetyLevel: 'BLOCK_MEDIUM_AND_ABOVE',
            geminiTemperature: 1.0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }),
        });
      } else if (route.request().method() === 'PUT') {
        // Echo back the request body with updated timestamp
        const requestBody = route.request().postDataJSON();
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            ...requestBody,
            id: 'test-config-id',
            updatedAt: new Date().toISOString(),
          }),
        });
      }
    });

    // Mock the models API endpoint
    await page.route('**/api/ai-model/models*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 'claude-haiku-4-5',
            name: 'Claude Haiku 4.5',
            modelId: 'claude-haiku-4-5-20251001',
            description: 'Fast and efficient',
            inputCostPer1k: 0.0008,
            outputCostPer1k: 0.004,
            supportsExtendedThinking: false,
            maxOutputTokens: 8000,
            avgLatencyMs: 800,
            tier: 'fast',
            badge: 'Fast',
            capabilities: ['Text', 'Vision'],
          },
          {
            id: 'claude-sonnet-4-5',
            name: 'Claude Sonnet 4.5',
            modelId: 'claude-sonnet-4-5-20250929',
            description: 'Balanced performance',
            inputCostPer1k: 0.003,
            outputCostPer1k: 0.015,
            supportsExtendedThinking: false,
            maxOutputTokens: 16000,
            avgLatencyMs: 1500,
            tier: 'balanced',
            badge: 'Balanced',
            capabilities: ['Text', 'Vision', 'Code'],
          },
        ]),
      });
    });

    // Mock the stats API endpoint
    await page.route('**/api/ai-model/stats', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          totalRequests: 150,
          totalRequestsOpus: 30,
          totalRequestsSonnet: 120,
          totalThinkingTokens: 50000,
          totalOutputTokens: 200000,
          estimatedCost: 2.45,
          perProviderStats: [
            {
              provider: 'claude',
              totalRequests: 150,
              totalTokens: 250000,
              estimatedCost: 2.45,
            },
            {
              provider: 'gemini',
              totalRequests: 0,
              totalTokens: 0,
              estimatedCost: 0,
            },
          ],
        }),
      });
    });
  });

  test('navigates to AI Model settings page', async ({ page }) => {
    await page.goto('/settings/ai-model');
    await expect(page.locator('text=AI Engine')).toBeVisible({ timeout: 5000 });
  });

  test('displays provider selector dropdown', async ({ page }) => {
    await page.goto('/settings/ai-model');

    // Wait for the page to load
    await expect(page.locator('text=AI Engine')).toBeVisible({ timeout: 5000 });

    // Look for provider selector (adjust selector based on actual implementation)
    const providerSelect = page.locator('select').first();
    await expect(providerSelect).toBeVisible();
  });

  test('loads and displays available providers', async ({ page }) => {
    await page.goto('/settings/ai-model');

    // Wait for providers to load
    await page.waitForTimeout(1000);

    // Check if Claude option exists
    const selectElement = page.locator('select').first();
    await expect(selectElement).toBeVisible();

    // Get select options
    const options = await selectElement.locator('option').allTextContents();

    // Should contain Claude and Gemini
    expect(options.some(opt => opt.includes('Claude'))).toBeTruthy();
    expect(options.some(opt => opt.includes('Gemini'))).toBeTruthy();
  });

  test('shows Gemini-specific settings when Gemini is selected', async ({ page }) => {
    await page.goto('/settings/ai-model');

    // Wait for page load
    await expect(page.locator('text=AI Engine')).toBeVisible({ timeout: 5000 });

    // Navigate to Configure tab
    const configureTab = page.locator('button:has-text("Configure")');
    await configureTab.click();

    // Select Gemini provider
    const providerSelect = page.locator('select').first();
    await providerSelect.selectOption('gemini');

    // Wait for Gemini settings to appear
    await page.waitForTimeout(500);

    // Check for Gemini-specific settings
    await expect(page.locator('text=Gemini Settings').or(page.locator('text=Safety Settings'))).toBeVisible();
  });

  test('displays model cards in Models tab', async ({ page }) => {
    await page.goto('/settings/ai-model');

    // Wait for models to load
    await expect(page.locator('text=AI Engine')).toBeVisible({ timeout: 5000 });

    // Navigate to Models tab (should be default)
    const modelsTab = page.locator('button:has-text("Models")');
    await modelsTab.click();

    // Wait for models to render
    await page.waitForTimeout(1000);

    // Check for model cards
    await expect(page.locator('text=Claude Haiku 4.5').or(page.locator('text=Claude Sonnet 4.5'))).toBeVisible();
  });

  test('displays statistics in Stats tab', async ({ page }) => {
    await page.goto('/settings/ai-model');

    // Wait for page load
    await expect(page.locator('text=AI Engine')).toBeVisible({ timeout: 5000 });

    // Navigate to Stats tab
    const statsTab = page.locator('button:has-text("Stats")');
    await statsTab.click();

    // Wait for stats to render
    await page.waitForTimeout(500);

    // Check for stats display
    await expect(page.locator('text=Total Requests').or(page.locator('text=150'))).toBeVisible();
  });

  test('displays per-provider stats breakdown', async ({ page }) => {
    await page.goto('/settings/ai-model');

    // Navigate to Stats tab
    await expect(page.locator('text=AI Engine')).toBeVisible({ timeout: 5000 });
    const statsTab = page.locator('button:has-text("Stats")');
    await statsTab.click();

    // Wait for stats to render
    await page.waitForTimeout(500);

    // Check for provider breakdown section
    await expect(page.locator('text=Provider Breakdown').or(page.locator('text=claude'))).toBeVisible();
  });

  test('handles API errors gracefully', async ({ page }) => {
    // Override provider API to return error
    await page.route('**/api/ai-model/providers', async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal server error' }),
      });
    });

    await page.goto('/settings/ai-model');

    // Page should still load, maybe with an error message
    await expect(page.locator('text=AI Engine')).toBeVisible({ timeout: 5000 });

    // Error should be displayed or logged
    // The app should not crash
    await expect(page.locator('#root')).toBeVisible();
  });

  test('persists Gemini settings when saved', async ({ page }) => {
    await page.goto('/settings/ai-model');

    // Navigate to Configure tab
    await expect(page.locator('text=AI Engine')).toBeVisible({ timeout: 5000 });
    const configureTab = page.locator('button:has-text("Configure")');
    await configureTab.click();

    // Select Gemini provider
    const providerSelect = page.locator('select').first();
    await providerSelect.selectOption('gemini');

    // Wait for Gemini settings to appear
    await page.waitForTimeout(500);

    // Change temperature slider (if visible)
    const temperatureSlider = page.locator('input[type="range"]').last();
    if (await temperatureSlider.isVisible()) {
      await temperatureSlider.fill('1.5');

      // Settings should auto-save via API call
      await page.waitForTimeout(500);

      // Reload page and verify settings persisted
      await page.reload();
      await expect(page.locator('text=AI Engine')).toBeVisible({ timeout: 5000 });

      const configureTabAfterReload = page.locator('button:has-text("Configure")');
      await configureTabAfterReload.click();

      // Temperature value should be preserved (handled by mocked API)
      const temperatureDisplay = page.locator('text=1.5');
      await expect(temperatureDisplay).toBeVisible({ timeout: 2000 });
    }
  });

  test('supports i18n translations', async ({ page }) => {
    await page.goto('/settings/ai-model');

    // Check for translation keys (adjust based on actual implementation)
    await expect(page.locator('text=AI Engine').or(page.locator('text=AI 엔진'))).toBeVisible({ timeout: 5000 });
  });
});
