import { Page } from '@playwright/test';

/**
 * Mock authentication helper for E2E tests
 * Sets localStorage with mock user and JWT token to bypass authentication
 */
export async function mockAuthentication(page: Page) {
  await page.evaluate(() => {
    const mockUser = {
      id: 'test-user-e2e-123',
      email: 'e2e-test@example.com',
      displayName: 'E2E Test User',
      isAdmin: false,
      createdAt: new Date().toISOString(),
    };
    localStorage.setItem('ai-dev-user', JSON.stringify(mockUser));
    localStorage.setItem('ai-dev-jwt', 'mock-jwt-token-e2e-testing');
  });
}

/**
 * Clear authentication state
 */
export async function clearAuthentication(page: Page) {
  await page.evaluate(() => {
    localStorage.removeItem('ai-dev-user');
    localStorage.removeItem('ai-dev-jwt');
  });
}
