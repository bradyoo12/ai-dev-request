import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('./auth', () => ({
  getAuthHeaders: () => ({ 'Content-Type': 'application/json', Authorization: 'Bearer test' }),
}))

const mockFetch = vi.fn()
global.fetch = mockFetch

beforeEach(() => { vi.clearAllMocks() })

import { getGrowthOverview, getGrowthTrends, getGrowthFunnel, exportGrowthCsv } from './growth'

describe('growth api', () => {
  describe('getGrowthOverview', () => {
    it('returns overview', async () => {
      const data = { totalVisitors: 1000, totalRegistered: 500 }
      mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(data) })
      expect(await getGrowthOverview()).toEqual(data)
    })
    it('throws on failure', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false })
      await expect(getGrowthOverview()).rejects.toThrow()
    })
  })

  describe('getGrowthTrends', () => {
    it('returns trends', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve([]) })
      expect(await getGrowthTrends()).toEqual([])
    })
    it('includes months param', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve([]) })
      await getGrowthTrends(6)
      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('months=6'), expect.anything())
    })
    it('throws on failure', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false })
      await expect(getGrowthTrends()).rejects.toThrow()
    })
  })

  describe('getGrowthFunnel', () => {
    it('returns funnel', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve([]) })
      expect(await getGrowthFunnel()).toEqual([])
    })
    it('throws on failure', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false })
      await expect(getGrowthFunnel()).rejects.toThrow()
    })
  })

  describe('exportGrowthCsv', () => {
    it('downloads CSV', async () => {
      const blob = new Blob(['csv data'])
      const mockUrl = 'blob:http://localhost/test'
      const mockElement = { href: '', download: '', click: vi.fn() }

      vi.stubGlobal('URL', { createObjectURL: vi.fn(() => mockUrl), revokeObjectURL: vi.fn() })
      vi.spyOn(document, 'createElement').mockReturnValueOnce(mockElement as unknown as HTMLElement)

      mockFetch.mockResolvedValueOnce({ ok: true, blob: () => Promise.resolve(blob) })
      await exportGrowthCsv()
      expect(mockElement.click).toHaveBeenCalled()
    })
    it('throws on failure', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false })
      await expect(exportGrowthCsv()).rejects.toThrow()
    })
  })
})
