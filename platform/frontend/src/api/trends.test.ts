import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../i18n', () => ({ default: { t: (key: string) => key } }))
vi.mock('./auth', () => ({
  getAuthHeaders: () => ({ 'Content-Type': 'application/json', Authorization: 'Bearer test' }),
}))

const mockFetch = vi.fn()
global.fetch = mockFetch

beforeEach(() => { vi.clearAllMocks() })

import { getTrendReports, generateTrendReport, getUserReviews, reviewProject, getRecommendations, updateRecommendationStatus } from './trends'

describe('trends api', () => {
  describe('getTrendReports', () => {
    it('returns reports', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve([]) })
      expect(await getTrendReports()).toEqual([])
    })
    it('includes category filter', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve([]) })
      await getTrendReports('frontend')
      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('category=frontend'), expect.anything())
    })
    it('throws on failure', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false })
      await expect(getTrendReports()).rejects.toThrow()
    })
  })

  describe('generateTrendReport', () => {
    it('generates report', async () => {
      const data = { id: 1, category: 'frontend' }
      mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(data) })
      expect(await generateTrendReport('frontend')).toEqual(data)
    })
    it('throws on failure', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false })
      await expect(generateTrendReport('frontend')).rejects.toThrow()
    })
  })

  describe('getUserReviews', () => {
    it('returns reviews', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve([]) })
      expect(await getUserReviews()).toEqual([])
    })
    it('throws on failure', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false })
      await expect(getUserReviews()).rejects.toThrow()
    })
  })

  describe('reviewProject', () => {
    it('reviews project', async () => {
      const data = { id: 1, healthScore: 85 }
      mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(data) })
      expect(await reviewProject(1)).toEqual(data)
    })
    it('throws on failure', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false, json: () => Promise.resolve({}) })
      await expect(reviewProject(1)).rejects.toThrow()
    })
  })

  describe('getRecommendations', () => {
    it('returns recommendations', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve([]) })
      expect(await getRecommendations(1)).toEqual([])
    })
    it('throws on failure', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false })
      await expect(getRecommendations(1)).rejects.toThrow()
    })
  })

  describe('updateRecommendationStatus', () => {
    it('updates status', async () => {
      const data = { id: 1, status: 'accepted' }
      mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(data) })
      expect(await updateRecommendationStatus(1, 'accepted')).toEqual(data)
    })
    it('throws on failure', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false })
      await expect(updateRecommendationStatus(1, 'accepted')).rejects.toThrow()
    })
  })
})
