import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../i18n', () => ({ default: { t: (key: string) => key } }))
vi.mock('./auth', () => ({
  getAuthHeaders: () => ({ 'Content-Type': 'application/json', Authorization: 'Bearer test' }),
}))

const mockFetch = vi.fn()
global.fetch = mockFetch

beforeEach(() => { vi.clearAllMocks() })

import { getRecommendations, refreshRecommendations, dismissRecommendation, getInterests, addInterest, deleteInterest } from './recommendations'

describe('recommendations api', () => {
  describe('getRecommendations', () => {
    it('returns recommendations', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve([]) })
      expect(await getRecommendations()).toEqual([])
    })
    it('throws on failure', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false })
      await expect(getRecommendations()).rejects.toThrow()
    })
  })

  describe('refreshRecommendations', () => {
    it('refreshes recommendations', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve([]) })
      expect(await refreshRecommendations()).toEqual([])
    })
    it('throws on failure', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false })
      await expect(refreshRecommendations()).rejects.toThrow()
    })
  })

  describe('dismissRecommendation', () => {
    it('dismisses recommendation', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true })
      await expect(dismissRecommendation(1)).resolves.toBeUndefined()
    })
    it('throws on failure', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false })
      await expect(dismissRecommendation(1)).rejects.toThrow()
    })
  })

  describe('getInterests', () => {
    it('returns interests', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve([]) })
      expect(await getInterests()).toEqual([])
    })
    it('throws on failure', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false })
      await expect(getInterests()).rejects.toThrow()
    })
  })

  describe('addInterest', () => {
    it('adds interest', async () => {
      const data = { id: 1, category: 'ai' }
      mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(data) })
      expect(await addInterest({ category: 'ai' })).toEqual(data)
    })
    it('throws on failure', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false })
      await expect(addInterest({ category: 'ai' })).rejects.toThrow()
    })
  })

  describe('deleteInterest', () => {
    it('deletes interest', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true })
      await expect(deleteInterest(1)).resolves.toBeUndefined()
    })
    it('throws on failure', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false })
      await expect(deleteInterest(1)).rejects.toThrow()
    })
  })
})
