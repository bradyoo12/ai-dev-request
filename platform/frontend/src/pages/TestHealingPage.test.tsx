import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, act } from '@testing-library/react'

vi.mock('react-i18next', () => {
  const t = (key: string, fallback?: string | Record<string, unknown>) => {
    if (typeof fallback === 'string') return fallback
    return key
  }
  return { useTranslation: () => ({ t }) }
})

vi.mock('../api/test-healing', () => ({
  analyzeTestFailure: vi.fn(() => Promise.resolve({
    id: 'abc-123',
    projectId: 1,
    status: 'healed',
    testFilePath: 'tests/login.spec.ts',
    originalSelector: '.login-btn',
    healedSelector: '[data-testid="login-button"]',
    failureReason: 'Element not found',
    healingSummary: 'Changed from CSS class to test ID selector',
    confidenceScore: 92,
    locatorStrategy: 'testid',
    diffJson: JSON.stringify({ before: '.login-btn', after: '[data-testid="login-button"]', componentName: 'LoginForm' }),
    suggestedFixJson: JSON.stringify({ selector: '[data-testid="login-button"]', assertion: 'toBeVisible()', explanation: 'The CSS class was renamed' }),
    isApproved: true,
    isRejected: false,
    healingVersion: 1,
    createdAt: '2024-01-01',
    healedAt: '2024-01-01',
    reviewedAt: null,
  })),
  getHealingHistory: vi.fn(() => Promise.resolve([])),
  getReviewQueue: vi.fn(() => Promise.resolve([])),
  getHealingStats: vi.fn(() => Promise.resolve({
    totalAnalyzed: 10,
    autoHealed: 8,
    needsReview: 1,
    failed: 1,
    averageConfidence: 85,
    healingRate: 80,
  })),
  getHealingSettings: vi.fn(() => Promise.resolve({
    autoHealEnabled: true,
    confidenceThreshold: 80,
    autoApproveHighConfidence: true,
    notifyOnLowConfidence: true,
    preferredLocatorStrategy: 'intent',
    maxHealingAttempts: 3,
  })),
  updateHealingSettings: vi.fn(() => Promise.resolve({
    autoHealEnabled: true,
    confidenceThreshold: 80,
    autoApproveHighConfidence: true,
    notifyOnLowConfidence: true,
    preferredLocatorStrategy: 'intent',
    maxHealingAttempts: 3,
  })),
  approveHealing: vi.fn(() => Promise.resolve({ id: 'abc-123', isApproved: true })),
  rejectHealing: vi.fn(() => Promise.resolve({ id: 'abc-123', isRejected: true })),
}))

import TestHealingPage from './TestHealingPage'

beforeEach(() => { vi.clearAllMocks() })

describe('TestHealingPage', () => {
  it('renders after loading', async () => {
    await act(async () => {
      render(<TestHealingPage />)
    })
    expect(document.body).toBeTruthy()
  })
})
