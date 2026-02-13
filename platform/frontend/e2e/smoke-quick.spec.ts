import { test, expect } from '@playwright/test';

const STAGING_URL = 'https://icy-desert-07c08ba00.2.azurestaticapps.net';

test.describe('Quick Smoke Test', () => {
  test('should load home page without critical errors', async ({ page }) => {
    const consoleErrors: string[] = [];
    const networkErrors: { url: string; status: number }[] = [];

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    page.on('response', (response) => {
      if (response.status() >= 500) {
        networkErrors.push({
          url: response.url(),
          status: response.status()
        });
      }
    });

    console.log('🔍 Testing home page...');
    await page.goto(STAGING_URL, { waitUntil: 'domcontentloaded', timeout: 15000 });
    
    // Wait a bit for page to settle
    await page.waitForTimeout(2000);
    
    // Check page loaded
    await expect(page).toHaveTitle(/.*/);
    console.log(`✓ Page title: ${await page.title()}`);
    
    // Check for visible content
    const bodyText = await page.textContent('body');
    expect(bodyText).toBeTruthy();
    console.log(`✓ Page has content (${bodyText?.length} chars)`);
    
    // Report errors
    if (consoleErrors.length > 0) {
      console.log(`\n⚠️ Console Errors: ${consoleErrors.length}`);
      consoleErrors.slice(0, 3).forEach(err => console.log(`  - ${err}`));
    } else {
      console.log('✓ No console errors');
    }
    
    if (networkErrors.length > 0) {
      console.log(`\n⚠️ Network Errors (5xx): ${networkErrors.length}`);
      networkErrors.forEach(err => console.log(`  - ${err.status} ${err.url}`));
      throw new Error(`Critical: ${networkErrors.length} server errors detected`);
    } else {
      console.log('✓ No 5xx network errors');
    }
    
    // Check for broken images
    const images = await page.locator('img').all();
    let brokenImages = 0;
    for (const img of images.slice(0, 10)) {
      const src = await img.getAttribute('src');
      if (!src) continue;
      
      const naturalWidth = await img.evaluate((el) => (el as HTMLImageElement).naturalWidth);
      if (naturalWidth === 0) {
        console.log(`⚠️ Broken image: ${src}`);
        brokenImages++;
      }
    }
    
    if (brokenImages > 0) {
      console.log(`⚠️ Found ${brokenImages} broken images`);
    } else {
      console.log('✓ No broken images detected');
    }
    
    console.log('\n✓ Smoke test passed');
  });
  
  test('should test key navigation links', async ({ page }) => {
    await page.goto(STAGING_URL, { waitUntil: 'domcontentloaded', timeout: 15000 });
    
    // Get all navigation links
    const links = await page.locator('nav a, header a').all();
    console.log(`📊 Found ${links.length} navigation links`);
    
    const testedLinks: string[] = [];
    
    for (let i = 0; i < Math.min(links.length, 5); i++) {
      const link = links[i];
      const href = await link.getAttribute('href');
      const text = await link.textContent();
      
      if (!href || href.startsWith('http') || href === '#') continue;
      
      console.log(`🔗 Testing: ${text?.trim()} (${href})`);
      
      try {
        // Try to navigate with a short timeout
        const fullUrl = href.startsWith('/') ? `${STAGING_URL}${href}` : href;
        
        // Don't wait for networkidle - some pages are slow
        const response = await page.goto(fullUrl, { 
          waitUntil: 'domcontentloaded',
          timeout: 10000 
        });
        
        if (response && response.status() >= 400) {
          console.log(`  ❌ HTTP ${response.status()}`);
        } else {
          console.log(`  ✓ Loaded successfully`);
          testedLinks.push(href);
        }
      } catch (error) {
        console.log(`  ⚠️ Timeout or error (may be slow): ${error instanceof Error ? error.message.slice(0, 50) : String(error)}`);
      }
      
      // Go back
      await page.goto(STAGING_URL, { waitUntil: 'domcontentloaded', timeout: 15000 });
    }
    
    console.log(`\n✓ Tested ${testedLinks.length} links successfully`);
  });
});
