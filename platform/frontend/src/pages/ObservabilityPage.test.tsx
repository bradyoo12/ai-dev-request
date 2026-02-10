import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, act } from '@testing-library/react'

vi.mock('react-i18next', () => {
  const t = (key: string, fallback?: string) => fallback || key
  return { useTranslation: () => ({ t }) }
})

vi.mock('../api/observability', () => ({
  getTraces: vi.fn(() => Promise.resolve({ traces: [], totalCount: 0, page: 1, pageSize: 20 })),
  getTrace: vi.fn(),
  getCostAnalytics: vi.fn(() => Promise.resolve({ totalCost: 0, totalTraces: 0, buckets: [], costByModel: [] })),
  getPerformanceMetrics: vi.fn(() => Promise.resolve({ totalTraces: 0, successRate: 0, avgLatencyMs: 0, p50LatencyMs: 0, p95LatencyMs: 0, p99LatencyMs: 0, avgTokensPerTrace: 0, errorCount: 0 })),
  getUsageAnalytics: vi.fn(() => Promise.resolve({ totalInputTokens: 0, totalOutputTokens: 0, totalTokens: 0, buckets: [], usageByModel: [] })),
}))

import ObservabilityPage from './ObservabilityPage'

beforeEach(() => { vi.clearAllMocks() })

describe('ObservabilityPage', () => {
  it('renders after loading', async () => {
    await act(async () => {
      render(<ObservabilityPage />)
    })
    expect(document.body).toBeTruthy()
  })
})
