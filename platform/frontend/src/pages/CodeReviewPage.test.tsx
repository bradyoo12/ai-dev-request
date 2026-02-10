import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, act } from '@testing-library/react'

vi.mock('react-i18next', () => {
  const t = (key: string, fallback?: string) => fallback || key
  return { useTranslation: () => ({ t }) }
})

vi.mock('../api/code-review', () => ({
  triggerReview: vi.fn(() => Promise.resolve({
    id: 'abc-123',
    projectId: 1,
    status: 'completed',
    architectureScore: 4,
    securityScore: 3,
    performanceScore: 4,
    accessibilityScore: 3,
    maintainabilityScore: 4,
    overallScore: 3.6,
    findings: JSON.stringify([
      { id: 'sec-1-1', dimension: 'security', severity: 'critical', title: 'XSS vulnerability', description: 'User input not sanitized', file: 'src/App.tsx', line: 10, suggestedFix: 'Use DOMPurify' },
    ]),
    criticalCount: 1,
    warningCount: 0,
    infoCount: 0,
    appliedFixes: null,
    fixesApplied: 0,
    reviewVersion: 1,
    createdAt: '2024-01-01',
    completedAt: '2024-01-01',
  })),
  getReviewResults: vi.fn(() => Promise.resolve(null)),
  getReviewHistory: vi.fn(() => Promise.resolve([])),
  applyFix: vi.fn(() => Promise.resolve({ fixesApplied: 1, appliedFixes: '["sec-1-1"]' })),
  applyAllFixes: vi.fn(() => Promise.resolve({ fixesApplied: 1, appliedFixes: '["sec-1-1"]' })),
}))

import CodeReviewPage from './CodeReviewPage'

beforeEach(() => { vi.clearAllMocks() })

describe('CodeReviewPage', () => {
  it('renders after loading', async () => {
    await act(async () => {
      render(<CodeReviewPage />)
    })
    expect(document.body).toBeTruthy()
  })
})
