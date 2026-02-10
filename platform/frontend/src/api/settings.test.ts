import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../i18n', () => ({
  default: { t: (key: string) => key },
}))

vi.mock('./auth', () => ({
  getAuthHeaders: () => ({ 'Content-Type': 'application/json', Authorization: 'Bearer test' }),
}))

const mockFetch = vi.fn()
global.fetch = mockFetch

const mockStorage: Record<string, string> = {}
Object.defineProperty(window, 'localStorage', {
  value: {
    getItem: vi.fn((key: string) => mockStorage[key] ?? null),
    setItem: vi.fn((key: string, value: string) => { mockStorage[key] = value }),
    removeItem: vi.fn((key: string) => { delete mockStorage[key] }),
    clear: vi.fn(),
  },
  writable: true,
})

import {
  TOKEN_TO_USD_RATE,
  getUserId,
  getTokenOverview,
  getTokenHistory,
  getTokenPackages,
  purchaseTokens,
  checkTokens,
  deductTokens,
  getPricingPlans,
  getUsageSummary,
  getUsageTransactions,
  getUsageByProject,
  getUsageExportUrl,
} from './settings'

beforeEach(() => {
  vi.clearAllMocks()
  Object.keys(mockStorage).forEach(k => delete mockStorage[k])
})

describe('settings api', () => {
  it('exports TOKEN_TO_USD_RATE', () => {
    expect(TOKEN_TO_USD_RATE).toBe(0.01)
  })

  describe('getUserId', () => {
    it('returns existing userId', () => {
      mockStorage['ai-dev-user-id'] = 'existing-id'
      expect(getUserId()).toBe('existing-id')
    })

    it('creates new userId when none exists', () => {
      vi.stubGlobal('crypto', { randomUUID: () => 'new-uuid' })
      const id = getUserId()
      expect(id).toBe('new-uuid')
      expect(window.localStorage.setItem).toHaveBeenCalledWith('ai-dev-user-id', 'new-uuid')
    })
  })

  describe('getTokenOverview', () => {
    it('returns token overview', async () => {
      const data = { balance: 100, totalEarned: 200, totalSpent: 100, balanceValueUsd: 1.0, pricing: [] }
      mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(data) })
      const result = await getTokenOverview()
      expect(result).toEqual(data)
    })

    it('throws on failure', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false })
      await expect(getTokenOverview()).rejects.toThrow()
    })
  })

  describe('getTokenHistory', () => {
    it('returns history', async () => {
      const data = [{ id: 1, type: 'credit', amount: 100 }]
      mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(data) })
      const result = await getTokenHistory()
      expect(result).toEqual(data)
    })

    it('includes action filter in URL', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve([]) })
      await getTokenHistory(1, 20, 'purchase')
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('actionFilter=purchase'),
        expect.anything()
      )
    })

    it('throws on failure', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false })
      await expect(getTokenHistory()).rejects.toThrow()
    })
  })

  describe('getTokenPackages', () => {
    it('returns packages', async () => {
      const data = [{ id: 1, name: 'Starter', tokenAmount: 100 }]
      mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(data) })
      const result = await getTokenPackages()
      expect(result).toEqual(data)
    })

    it('throws on failure', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false })
      await expect(getTokenPackages()).rejects.toThrow()
    })
  })

  describe('purchaseTokens', () => {
    it('purchases tokens', async () => {
      const data = { success: true, tokensAdded: 100, newBalance: 200 }
      mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(data) })
      const result = await purchaseTokens(1)
      expect(result).toEqual(data)
    })

    it('throws on failure', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ error: 'Purchase failed' }),
      })
      await expect(purchaseTokens(1)).rejects.toThrow('Purchase failed')
    })
  })

  describe('checkTokens', () => {
    it('checks tokens', async () => {
      const data = { actionType: 'analysis', tokenCost: 50, currentBalance: 100, hasEnough: true, shortfall: 0 }
      mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(data) })
      const result = await checkTokens('analysis')
      expect(result).toEqual(data)
    })

    it('throws on failure', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false })
      await expect(checkTokens('analysis')).rejects.toThrow()
    })
  })

  describe('deductTokens', () => {
    it('deducts tokens', async () => {
      const data = { success: true, tokensDeducted: 50, newBalance: 50 }
      mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(data) })
      const result = await deductTokens('analysis')
      expect(result).toEqual(data)
    })

    it('throws on 402 with insufficient balance', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 402,
        json: () => Promise.resolve({ required: 100, balance: 10 }),
      })
      await expect(deductTokens('build')).rejects.toThrow()
    })

    it('throws on other errors', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false, status: 500 })
      await expect(deductTokens('build')).rejects.toThrow()
    })
  })

  describe('getPricingPlans', () => {
    it('returns pricing plans', async () => {
      const data = [{ id: 'free', name: 'Free' }]
      mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(data) })
      const result = await getPricingPlans()
      expect(result).toEqual(data)
    })

    it('returns empty on failure', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false })
      const result = await getPricingPlans()
      expect(result).toEqual([])
    })
  })

  describe('getUsageSummary', () => {
    it('returns usage summary', async () => {
      const data = { balance: 100, balanceValueUsd: 1.0 }
      mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(data) })
      const result = await getUsageSummary()
      expect(result).toEqual(data)
    })

    it('throws on failure', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false })
      await expect(getUsageSummary()).rejects.toThrow()
    })
  })

  describe('getUsageTransactions', () => {
    it('returns transactions with params', async () => {
      const data = { transactions: [], totalCount: 0, page: 1, pageSize: 20 }
      mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(data) })
      const result = await getUsageTransactions({ page: 1, type: 'credit' })
      expect(result).toEqual(data)
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('type=credit'),
        expect.anything()
      )
    })

    it('throws on failure', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false })
      await expect(getUsageTransactions({})).rejects.toThrow()
    })
  })

  describe('getUsageByProject', () => {
    it('returns project usage', async () => {
      const data = [{ projectId: '1', analysis: 10, proposal: 5, build: 20, total: 35 }]
      mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(data) })
      const result = await getUsageByProject()
      expect(result).toEqual(data)
    })

    it('throws on failure', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false })
      await expect(getUsageByProject()).rejects.toThrow()
    })
  })

  describe('getUsageExportUrl', () => {
    it('returns export URL without params', () => {
      const url = getUsageExportUrl()
      expect(url).toContain('/api/settings/usage/export')
    })

    it('returns export URL with date params', () => {
      const url = getUsageExportUrl('2024-01-01', '2024-12-31')
      expect(url).toContain('from=2024-01-01')
      expect(url).toContain('to=2024-12-31')
    })
  })
})
