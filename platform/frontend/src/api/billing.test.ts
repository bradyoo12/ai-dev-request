import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../i18n', () => ({ default: { t: (key: string) => key } }))
vi.mock('./auth', () => ({
  getAuthHeaders: () => ({ 'Content-Type': 'application/json', Authorization: 'Bearer test' }),
}))

const mockFetch = vi.fn()
global.fetch = mockFetch

beforeEach(() => { vi.clearAllMocks() })

import { getBillingOverview, updateAutoTopUp } from './billing'

describe('billing api', () => {
  describe('getBillingOverview', () => {
    it('returns overview', async () => {
      const data = { paymentMethods: [], autoTopUp: {}, isSimulation: false }
      mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(data) })
      expect(await getBillingOverview()).toEqual(data)
    })
    it('throws on failure', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false })
      await expect(getBillingOverview()).rejects.toThrow()
    })
  })

  describe('updateAutoTopUp', () => {
    it('updates config', async () => {
      const config = { isEnabled: true, threshold: 100, tokenPackageId: 1, monthlyLimitUsd: null }
      const data = { ...config, monthlySpentUsd: 0 }
      mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(data) })
      expect(await updateAutoTopUp(config)).toEqual(data)
    })
    it('throws on failure', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false })
      await expect(updateAutoTopUp({ isEnabled: false, threshold: 50, tokenPackageId: 1, monthlyLimitUsd: null })).rejects.toThrow()
    })
  })
})
