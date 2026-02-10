import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../i18n', () => ({ default: { t: (key: string) => key } }))
vi.mock('./auth', () => ({
  getAuthHeaders: () => ({ 'Content-Type': 'application/json', Authorization: 'Bearer test' }),
}))

const mockFetch = vi.fn()
global.fetch = mockFetch

beforeEach(() => { vi.clearAllMocks() })

import { getBlueprints, getBlueprint, generateBlueprint, deleteBlueprint } from './microservices'

describe('microservices api', () => {
  describe('getBlueprints', () => {
    it('returns blueprints', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve([]) })
      expect(await getBlueprints()).toEqual([])
    })
    it('throws on failure', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false })
      await expect(getBlueprints()).rejects.toThrow()
    })
  })

  describe('getBlueprint', () => {
    it('returns blueprint', async () => {
      const data = { id: 1, name: 'test', serviceCount: 3 }
      mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(data) })
      expect(await getBlueprint(1)).toEqual(data)
    })
    it('throws on failure', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false })
      await expect(getBlueprint(1)).rejects.toThrow()
    })
  })

  describe('generateBlueprint', () => {
    it('generates blueprint', async () => {
      const data = { id: 1, name: 'generated' }
      mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(data) })
      expect(await generateBlueprint('req1')).toEqual(data)
    })
    it('throws on failure', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false })
      await expect(generateBlueprint('req1')).rejects.toThrow()
    })
  })

  describe('deleteBlueprint', () => {
    it('deletes blueprint', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true })
      await expect(deleteBlueprint(1)).resolves.toBeUndefined()
    })
    it('throws on failure', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false })
      await expect(deleteBlueprint(1)).rejects.toThrow()
    })
  })
})
