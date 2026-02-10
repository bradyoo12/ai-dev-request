import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../i18n', () => ({ default: { t: (key: string) => key } }))
vi.mock('./auth', () => ({
  getAuthHeaders: () => ({ 'Content-Type': 'application/json', Authorization: 'Bearer test' }),
}))

const mockFetch = vi.fn()
global.fetch = mockFetch

beforeEach(() => { vi.clearAllMocks() })

import { createCheckout, getPaymentHistory } from './payments'

describe('payments api', () => {
  describe('createCheckout', () => {
    it('creates checkout', async () => {
      const data = { checkoutUrl: 'https://checkout.stripe.com/123', isSimulation: false }
      mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(data) })
      expect(await createCheckout(1)).toEqual(data)
    })
    it('throws on failure', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false, json: () => Promise.resolve({ error: 'Failed' }) })
      await expect(createCheckout(1)).rejects.toThrow('Failed')
    })
  })

  describe('getPaymentHistory', () => {
    it('returns history', async () => {
      const data = { payments: [], totalCount: 0, page: 1, pageSize: 20 }
      mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(data) })
      expect(await getPaymentHistory()).toEqual(data)
    })
    it('throws on failure', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false })
      await expect(getPaymentHistory()).rejects.toThrow()
    })
  })
})
