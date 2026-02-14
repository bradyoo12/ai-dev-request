import { test, expect } from '@playwright/test';

test.describe('AI Agent Builder', () => {
  test.beforeEach(async ({ page }) => {
    // Set up mock authentication
    await page.goto('/');
    await page.evaluate(() => {
      const mockUser = {
        id: 'test-user-123',
        email: 'test@example.com',
        displayName: 'Test User',
        createdAt: new Date().toISOString()
      };
      localStorage.setItem('ai-dev-user', JSON.stringify(mockUser));
      localStorage.setItem('ai-dev-jwt', 'mock-jwt-token-123');
    });

    // Mock the templates API endpoint
    await page.route('**/api/agent-builder/templates', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 'template-1',
            name: 'Slack PR Reviewer',
            description: 'Monitors GitHub pull requests and sends Slack notifications',
            category: 'automation',
            platform: 'slack',
            iconUrl: 'https://example.com/slack-icon.png',
            templateSpec: 'Create a Slack bot that monitors GitHub pull requests and sends notifications when code reviews are needed.'
          },
          {
            id: 'template-2',
            name: 'Telegram Customer Support',
            description: 'AI-powered customer support bot for Telegram',
            category: 'support',
            platform: 'telegram',
            iconUrl: 'https://example.com/telegram-icon.png',
            templateSpec: 'Create a Telegram bot that answers customer questions using AI.'
          }
        ])
      });
    });

    // Mock the deployments API endpoint
    await page.route('**/api/agent-builder/deployments', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([
            {
              id: 'deploy-1',
              userId: 'test-user-123',
              agentSkillId: 'agent-1',
              platform: 'slack',
              status: 'active',
              configJson: '{}',
              metricsJson: '{}',
              deployedAt: new Date().toISOString(),
              lastActiveAt: new Date().toISOString(),
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            }
          ])
        });
      }
    });

    // Mock the preview API endpoint
    await page.route('**/api/agent-builder/preview', async (route) => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            name: 'GitHub PR Monitor',
            description: 'Monitors pull requests and sends notifications',
            category: 'automation',
            instructionContent: 'Monitor GitHub PRs and notify team',
            scriptsJson: '[]',
            resourcesJson: '[]',
            tagsJson: '["github", "slack"]'
          })
        });
      }
    });

    // Mock the generate API endpoint
    await page.route('**/api/agent-builder/generate', async (route) => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            id: 'agent-generated-123',
            userId: 'test-user-123',
            name: 'GitHub PR Monitor',
            description: 'Monitors pull requests and sends notifications',
            category: 'automation',
            instructionContent: 'Monitor GitHub PRs and notify team',
            scriptsJson: '[]',
            resourcesJson: '[]',
            tagsJson: '["github", "slack"]',
            isBuiltIn: false,
            isPublic: false,
            downloadCount: 0,
            version: '1.0.0',
            author: 'Test User',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          })
        });
      }
    });

    // Mock the deploy API endpoint
    await page.route('**/api/agent-builder/deploy', async (route) => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            id: 'deploy-new-123',
            userId: 'test-user-123',
            agentSkillId: 'agent-generated-123',
            platform: 'slack',
            status: 'active',
            configJson: '{}',
            metricsJson: '{}',
            deployedAt: new Date().toISOString(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          })
        });
      }
    });

    // Mock the undeploy API endpoint
    await page.route('**/api/agent-builder/deployments/*', async (route) => {
      if (route.request().method() === 'DELETE') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true })
        });
      }
    });
  });

  test('navigates to Agent Builder page', async ({ page }) => {
    await page.goto('/settings/agent-builder');

    // Wait for page to load
    await page.waitForTimeout(500);

    // Check for page title
    await expect(page.getByRole('heading', { name: 'AI Agent Builder' })).toBeVisible({ timeout: 10000 });
  });

  test('displays page description', async ({ page }) => {
    await page.goto('/settings/agent-builder');

    // Check for description text
    await expect(page.getByText(/Use AI to create specialized AI agents/i)).toBeVisible({ timeout: 5000 });
  });

  test('loads and displays agent templates', async ({ page }) => {
    await page.goto('/settings/agent-builder');

    // Wait for templates to load
    await page.waitForTimeout(1000);

    // Check for templates section
    await expect(page.getByRole('heading', { name: 'Templates' })).toBeVisible();

    // Check for template cards
    await expect(page.getByRole('heading', { name: 'Slack PR Reviewer' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Telegram Customer Support' })).toBeVisible();
  });

  test('displays specification textarea', async ({ page }) => {
    await page.goto('/settings/agent-builder');

    // Check for specification input
    const textarea = page.locator('textarea').first();
    await expect(textarea).toBeVisible({ timeout: 5000 });

    // Check placeholder text
    await expect(textarea).toHaveAttribute('placeholder', /Describe your agent in natural language/i);
  });

  test('template selection populates specification field', async ({ page }) => {
    await page.goto('/settings/agent-builder');

    // Wait for templates to load
    await page.waitForTimeout(1000);

    // Click on a template
    const templateButton = page.locator('button:has-text("Slack PR Reviewer")');
    await templateButton.click();

    // Wait for specification to be populated
    await page.waitForTimeout(500);

    // Check if specification field is populated
    const textarea = page.locator('textarea').first();
    const value = await textarea.inputValue();
    expect(value).toContain('Slack bot');
  });

  test('preview button is disabled when specification is empty', async ({ page }) => {
    await page.goto('/settings/agent-builder');

    // Wait for page to load
    await page.waitForTimeout(500);

    // Check that preview button is disabled
    const previewButton = page.locator('button:has-text("Preview")');
    await expect(previewButton).toBeDisabled();
  });

  test('generate button is disabled when specification is empty', async ({ page }) => {
    await page.goto('/settings/agent-builder');

    // Wait for page to load
    await page.waitForTimeout(500);

    // Check that generate button is disabled
    const generateButton = page.locator('button:has-text("Generate Agent")');
    await expect(generateButton).toBeDisabled();
  });

  test('user can preview agent from specification', async ({ page }) => {
    await page.goto('/settings/agent-builder');

    // Enter specification
    const textarea = page.locator('textarea').first();
    await textarea.fill('Create a Slack bot that monitors GitHub pull requests');

    // Click preview button
    const previewButton = page.locator('button:has-text("Preview")');
    await previewButton.click();

    // Wait for preview to load
    await page.waitForTimeout(1000);

    // Check for preview section
    await expect(page.getByRole('heading', { name: 'Preview' })).toBeVisible();

    // Check preview content
    await expect(page.getByText('GitHub PR Monitor')).toBeVisible();
  });

  test('user can generate agent from specification', async ({ page }) => {
    await page.goto('/settings/agent-builder');

    // Enter specification
    const textarea = page.locator('textarea').first();
    await textarea.fill('Create a Slack bot that monitors GitHub pull requests');

    // Click generate button
    const generateButton = page.locator('button:has-text("Generate Agent")');
    await generateButton.click();

    // Wait for generation to complete
    await page.waitForTimeout(1500);

    // Check for success message
    await expect(page.getByRole('heading', { name: 'Agent Generated Successfully' })).toBeVisible({ timeout: 5000 });

    // Check generated agent details
    await expect(page.getByText('GitHub PR Monitor')).toBeVisible();
  });

  test('generated agent displays deployment options', async ({ page }) => {
    await page.goto('/settings/agent-builder');

    // Generate agent
    const textarea = page.locator('textarea').first();
    await textarea.fill('Create a Slack bot');

    const generateButton = page.locator('button:has-text("Generate Agent")');
    await generateButton.click();

    await page.waitForTimeout(1500);

    // Check for platform selector within the generated agent section
    const generatedSection = page.locator('.bg-green-900\\/20.border.border-green-500');
    await expect(generatedSection).toBeVisible({ timeout: 5000 });

    const platformSelect = generatedSection.locator('select');
    await expect(platformSelect).toBeVisible();

    // Check for deploy button
    await expect(generatedSection.locator('button:has-text("Deploy")')).toBeVisible();
  });

  test('user can deploy generated agent', async ({ page }) => {
    await page.goto('/settings/agent-builder');

    // Generate agent
    const textarea = page.locator('textarea').first();
    await textarea.fill('Create a Slack bot');

    const generateButton = page.locator('button:has-text("Generate Agent")');
    await generateButton.click();

    await page.waitForTimeout(1500);

    // Mock deployments response to include the new deployment
    await page.route('**/api/agent-builder/deployments', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([
            {
              id: 'deploy-1',
              userId: 'test-user-123',
              agentSkillId: 'agent-1',
              platform: 'slack',
              status: 'active',
              deployedAt: new Date().toISOString(),
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            },
            {
              id: 'deploy-new-123',
              userId: 'test-user-123',
              agentSkillId: 'agent-generated-123',
              platform: 'slack',
              status: 'active',
              deployedAt: new Date().toISOString(),
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            }
          ])
        });
      }
    });

    // Click deploy button within the generated agent section
    const generatedSection = page.locator('.bg-green-900\\/20.border.border-green-500');
    const deployButton = generatedSection.locator('button:has-text("Deploy")');
    await deployButton.click();

    // Wait for deployment to complete
    await page.waitForTimeout(1500);

    // Check that the deployments section updated
    const deploymentCards = page.locator('.bg-warm-800.border.border-warm-700.rounded-lg.p-4');
    await expect(deploymentCards).toHaveCount(2, { timeout: 5000 });
  });

  test('displays deployed agents section', async ({ page }) => {
    await page.goto('/settings/agent-builder');

    // Wait for deployments to load
    await page.waitForTimeout(1000);

    // Check for deployments section
    await expect(page.getByRole('heading', { name: 'Deployed Agents' })).toBeVisible();

    // Check for deployed agent card - use more specific selector
    const deploymentCard = page.locator('.bg-warm-800.border.border-warm-700.rounded-lg.p-4').filter({ hasText: 'slack' });
    await expect(deploymentCard).toBeVisible();
  });

  test('displays "no deployments" message when no agents are deployed', async ({ page }) => {
    // Override deployments to return empty array
    await page.route('**/api/agent-builder/deployments', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([])
        });
      }
    });

    await page.goto('/settings/agent-builder');

    // Wait for deployments to load
    await page.waitForTimeout(1000);

    // Check for "no deployments" message
    await expect(page.getByText('No deployed agents yet')).toBeVisible({ timeout: 5000 });
  });

  test('user can undeploy an agent', async ({ page }) => {
    // Set up dialog handler for confirmation
    page.on('dialog', async dialog => {
      expect(dialog.message()).toContain('Are you sure');
      await dialog.accept();
    });

    await page.goto('/settings/agent-builder');

    // Wait for deployments to load
    await page.waitForTimeout(1000);

    // Click undeploy button
    const undeployButton = page.locator('button:has-text("Undeploy")').first();
    await undeployButton.click();

    // Wait for undeploy to complete
    await page.waitForTimeout(500);
  });

  test('handles API errors gracefully during generation', async ({ page }) => {
    // Override generate endpoint to return error
    await page.route('**/api/agent-builder/generate', async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Failed to generate agent' })
      });
    });

    await page.goto('/settings/agent-builder');

    // Enter specification and generate
    const textarea = page.locator('textarea').first();
    await textarea.fill('Create a Slack bot');

    const generateButton = page.locator('button:has-text("Generate Agent")');
    await generateButton.click();

    // Wait for error to appear
    await page.waitForTimeout(1000);

    // Check for error message
    await expect(page.locator('.bg-red-900\\/20.border.border-red-500')).toBeVisible({ timeout: 5000 });
  });

  test('handles API errors gracefully during preview', async ({ page }) => {
    // Override preview endpoint to return error
    await page.route('**/api/agent-builder/preview', async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Failed to preview agent' })
      });
    });

    await page.goto('/settings/agent-builder');

    // Enter specification and preview
    const textarea = page.locator('textarea').first();
    await textarea.fill('Create a Slack bot');

    const previewButton = page.locator('button:has-text("Preview")');
    await previewButton.click();

    // Wait for error to appear
    await page.waitForTimeout(1000);

    // Check for error message
    await expect(page.locator('.bg-red-900\\/20.border.border-red-500')).toBeVisible({ timeout: 5000 });
  });

  test('platform selector changes platform selection', async ({ page }) => {
    await page.goto('/settings/agent-builder');

    // Generate agent
    const textarea = page.locator('textarea').first();
    await textarea.fill('Create a bot');

    const generateButton = page.locator('button:has-text("Generate Agent")');
    await generateButton.click();

    await page.waitForTimeout(1500);

    // Find platform selector (not the first select which might be something else)
    const platformSelects = await page.locator('select').all();
    const platformSelect = platformSelects[platformSelects.length - 1];

    // Change platform
    await platformSelect.selectOption('telegram');

    // Wait for change to register
    await page.waitForTimeout(500);

    // Verify selection
    const selectedValue = await platformSelect.inputValue();
    expect(selectedValue).toBe('telegram');
  });

  test('specification field clears after successful deployment', async ({ page }) => {
    await page.goto('/settings/agent-builder');

    // Enter specification and generate
    const textarea = page.locator('textarea').first();
    await textarea.fill('Create a Slack bot');

    const generateButton = page.locator('button:has-text("Generate Agent")');
    await generateButton.click();

    await page.waitForTimeout(1500);

    // Deploy - find deploy button in generated section
    const generatedSection = page.locator('.bg-green-900\\/20.border.border-green-500');
    const deployButton = generatedSection.locator('button:has-text("Deploy")');
    await deployButton.click();

    await page.waitForTimeout(1000);

    // Check that specification field is cleared
    const value = await textarea.inputValue();
    expect(value).toBe('');
  });

  test('template categories are displayed', async ({ page }) => {
    await page.goto('/settings/agent-builder');

    // Wait for templates to load
    await page.waitForTimeout(1000);

    // Check for category badges within the templates section - use more specific selectors
    const templatesSection = page.locator('.lg\\:col-span-1').first();
    await expect(templatesSection.locator('span.text-xs', { hasText: 'automation' })).toBeVisible();
    await expect(templatesSection.locator('span.text-xs', { hasText: 'support' })).toBeVisible();
  });

  test('template platforms are displayed', async ({ page }) => {
    await page.goto('/settings/agent-builder');

    // Wait for templates to load
    await page.waitForTimeout(1000);

    // Check for platform badges within the templates section
    const templatesSection = page.locator('.lg\\:col-span-1').first();
    await expect(templatesSection.locator('span.text-xs', { hasText: 'slack' })).toBeVisible();
    await expect(templatesSection.locator('span.text-xs', { hasText: 'telegram' })).toBeVisible();
  });
});
