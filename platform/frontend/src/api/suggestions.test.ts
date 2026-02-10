import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('./auth', () => ({
  getAuthHeaders: () => ({ 'Content-Type': 'application/json', Authorization: 'Bearer test' }),
}))

const mockFetch = vi.fn()
global.fetch = mockFetch

beforeEach(() => { vi.clearAllMocks() })

import {
  getSuggestions,
  getSuggestion,
  createSuggestion,
  voteSuggestion,
  getSuggestionComments,
  addSuggestionComment,
  getSuggestionHistory,
  updateSuggestionStatus,
  getAdminSuggestions,
} from './suggestions'

describe('suggestions api', () => {
  describe('getSuggestions', () => {
    it('returns suggestions', async () => {
      const data = { items: [], total: 0, page: 1, pageSize: 20 }
      mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(data) })
      expect(await getSuggestions()).toEqual(data)
    })
    it('throws on failure', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false })
      await expect(getSuggestions()).rejects.toThrow()
    })
  })

  describe('getSuggestion', () => {
    it('returns suggestion', async () => {
      const data = { id: 1, title: 'test' }
      mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(data) })
      expect(await getSuggestion(1)).toEqual(data)
    })
    it('throws on failure', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false })
      await expect(getSuggestion(1)).rejects.toThrow()
    })
  })

  describe('createSuggestion', () => {
    it('creates suggestion', async () => {
      const data = { suggestion: { id: 1, title: 'New' }, tokensAwarded: 50, newBalance: 150 }
      mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(data) })
      expect(await createSuggestion('title', 'desc')).toEqual(data)
    })
    it('throws on failure', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false })
      await expect(createSuggestion('title', 'desc')).rejects.toThrow()
    })
  })

  describe('voteSuggestion', () => {
    it('votes on suggestion', async () => {
      const data = { id: 1, upvoteCount: 5, voted: true, bonusTokensAwarded: null }
      mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(data) })
      expect(await voteSuggestion(1)).toEqual(data)
    })
    it('throws on failure', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false })
      await expect(voteSuggestion(1)).rejects.toThrow()
    })
  })

  describe('getSuggestionComments', () => {
    it('returns comments', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve([]) })
      expect(await getSuggestionComments(1)).toEqual([])
    })
    it('throws on failure', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false })
      await expect(getSuggestionComments(1)).rejects.toThrow()
    })
  })

  describe('addSuggestionComment', () => {
    it('adds comment', async () => {
      const data = { id: 1, content: 'Great idea' }
      mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(data) })
      expect(await addSuggestionComment(1, 'Great idea')).toEqual(data)
    })
    it('throws on failure', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false })
      await expect(addSuggestionComment(1, 'text')).rejects.toThrow()
    })
  })

  describe('getSuggestionHistory', () => {
    it('returns history', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve([]) })
      expect(await getSuggestionHistory(1)).toEqual([])
    })
    it('throws on failure', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false })
      await expect(getSuggestionHistory(1)).rejects.toThrow()
    })
  })

  describe('updateSuggestionStatus', () => {
    it('updates status', async () => {
      const data = { id: 1, status: 'approved', previousStatus: 'pending' }
      mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(data) })
      expect(await updateSuggestionStatus(1, 'approved')).toEqual(data)
    })
    it('throws on failure', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false })
      await expect(updateSuggestionStatus(1, 'approved')).rejects.toThrow()
    })
  })

  describe('getAdminSuggestions', () => {
    it('returns admin suggestions', async () => {
      const data = { items: [], total: 0, page: 1, pageSize: 20, statusCounts: {} }
      mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(data) })
      expect(await getAdminSuggestions()).toEqual(data)
    })
    it('throws on failure', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false })
      await expect(getAdminSuggestions()).rejects.toThrow()
    })
  })
})
