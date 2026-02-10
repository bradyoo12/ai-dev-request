import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../i18n', () => ({ default: { t: (key: string) => key } }))
vi.mock('./auth', () => ({
  getAuthHeaders: () => ({ 'Content-Type': 'application/json', Authorization: 'Bearer test' }),
}))

const mockFetch = vi.fn()
global.fetch = mockFetch

beforeEach(() => { vi.clearAllMocks() })

import { triggerReview, getReviewResults, getReviewHistory, applyFix, applyAllFixes } from './code-review'

describe('code-review api', () => {
  describe('triggerReview', () => {
    it('triggers a review', async () => {
      const data = { id: 'abc-123', projectId: 1, status: 'completed', overallScore: 3.8 }
      mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(data) })
      expect(await triggerReview(1)).toEqual(data)
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/projects/1/review'),
        expect.objectContaining({ method: 'POST' })
      )
    })
    it('throws on failure', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false, json: () => Promise.resolve({ error: 'Review failed' }) })
      await expect(triggerReview(1)).rejects.toThrow('Review failed')
    })
  })

  describe('getReviewResults', () => {
    it('returns review results', async () => {
      const data = { id: 'abc-123', status: 'completed', overallScore: 4.2 }
      mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(data) })
      expect(await getReviewResults(1)).toEqual(data)
    })
    it('returns null on failure', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false })
      expect(await getReviewResults(1)).toBeNull()
    })
  })

  describe('getReviewHistory', () => {
    it('returns review history', async () => {
      const data = [{ id: 'abc-123', reviewVersion: 1, status: 'completed' }]
      mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(data) })
      expect(await getReviewHistory(1)).toEqual(data)
    })
    it('returns empty on failure', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false })
      expect(await getReviewHistory(1)).toEqual([])
    })
  })

  describe('applyFix', () => {
    it('applies a fix', async () => {
      const data = { id: 'abc-123', fixesApplied: 1 }
      mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(data) })
      expect(await applyFix(1, 'sec-1-1')).toEqual(data)
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/projects/1/review/fix/sec-1-1'),
        expect.objectContaining({ method: 'POST' })
      )
    })
    it('throws on failure', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false, json: () => Promise.resolve({ error: 'Already applied' }) })
      await expect(applyFix(1, 'sec-1-1')).rejects.toThrow('Already applied')
    })
  })

  describe('applyAllFixes', () => {
    it('applies all fixes of a severity', async () => {
      const data = { id: 'abc-123', fixesApplied: 3 }
      mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(data) })
      expect(await applyAllFixes(1, 'critical')).toEqual(data)
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/projects/1/review/fix-all'),
        expect.objectContaining({ method: 'POST' })
      )
    })
    it('throws on failure', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false, json: () => Promise.resolve({ error: 'No review found' }) })
      await expect(applyAllFixes(1, 'critical')).rejects.toThrow('No review found')
    })
  })
})
