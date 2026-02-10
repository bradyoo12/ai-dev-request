import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../i18n', () => ({ default: { t: (key: string) => key } }))
vi.mock('./auth', () => ({
  getAuthHeaders: () => ({ 'Content-Type': 'application/json', Authorization: 'Bearer test' }),
}))

const mockFetch = vi.fn()
global.fetch = mockFetch

beforeEach(() => { vi.clearAllMocks() })

import { getSites, getSiteDetail, createSite, redeploySite, deleteSite, getSiteLogs } from './sites'

describe('sites api', () => {
  describe('getSites', () => {
    it('returns sites', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve([]) })
      expect(await getSites()).toEqual([])
    })
    it('throws on failure', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false })
      await expect(getSites()).rejects.toThrow()
    })
  })

  describe('getSiteDetail', () => {
    it('returns site detail', async () => {
      const data = { id: '1', siteName: 'test', logs: [] }
      mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(data) })
      expect(await getSiteDetail('1')).toEqual(data)
    })
    it('throws on failure', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false })
      await expect(getSiteDetail('1')).rejects.toThrow()
    })
  })

  describe('createSite', () => {
    it('creates site', async () => {
      const data = { id: '1', siteName: 'test' }
      mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(data) })
      expect(await createSite('req1', 'test')).toEqual(data)
    })
    it('throws on failure', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false, json: () => Promise.resolve({ error: 'Failed' }) })
      await expect(createSite('req1', 'test')).rejects.toThrow('Failed')
    })
  })

  describe('redeploySite', () => {
    it('redeploys site', async () => {
      const data = { id: '1', status: 'Deploying' }
      mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(data) })
      expect(await redeploySite('1')).toEqual(data)
    })
    it('throws on failure', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false, json: () => Promise.resolve({}) })
      await expect(redeploySite('1')).rejects.toThrow()
    })
  })

  describe('deleteSite', () => {
    it('deletes site', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true })
      await expect(deleteSite('1')).resolves.toBeUndefined()
    })
    it('throws on failure', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false })
      await expect(deleteSite('1')).rejects.toThrow()
    })
  })

  describe('getSiteLogs', () => {
    it('returns logs', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve([]) })
      expect(await getSiteLogs('1')).toEqual([])
    })
    it('throws on failure', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false })
      await expect(getSiteLogs('1')).rejects.toThrow()
    })
  })
})
