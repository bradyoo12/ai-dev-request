import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('./auth', () => ({
  getAuthHeaders: () => ({ 'Content-Type': 'application/json', Authorization: 'Bearer test' }),
}))

const mockFetch = vi.fn()
global.fetch = mockFetch

beforeEach(() => { vi.clearAllMocks() })

import { getChurnOverview, getChurnTrends, getChurnByPlan, getSubscriptionEvents, exportChurnCsv } from './admin'

describe('admin api', () => {
  describe('getChurnOverview', () => {
    it('returns overview', async () => {
      const data = { activeSubscribers: 100, churnRate: 5 }
      mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(data) })
      expect(await getChurnOverview()).toEqual(data)
    })
    it('throws on failure', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false })
      await expect(getChurnOverview()).rejects.toThrow()
    })
  })

  describe('getChurnTrends', () => {
    it('returns trends', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve([]) })
      expect(await getChurnTrends()).toEqual([])
    })
    it('includes months param', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve([]) })
      await getChurnTrends(6)
      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('months=6'), expect.anything())
    })
    it('throws on failure', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false })
      await expect(getChurnTrends()).rejects.toThrow()
    })
  })

  describe('getChurnByPlan', () => {
    it('returns churn by plan', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve([]) })
      expect(await getChurnByPlan()).toEqual([])
    })
    it('throws on failure', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false })
      await expect(getChurnByPlan()).rejects.toThrow()
    })
  })

  describe('getSubscriptionEvents', () => {
    it('returns events', async () => {
      const data = { items: [], total: 0, page: 1, pageSize: 20 }
      mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(data) })
      expect(await getSubscriptionEvents()).toEqual(data)
    })
    it('includes filters', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ items: [], total: 0, page: 1, pageSize: 20 }) })
      await getSubscriptionEvents(1, 20, 'churn', 'pro')
      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('eventType=churn'), expect.anything())
    })
    it('throws on failure', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false })
      await expect(getSubscriptionEvents()).rejects.toThrow()
    })
  })

  describe('exportChurnCsv', () => {
    it('downloads CSV', async () => {
      const blob = new Blob(['csv data'])
      const mockUrl = 'blob:http://localhost/test'
      const mockElement = { href: '', download: '', click: vi.fn() }

      vi.stubGlobal('URL', { createObjectURL: vi.fn(() => mockUrl), revokeObjectURL: vi.fn() })
      vi.spyOn(document, 'createElement').mockReturnValueOnce(mockElement as unknown as HTMLElement)

      mockFetch.mockResolvedValueOnce({ ok: true, blob: () => Promise.resolve(blob) })
      await exportChurnCsv()
      expect(mockElement.click).toHaveBeenCalled()
    })
    it('throws on failure', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false })
      await expect(exportChurnCsv()).rejects.toThrow()
    })
  })
})
