import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../i18n', () => ({ default: { t: (key: string) => key } }))
vi.mock('./auth', () => ({
  getAuthHeaders: () => ({ 'Content-Type': 'application/json', Authorization: 'Bearer test' }),
}))

const mockFetch = vi.fn()
global.fetch = mockFetch

beforeEach(() => { vi.clearAllMocks() })

import { getTenants, getTenant, createTenant, updateTenant, deleteTenant, getPartners, addPartner, updatePartner, removePartner, getUsageSummary } from './whitelabel'

describe('whitelabel api', () => {
  describe('getTenants', () => {
    it('returns tenants', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve([]) })
      expect(await getTenants()).toEqual([])
    })
    it('throws on failure', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false, json: () => Promise.resolve({}) })
      await expect(getTenants()).rejects.toThrow()
    })
  })

  describe('getTenant', () => {
    it('returns tenant', async () => {
      const data = { id: 1, name: 'Test', slug: 'test' }
      mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(data) })
      expect(await getTenant(1)).toEqual(data)
    })
    it('throws on failure', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false, json: () => Promise.resolve({}) })
      await expect(getTenant(1)).rejects.toThrow()
    })
  })

  describe('createTenant', () => {
    it('creates tenant', async () => {
      const data = { id: 1, name: 'New', slug: 'new' }
      mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(data) })
      expect(await createTenant('New', 'new')).toEqual(data)
    })
    it('throws on failure', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false, json: () => Promise.resolve({}) })
      await expect(createTenant('New', 'new')).rejects.toThrow()
    })
  })

  describe('updateTenant', () => {
    it('updates tenant', async () => {
      const data = { id: 1, name: 'Updated', updated: true }
      mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(data) })
      expect(await updateTenant(1, { name: 'Updated' })).toEqual(data)
    })
    it('throws on failure', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false, json: () => Promise.resolve({}) })
      await expect(updateTenant(1, {})).rejects.toThrow()
    })
  })

  describe('deleteTenant', () => {
    it('deletes tenant', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ deleted: true }) })
      expect(await deleteTenant(1)).toEqual({ deleted: true })
    })
    it('throws on failure', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false, json: () => Promise.resolve({}) })
      await expect(deleteTenant(1)).rejects.toThrow()
    })
  })

  describe('getPartners', () => {
    it('returns partners', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve([]) })
      expect(await getPartners(1)).toEqual([])
    })
    it('throws on failure', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false, json: () => Promise.resolve({}) })
      await expect(getPartners(1)).rejects.toThrow()
    })
  })

  describe('addPartner', () => {
    it('adds partner', async () => {
      const data = { id: 1, companyName: 'Partner Co' }
      mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(data) })
      expect(await addPartner(1, 'Partner Co', 'test@test.com', 20)).toEqual(data)
    })
    it('throws on failure', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false, json: () => Promise.resolve({}) })
      await expect(addPartner(1, 'Partner', undefined, 20)).rejects.toThrow()
    })
  })

  describe('updatePartner', () => {
    it('updates partner', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ updated: true }) })
      expect(await updatePartner(1, { status: 'active' })).toEqual({ updated: true })
    })
    it('throws on failure', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false, json: () => Promise.resolve({}) })
      await expect(updatePartner(1, {})).rejects.toThrow()
    })
  })

  describe('removePartner', () => {
    it('removes partner', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ deleted: true }) })
      expect(await removePartner(1)).toEqual({ deleted: true })
    })
    it('throws on failure', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false, json: () => Promise.resolve({}) })
      await expect(removePartner(1)).rejects.toThrow()
    })
  })

  describe('getUsageSummary', () => {
    it('returns usage summary', async () => {
      const data = { totalTokens: 1000, totalActions: 50 }
      mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(data) })
      expect(await getUsageSummary(1)).toEqual(data)
    })
    it('throws on failure', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false, json: () => Promise.resolve({}) })
      await expect(getUsageSummary(1)).rejects.toThrow()
    })
  })
})
