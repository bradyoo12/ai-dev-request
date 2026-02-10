import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../i18n', () => ({ default: { t: (key: string) => key } }))
vi.mock('./auth', () => ({
  getAuthHeaders: () => ({ 'Content-Type': 'application/json', Authorization: 'Bearer test' }),
}))

const mockFetch = vi.fn()
global.fetch = mockFetch

beforeEach(() => { vi.clearAllMocks() })

import { getPreferences, setPreference, deletePreference, deleteAllPreferences, getPreferenceSummary, regenerateSummary } from './preferences'

describe('preferences api', () => {
  describe('getPreferences', () => {
    it('returns preferences', async () => {
      const data = { preferences: [], totalCount: 0 }
      mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(data) })
      expect(await getPreferences()).toEqual(data)
    })
    it('includes category filter', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ preferences: [], totalCount: 0 }) })
      await getPreferences('framework')
      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('category=framework'), expect.anything())
    })
    it('throws on failure', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false })
      await expect(getPreferences()).rejects.toThrow()
    })
  })

  describe('setPreference', () => {
    it('sets preference', async () => {
      const data = { id: 1, category: 'framework', key: 'lang', value: 'react' }
      mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(data) })
      expect(await setPreference({ category: 'framework', key: 'lang', value: 'react' })).toEqual(data)
    })
    it('throws on failure', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false, json: () => Promise.resolve({}) })
      await expect(setPreference({ category: 'a', key: 'b', value: 'c' })).rejects.toThrow()
    })
  })

  describe('deletePreference', () => {
    it('deletes preference', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true })
      await expect(deletePreference(1)).resolves.toBeUndefined()
    })
    it('throws on failure', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false })
      await expect(deletePreference(1)).rejects.toThrow()
    })
  })

  describe('deleteAllPreferences', () => {
    it('deletes all', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true })
      await expect(deleteAllPreferences()).resolves.toBeUndefined()
    })
    it('throws on failure', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false })
      await expect(deleteAllPreferences()).rejects.toThrow()
    })
  })

  describe('getPreferenceSummary', () => {
    it('returns summary', async () => {
      const data = { summaryText: 'test', lastUpdatedAt: '2024-01-01' }
      mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(data) })
      expect(await getPreferenceSummary()).toEqual(data)
    })
    it('throws on failure', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false })
      await expect(getPreferenceSummary()).rejects.toThrow()
    })
  })

  describe('regenerateSummary', () => {
    it('regenerates summary', async () => {
      const data = { summaryText: 'new', lastUpdatedAt: '2024-01-02' }
      mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(data) })
      expect(await regenerateSummary()).toEqual(data)
    })
    it('throws on failure', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false })
      await expect(regenerateSummary()).rejects.toThrow()
    })
  })
})
