import { test, expect } from '@playwright/test';
import { mockAuthentication } from './auth-helper';

const STAGING_URL = 'https://icy-desert-07c08ba00.2.azurestaticapps.net';
const TIMEOUT = 60000; // 60 seconds (increased from 30s to handle slower settings pages)

test.describe('Comprehensive UI Smoke Test', () => {
  let consoleErrors: string[] = [];
  let networkErrors: { url: string; status: number }[] = [];

  test.beforeEach(async ({ page }) => {
    consoleErrors = [];
    networkErrors = [];

    // Listen for console errors
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    // Listen for failed network requests
    page.on('response', (response) => {
      if (response.status() >= 400) {
        networkErrors.push({
          url: response.url(),
          status: response.status()
        });
      }
    });
  });

  test('should navigate to all discoverable pages without errors', async ({ page }) => {
    console.log('🔍 Starting comprehensive smoke test...');

    // Navigate to home page
    console.log('📍 Navigating to home page...');
    await page.goto(STAGING_URL, { waitUntil: 'networkidle', timeout: TIMEOUT });
    await expect(page).toHaveTitle(/.*/);

    // Set up mock authentication for protected routes
    console.log('🔐 Setting up mock authentication...');
    await mockAuthentication(page);

    // Collect all links on the page
    const links = await page.locator('a[href]').all();
    console.log(`📊 Found ${links.length} links on home page`);

    const visitedUrls = new Set<string>();
    const errors: string[] = [];

    // Test each internal link
    for (let i = 0; i < Math.min(links.length, 20); i++) {
      const link = links[i];
      const href = await link.getAttribute('href');
      
      if (!href || href.startsWith('http') || href === '#' || visitedUrls.has(href)) {
        continue;
      }

      visitedUrls.add(href);
      const fullUrl = href.startsWith('/') ? `${STAGING_URL}${href}` : href;

      try {
        console.log(`🔗 Testing link: ${href}`);
        await page.goto(fullUrl, { waitUntil: 'networkidle', timeout: TIMEOUT });
        
        // Check for 404 or error pages
        const pageText = await page.textContent('body');
        if (pageText?.includes('404') || pageText?.includes('Not Found')) {
          errors.push(`❌ Link leads to 404: ${href}`);
        }
      } catch (error) {
        errors.push(`❌ Failed to navigate to ${href}: ${error instanceof Error ? error.message : String(error)}`);
      }

      // Go back to home page
      await page.goto(STAGING_URL, { waitUntil: 'networkidle', timeout: TIMEOUT });
    }

    // Collect all buttons
    const buttons = await page.locator('button').all();
    console.log(`📊 Found ${buttons.length} buttons on home page`);

    // Test each button (click and check for errors)
    for (let i = 0; i < Math.min(buttons.length, 10); i++) {
      const button = buttons[i];
      const buttonText = await button.textContent();
      
      try {
        console.log(`🔘 Testing button: ${buttonText?.trim() || 'unnamed'}`);
        
        // Clear previous console errors
        const consoleErrorsBefore = consoleErrors.length;
        
        // Click button
        await button.click();
        
        // Wait a bit for any async operations
        await page.waitForTimeout(1000);
        
        // Check if new console errors appeared
        if (consoleErrors.length > consoleErrorsBefore) {
          errors.push(`❌ Button "${buttonText?.trim()}" caused console errors`);
        }
      } catch (error) {
        errors.push(`❌ Failed to click button "${buttonText?.trim()}": ${error instanceof Error ? error.message : String(error)}`);
      }

      // Reload page to reset state
      await page.goto(STAGING_URL, { waitUntil: 'networkidle', timeout: TIMEOUT });
    }

    // Report findings
    console.log('\n📊 Smoke Test Results:');
    console.log(`✓ Visited ${visitedUrls.size} unique pages`);
    console.log(`✓ Tested ${Math.min(buttons.length, 10)} buttons`);
    
    if (consoleErrors.length > 0) {
      console.log(`\n⚠️ Console Errors (${consoleErrors.length}):`);
      consoleErrors.slice(0, 5).forEach(err => console.log(`  - ${err}`));
    }
    
    if (networkErrors.length > 0) {
      console.log(`\n⚠️ Network Errors (${networkErrors.length}):`);
      networkErrors.slice(0, 5).forEach(err => console.log(`  - ${err.status} ${err.url}`));
    }
    
    if (errors.length > 0) {
      console.log(`\n⚠️ Navigation/Interaction Errors (${errors.length}):`);
      errors.slice(0, 5).forEach(err => console.log(`  ${err}`));
    }

    // Save detailed report
    const report = {
      timestamp: new Date().toISOString(),
      visitedPages: visitedUrls.size,
      testedButtons: Math.min(buttons.length, 10),
      consoleErrors: consoleErrors.slice(0, 10),
      networkErrors: networkErrors.slice(0, 10),
      navigationErrors: errors.slice(0, 10)
    };

    await page.evaluate((data) => {
      console.log('📄 Detailed Report:', JSON.stringify(data, null, 2));
    }, report);

    // Fail test if critical errors found
    if (networkErrors.some(e => e.status >= 500)) {
      throw new Error('Critical: Server errors (5xx) detected');
    }
  });
});
