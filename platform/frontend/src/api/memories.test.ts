import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../i18n', () => ({ default: { t: (key: string) => key } }))
vi.mock('./auth', () => ({
  getAuthHeaders: () => ({ 'Content-Type': 'application/json', Authorization: 'Bearer test' }),
}))

const mockFetch = vi.fn()
global.fetch = mockFetch

beforeEach(() => { vi.clearAllMocks() })

import { getMemories, addMemory, deleteMemory, deleteAllMemories } from './memories'

describe('memories api', () => {
  describe('getMemories', () => {
    it('returns memories', async () => {
      const data = { memories: [], totalCount: 0, page: 1, pageSize: 50 }
      mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(data) })
      expect(await getMemories()).toEqual(data)
    })
    it('throws on failure', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false })
      await expect(getMemories()).rejects.toThrow()
    })
  })

  describe('addMemory', () => {
    it('adds memory', async () => {
      const data = { id: 1, content: 'test', category: 'general' }
      mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(data) })
      expect(await addMemory({ content: 'test', category: 'general' })).toEqual(data)
    })
    it('throws on failure', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false, json: () => Promise.resolve({}) })
      await expect(addMemory({ content: 'test', category: 'general' })).rejects.toThrow()
    })
  })

  describe('deleteMemory', () => {
    it('deletes memory', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true })
      await expect(deleteMemory(1)).resolves.toBeUndefined()
    })
    it('throws on failure', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false })
      await expect(deleteMemory(1)).rejects.toThrow()
    })
  })

  describe('deleteAllMemories', () => {
    it('deletes all', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true })
      await expect(deleteAllMemories()).resolves.toBeUndefined()
    })
    it('throws on failure', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false })
      await expect(deleteAllMemories()).rejects.toThrow()
    })
  })
})
