import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../i18n', () => ({ default: { t: (key: string) => key } }))
vi.mock('./auth', () => ({
  getAuthHeaders: () => ({ 'Content-Type': 'application/json', Authorization: 'Bearer test' }),
}))

const mockFetch = vi.fn()
global.fetch = mockFetch

beforeEach(() => { vi.clearAllMocks() })

import { getHostingPlans, getRecommendedPlan } from './hosting'

describe('hosting api', () => {
  describe('getHostingPlans', () => {
    it('returns plans', async () => {
      const data = [{ id: 1, name: 'free', displayName: 'Free' }]
      mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(data) })
      expect(await getHostingPlans()).toEqual(data)
    })
    it('throws on failure', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false })
      await expect(getHostingPlans()).rejects.toThrow()
    })
  })

  describe('getRecommendedPlan', () => {
    it('returns recommended plan', async () => {
      const data = { id: 2, name: 'starter' }
      mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(data) })
      expect(await getRecommendedPlan('medium')).toEqual(data)
    })
    it('throws on failure', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false })
      await expect(getRecommendedPlan('simple')).rejects.toThrow()
    })
  })
})
