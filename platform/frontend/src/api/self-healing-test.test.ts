import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../i18n', () => ({ default: { t: (key: string) => key } }))
vi.mock('./auth', () => ({
  getAuthHeaders: () => ({ 'Content-Type': 'application/json', Authorization: 'Bearer test' }),
}))

const mockFetch = vi.fn()
global.fetch = mockFetch

beforeEach(() => { vi.clearAllMocks() })

import {
  triggerSelfHealing,
  getSelfHealingResults,
  getSelfHealingHistory,
  repairLocators,
  getHealingTimeline,
} from './self-healing-test'

describe('self-healing-test api', () => {
  describe('triggerSelfHealing', () => {
    it('triggers self-healing analysis', async () => {
      const data = { id: 'heal-1', devRequestId: 'req-1', status: 'completed', totalTests: 10 }
      mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(data) })
      expect(await triggerSelfHealing('req-1')).toEqual(data)
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/projects/req-1/tests/heal'),
        expect.objectContaining({ method: 'POST' })
      )
    })
    it('throws on failure', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false, json: () => Promise.resolve({ error: 'Healing failed' }) })
      await expect(triggerSelfHealing('req-1')).rejects.toThrow('Healing failed')
    })
  })

  describe('getSelfHealingResults', () => {
    it('returns self-healing results', async () => {
      const data = { id: 'heal-1', status: 'completed', healedTests: 3 }
      mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(data) })
      expect(await getSelfHealingResults('req-1')).toEqual(data)
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/projects/req-1/tests/heal/results'),
        expect.any(Object)
      )
    })
    it('returns null on failure', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false })
      expect(await getSelfHealingResults('req-1')).toBeNull()
    })
  })

  describe('getSelfHealingHistory', () => {
    it('returns healing history', async () => {
      const data = [
        { id: 'heal-2', analysisVersion: 2 },
        { id: 'heal-1', analysisVersion: 1 },
      ]
      mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(data) })
      expect(await getSelfHealingHistory('req-1')).toEqual(data)
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/projects/req-1/tests/heal/history'),
        expect.any(Object)
      )
    })
    it('returns empty array on failure', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false })
      expect(await getSelfHealingHistory('req-1')).toEqual([])
    })
  })

  describe('repairLocators', () => {
    it('repairs broken locators', async () => {
      const data = {
        repairedLocators: [
          { testFile: 'test.spec.ts', testName: 'test1', originalLocator: '.old', repairedLocatorValue: '[data-testid="new"]', strategy: 'data-testid', confidence: 95, reason: 'Used data-testid' },
        ],
        totalRepaired: 1,
        totalFailed: 0,
        overallConfidence: 95,
        summary: 'All locators repaired',
      }
      mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(data) })

      const brokenLocators = [
        { testFile: 'test.spec.ts', testName: 'test1', originalLocator: '.old' },
      ]
      expect(await repairLocators('req-1', brokenLocators)).toEqual(data)
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/projects/req-1/tests/heal/repair-locators'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ brokenLocators }),
        })
      )
    })
    it('throws on failure', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false, json: () => Promise.resolve({ error: 'Repair failed' }) })
      await expect(repairLocators('req-1', [])).rejects.toThrow('Repair failed')
    })
  })

  describe('getHealingTimeline', () => {
    it('returns healing timeline', async () => {
      const data = [
        { id: 't1', action: 'healed', testName: 'test1', confidence: 90 },
        { id: 't2', action: 'failed', testName: 'test2', confidence: 0 },
      ]
      mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(data) })
      expect(await getHealingTimeline('req-1')).toEqual(data)
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/projects/req-1/tests/heal/timeline'),
        expect.any(Object)
      )
    })
    it('returns empty array on failure', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false })
      expect(await getHealingTimeline('req-1')).toEqual([])
    })
  })
})
