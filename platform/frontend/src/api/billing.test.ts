import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../i18n', () => ({ default: { t: (key: string) => key } }))
vi.mock('./auth', () => ({
  getAuthHeaders: () => ({ 'Content-Type': 'application/json', Authorization: 'Bearer test' }),
}))

const mockFetch = vi.fn()
global.fetch = mockFetch

beforeEach(() => { vi.clearAllMocks() })

import {
  getBillingOverview,
  updateAutoTopUp,
  getBillingAccount,
  subscribeToPlan,
  cancelSubscription,
  getUsageSummary,
  getInvoices,
  getPricingPlans,
  createPortalSession,
} from './billing'

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

  // === Usage-Based Billing Tests ===

  describe('getBillingAccount', () => {
    it('returns billing account', async () => {
      const data = { id: 'acc-1', plan: 'free', status: 'active', requestsThisPeriod: 0, requestsLimit: 3 }
      mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(data) })
      expect(await getBillingAccount()).toEqual(data)
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/billing/account'),
        expect.objectContaining({ headers: expect.any(Object) })
      )
    })
    it('throws on failure', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false })
      await expect(getBillingAccount()).rejects.toThrow()
    })
  })

  describe('subscribeToPlan', () => {
    it('subscribes to a plan', async () => {
      const data = { id: 'acc-1', plan: 'pro', status: 'active', monthlyRate: 29 }
      mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(data) })
      expect(await subscribeToPlan('pro')).toEqual(data)
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/billing/subscribe'),
        expect.objectContaining({ method: 'POST', body: JSON.stringify({ plan: 'pro' }) })
      )
    })
    it('throws with error message on failure', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ error: 'Unknown plan: invalid' })
      })
      await expect(subscribeToPlan('invalid')).rejects.toThrow('Unknown plan: invalid')
    })
  })

  describe('cancelSubscription', () => {
    it('cancels subscription', async () => {
      const data = { id: 'acc-1', plan: 'pro', status: 'cancelled' }
      mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(data) })
      expect(await cancelSubscription()).toEqual(data)
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/billing/cancel'),
        expect.objectContaining({ method: 'POST' })
      )
    })
    it('throws on failure', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false })
      await expect(cancelSubscription()).rejects.toThrow()
    })
  })

  describe('getUsageSummary', () => {
    it('returns usage summary', async () => {
      const data = {
        plan: 'pro', status: 'active', requestsUsed: 5, requestsLimit: 20,
        tokensUsed: 1200, overageCharges: 0, monthlyRate: 29, totalEstimated: 29,
        daysRemaining: 22,
      }
      mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(data) })
      expect(await getUsageSummary()).toEqual(data)
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/billing/usage'),
        expect.any(Object)
      )
    })
    it('throws on failure', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false })
      await expect(getUsageSummary()).rejects.toThrow()
    })
  })

  describe('getInvoices', () => {
    it('returns invoices', async () => {
      const data = [
        { id: 'inv-1', date: '2026-01-01', amount: 29, status: 'paid', description: 'Pro plan', planName: 'Pro' },
      ]
      mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(data) })
      expect(await getInvoices()).toEqual(data)
    })
    it('returns empty array on failure', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false })
      expect(await getInvoices()).toEqual([])
    })
  })

  describe('getPricingPlans', () => {
    it('returns pricing plans', async () => {
      const data = [
        { id: 'free', name: 'Free', monthlyRate: 0, requestsLimit: 3, perRequestOverageRate: 0, features: ['3 requests'] },
        { id: 'pro', name: 'Pro', monthlyRate: 29, requestsLimit: 20, perRequestOverageRate: 0.50, features: ['20 requests'] },
      ]
      mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(data) })
      expect(await getPricingPlans()).toEqual(data)
    })
    it('returns empty array on failure', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false })
      expect(await getPricingPlans()).toEqual([])
    })
  })

  describe('createPortalSession', () => {
    it('creates portal session', async () => {
      const data = { url: 'https://billing.stripe.com/p/session/sim_123', expiresAt: '2026-02-11T12:00:00Z' }
      mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(data) })
      expect(await createPortalSession()).toEqual(data)
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/billing/portal'),
        expect.objectContaining({ method: 'POST' })
      )
    })
    it('throws on failure', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false })
      await expect(createPortalSession()).rejects.toThrow()
    })
  })
})
