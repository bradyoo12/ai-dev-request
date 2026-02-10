import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../i18n', () => ({ default: { t: (key: string) => key } }))
vi.mock('./auth', () => ({
  getAuthHeaders: () => ({ 'Content-Type': 'application/json', Authorization: 'Bearer test' }),
}))

const mockFetch = vi.fn()
global.fetch = mockFetch

beforeEach(() => { vi.clearAllMocks() })

import { searchDomains, purchaseDomain, getSiteDomain, getUserDomains, removeSiteDomain } from './domains'

describe('domains api', () => {
  describe('searchDomains', () => {
    it('searches domains', async () => {
      const data = [{ domainName: 'test.com', tld: 'com', available: true, priceUsd: 12 }]
      mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(data) })
      expect(await searchDomains('test')).toEqual(data)
    })
    it('includes tlds in params', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve([]) })
      await searchDomains('test', ['com', 'net'])
      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('tlds=com%2Cnet'), expect.anything())
    })
    it('throws on failure', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false })
      await expect(searchDomains('test')).rejects.toThrow()
    })
  })

  describe('purchaseDomain', () => {
    it('purchases domain', async () => {
      const data = { id: '1', domainName: 'test.com', status: 'Pending' }
      mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(data) })
      expect(await purchaseDomain('s1', 'test.com', 'com', 12)).toEqual(data)
    })
    it('throws on failure', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false, json: () => Promise.resolve({ error: 'Failed' }) })
      await expect(purchaseDomain('s1', 'test.com', 'com', 12)).rejects.toThrow('Failed')
    })
  })

  describe('getSiteDomain', () => {
    it('returns domain', async () => {
      const data = { id: '1', domainName: 'test.com' }
      mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(data) })
      expect(await getSiteDomain('s1')).toEqual(data)
    })
    it('returns null on 404', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false, status: 404 })
      expect(await getSiteDomain('s1')).toBeNull()
    })
    it('throws on other errors', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false, status: 500 })
      await expect(getSiteDomain('s1')).rejects.toThrow()
    })
  })

  describe('getUserDomains', () => {
    it('returns domains', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve([]) })
      expect(await getUserDomains()).toEqual([])
    })
    it('throws on failure', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false })
      await expect(getUserDomains()).rejects.toThrow()
    })
  })

  describe('removeSiteDomain', () => {
    it('removes domain', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true })
      await expect(removeSiteDomain('s1')).resolves.toBeUndefined()
    })
    it('throws on failure', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false })
      await expect(removeSiteDomain('s1')).rejects.toThrow()
    })
  })
})
