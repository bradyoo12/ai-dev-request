import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../i18n', () => ({ default: { t: (key: string) => key } }))
vi.mock('./auth', () => ({
  getAuthHeaders: () => ({ 'Content-Type': 'application/json', Authorization: 'Bearer test' }),
}))

const mockFetch = vi.fn()
global.fetch = mockFetch

beforeEach(() => { vi.clearAllMocks() })

import {
  analyzeTestFailure,
  getHealingHistory,
  getReviewQueue,
  approveHealing,
  rejectHealing,
  getHealingSettings,
  updateHealingSettings,
  getHealingStats,
} from './test-healing'

describe('test-healing api', () => {
  describe('analyzeTestFailure', () => {
    it('sends analysis request', async () => {
      const data = { id: 'abc-123', projectId: 1, status: 'healed', confidenceScore: 95 }
      mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(data) })
      const result = await analyzeTestFailure(1, {
        testFilePath: 'tests/login.spec.ts',
        originalSelector: '.login-btn',
        failureReason: 'Element not found',
      })
      expect(result).toEqual(data)
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/projects/1/test-healing/analyze'),
        expect.objectContaining({ method: 'POST' })
      )
    })
    it('throws on failure', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false, json: () => Promise.resolve({ error: 'Analysis failed' }) })
      await expect(analyzeTestFailure(1, {
        testFilePath: 'tests/login.spec.ts',
        originalSelector: '.login-btn',
        failureReason: 'Element not found',
      })).rejects.toThrow('Analysis failed')
    })
  })

  describe('getHealingHistory', () => {
    it('returns healing history', async () => {
      const data = [{ id: 'abc-123', status: 'healed', healingVersion: 1 }]
      mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(data) })
      expect(await getHealingHistory(1)).toEqual(data)
    })
    it('returns empty on failure', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false })
      expect(await getHealingHistory(1)).toEqual([])
    })
  })

  describe('getReviewQueue', () => {
    it('returns review queue', async () => {
      const data = [{ id: 'abc-123', status: 'needs_review', confidenceScore: 60 }]
      mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(data) })
      expect(await getReviewQueue(1)).toEqual(data)
    })
    it('returns empty on failure', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false })
      expect(await getReviewQueue(1)).toEqual([])
    })
  })

  describe('approveHealing', () => {
    it('approves a healing', async () => {
      const data = { id: 'abc-123', isApproved: true, status: 'healed' }
      mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(data) })
      expect(await approveHealing(1, 'abc-123')).toEqual(data)
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/projects/1/test-healing/abc-123/approve'),
        expect.objectContaining({ method: 'POST' })
      )
    })
    it('returns null on failure', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false })
      expect(await approveHealing(1, 'abc-123')).toBeNull()
    })
  })

  describe('rejectHealing', () => {
    it('rejects a healing', async () => {
      const data = { id: 'abc-123', isRejected: true, status: 'failed' }
      mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(data) })
      expect(await rejectHealing(1, 'abc-123')).toEqual(data)
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/projects/1/test-healing/abc-123/reject'),
        expect.objectContaining({ method: 'POST' })
      )
    })
    it('returns null on failure', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false })
      expect(await rejectHealing(1, 'abc-123')).toBeNull()
    })
  })

  describe('getHealingSettings', () => {
    it('returns settings', async () => {
      const data = { autoHealEnabled: true, confidenceThreshold: 80 }
      mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(data) })
      expect(await getHealingSettings(1)).toEqual(data)
    })
    it('returns defaults on failure', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false })
      const result = await getHealingSettings(1)
      expect(result.autoHealEnabled).toBe(true)
      expect(result.confidenceThreshold).toBe(80)
    })
  })

  describe('updateHealingSettings', () => {
    it('updates settings', async () => {
      const data = { autoHealEnabled: false, confidenceThreshold: 90 }
      mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(data) })
      const settings = {
        autoHealEnabled: false,
        confidenceThreshold: 90,
        autoApproveHighConfidence: true,
        notifyOnLowConfidence: true,
        preferredLocatorStrategy: 'intent',
        maxHealingAttempts: 3,
      }
      expect(await updateHealingSettings(1, settings)).toEqual(data)
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/projects/1/test-healing/settings'),
        expect.objectContaining({ method: 'PUT' })
      )
    })
    it('throws on failure', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false })
      const settings = {
        autoHealEnabled: true,
        confidenceThreshold: 80,
        autoApproveHighConfidence: true,
        notifyOnLowConfidence: true,
        preferredLocatorStrategy: 'intent',
        maxHealingAttempts: 3,
      }
      await expect(updateHealingSettings(1, settings)).rejects.toThrow()
    })
  })

  describe('getHealingStats', () => {
    it('returns stats', async () => {
      const data = { totalAnalyzed: 10, autoHealed: 8, needsReview: 1, failed: 1, averageConfidence: 85, healingRate: 80 }
      mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(data) })
      expect(await getHealingStats(1)).toEqual(data)
    })
    it('returns zeros on failure', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false })
      const result = await getHealingStats(1)
      expect(result.totalAnalyzed).toBe(0)
      expect(result.healingRate).toBe(0)
    })
  })
})
