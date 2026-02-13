const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  const errors = [];
  const checkedUrls = new Set();

  // Listen for console errors
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push({ type: 'console', message: msg.text(), url: page.url() });
    }
  });

  // Listen for page errors
  page.on('pageerror', error => {
    errors.push({ type: 'page', message: error.message, url: page.url() });
  });

  // Listen for failed requests
  page.on('response', response => {
    if (response.status() >= 400) {
      errors.push({
        type: 'network',
        status: response.status(),
        url: response.url()
      });
    }
  });

  const baseUrl = 'https://icy-desert-07c08ba00.2.azurestaticapps.net';

  // Test main pages
  const pagesToTest = [
    '/',
    '/settings',
    '/settings/database-branching',
    '/settings/ai-model',
    '/settings/billing'
  ];

  for (const path of pagesToTest) {
    const url = baseUrl + path;
    if (checkedUrls.has(url)) continue;
    checkedUrls.add(url);

    try {
      console.log(`Testing: ${url}`);
      await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
      await page.waitForTimeout(2000);
    } catch (error) {
      errors.push({ type: 'navigation', message: error.message, url });
    }
  }

  await browser.close();

  // Report errors
  if (errors.length > 0) {
    console.log('\n=== ERRORS FOUND ===');
    errors.forEach((err, idx) => {
      console.log(`\n${idx + 1}. [${err.type}] ${err.message || err.status}`);
      console.log(`   URL: ${err.url}`);
    });
    process.exit(1);
  } else {
    console.log('\n✅ No errors found');
    process.exit(0);
  }
})();
