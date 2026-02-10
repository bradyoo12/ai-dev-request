import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../i18n', () => ({ default: { t: (key: string) => key } }))
vi.mock('./auth', () => ({
  getAuthHeaders: () => ({ 'Content-Type': 'application/json', Authorization: 'Bearer test' }),
}))

const mockFetch = vi.fn()
global.fetch = mockFetch

beforeEach(() => { vi.clearAllMocks() })

import {
  recordAnalyticsEvent,
  getDashboardMetrics,
  getFunnelData,
  getUsageBreakdown,
  getTrends,
} from './analytics-dashboard'

describe('analytics-dashboard api', () => {
  describe('recordAnalyticsEvent', () => {
    it('records an event successfully', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true })
      await recordAnalyticsEvent({ eventType: 'page_view', page: '/home' })
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/analytics/events'),
        expect.objectContaining({ method: 'POST' })
      )
    })
    it('throws on failure', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false, json: () => Promise.resolve({ error: 'Bad request' }) })
      await expect(recordAnalyticsEvent({ eventType: '' })).rejects.toThrow('Bad request')
    })
  })

  describe('getDashboardMetrics', () => {
    it('returns dashboard metrics', async () => {
      const data = { activeUsers: 42, totalRequests: 100, completionRate: 75.5, avgBuildTimeMinutes: 3.2, totalEvents: 500, period: 'weekly' }
      mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(data) })
      expect(await getDashboardMetrics('weekly')).toEqual(data)
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/analytics/dashboard?period=weekly'),
        expect.any(Object)
      )
    })
    it('throws on failure', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false, json: () => Promise.resolve({ error: 'Server error' }) })
      await expect(getDashboardMetrics()).rejects.toThrow('Server error')
    })
  })

  describe('getFunnelData', () => {
    it('returns funnel data', async () => {
      const data = { stages: [{ name: 'Request Created', count: 100, conversionRate: 100, dropOffRate: 0 }], period: 'weekly' }
      mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(data) })
      expect(await getFunnelData('weekly')).toEqual(data)
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/analytics/funnel?period=weekly'),
        expect.any(Object)
      )
    })
    it('throws on failure', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false, json: () => Promise.resolve({ error: 'Funnel error' }) })
      await expect(getFunnelData()).rejects.toThrow('Funnel error')
    })
  })

  describe('getUsageBreakdown', () => {
    it('returns usage breakdown', async () => {
      const data = [{ eventType: 'page_view', count: 200, uniqueUsers: 50 }]
      mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(data) })
      expect(await getUsageBreakdown('monthly')).toEqual(data)
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/analytics/usage?period=monthly'),
        expect.any(Object)
      )
    })
    it('returns empty array on failure', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false })
      expect(await getUsageBreakdown()).toEqual([])
    })
  })

  describe('getTrends', () => {
    it('returns trend data', async () => {
      const data = [{ date: '2026-02-10', value: 42 }, { date: '2026-02-11', value: 55 }]
      mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(data) })
      expect(await getTrends('weekly', 'active_users')).toEqual(data)
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/analytics/trends?period=weekly&metric=active_users'),
        expect.any(Object)
      )
    })
    it('returns empty array on failure', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false })
      expect(await getTrends()).toEqual([])
    })
  })
})
