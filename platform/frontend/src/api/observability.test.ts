import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../i18n', () => ({ default: { t: (key: string) => key } }))
vi.mock('./auth', () => ({
  getAuthHeaders: () => ({ 'Content-Type': 'application/json', Authorization: 'Bearer test' }),
}))

const mockFetch = vi.fn()
global.fetch = mockFetch

beforeEach(() => { vi.clearAllMocks() })

import { getTraces, getTrace, getCostAnalytics, getPerformanceMetrics, getUsageAnalytics } from './observability'

describe('observability api', () => {
  describe('getTraces', () => {
    it('returns trace list', async () => {
      const data = { traces: [], totalCount: 0, page: 1, pageSize: 20 }
      mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(data) })
      expect(await getTraces()).toEqual(data)
    })

    it('passes filters to query params', async () => {
      const data = { traces: [], totalCount: 0, page: 1, pageSize: 20 }
      mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(data) })
      await getTraces(2, 10, 'completed', 'sonnet')
      const url = mockFetch.mock.calls[0][0] as string
      expect(url).toContain('page=2')
      expect(url).toContain('pageSize=10')
      expect(url).toContain('status=completed')
      expect(url).toContain('model=sonnet')
    })

    it('throws on failure', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false })
      await expect(getTraces()).rejects.toThrow()
    })
  })

  describe('getTrace', () => {
    it('returns trace detail', async () => {
      const data = { traceId: 'abc', spans: [], totalTokens: 100 }
      mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(data) })
      expect(await getTrace('abc')).toEqual(data)
    })

    it('throws on failure', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false })
      await expect(getTrace('abc')).rejects.toThrow()
    })
  })

  describe('getCostAnalytics', () => {
    it('returns cost analytics', async () => {
      const data = { totalCost: 1.5, totalTraces: 10, buckets: [], costByModel: [] }
      mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(data) })
      expect(await getCostAnalytics()).toEqual(data)
    })

    it('passes date range and granularity', async () => {
      const data = { totalCost: 0, totalTraces: 0, buckets: [], costByModel: [] }
      mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(data) })
      await getCostAnalytics('2026-01-01', '2026-01-31', 'weekly')
      const url = mockFetch.mock.calls[0][0] as string
      expect(url).toContain('startDate=2026-01-01')
      expect(url).toContain('endDate=2026-01-31')
      expect(url).toContain('granularity=weekly')
    })

    it('throws on failure', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false })
      await expect(getCostAnalytics()).rejects.toThrow()
    })
  })

  describe('getPerformanceMetrics', () => {
    it('returns metrics', async () => {
      const data = { totalTraces: 50, successRate: 98.0, avgLatencyMs: 1200 }
      mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(data) })
      expect(await getPerformanceMetrics()).toEqual(data)
    })

    it('throws on failure', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false })
      await expect(getPerformanceMetrics()).rejects.toThrow()
    })
  })

  describe('getUsageAnalytics', () => {
    it('returns usage data', async () => {
      const data = { totalInputTokens: 1000, totalOutputTokens: 500, totalTokens: 1500, buckets: [], usageByModel: [] }
      mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(data) })
      expect(await getUsageAnalytics()).toEqual(data)
    })

    it('throws on failure', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false })
      await expect(getUsageAnalytics()).rejects.toThrow()
    })
  })
})
