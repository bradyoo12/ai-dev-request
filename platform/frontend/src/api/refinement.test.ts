import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('./auth', () => ({
  getAuthHeaders: () => ({ 'Content-Type': 'application/json', Authorization: 'Bearer test' }),
}))

const mockFetch = vi.fn()
global.fetch = mockFetch

beforeEach(() => { vi.clearAllMocks() })

import { getChatHistory, sendChatMessage, applyChanges } from './refinement'

describe('refinement api', () => {
  describe('getChatHistory', () => {
    it('returns chat history', async () => {
      const data = [{ id: 1, role: 'user', content: 'hello' }]
      mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(data) })
      expect(await getChatHistory('req1')).toEqual(data)
    })
    it('throws on failure', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false })
      await expect(getChatHistory('req1')).rejects.toThrow()
    })
  })

  describe('sendChatMessage', () => {
    it('sends message', async () => {
      const data = { message: { id: 1, role: 'assistant', content: 'response' }, tokensUsed: 5, newBalance: 95 }
      mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(data) })
      expect(await sendChatMessage('req1', 'hello')).toEqual(data)
    })
    it('throws on failure', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false })
      await expect(sendChatMessage('req1', 'hello')).rejects.toThrow()
    })
  })

  describe('applyChanges', () => {
    it('applies changes', async () => {
      const data = { modifiedFiles: ['a.ts'], createdFiles: [], totalChanges: 1 }
      mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(data) })
      expect(await applyChanges('req1', 'content')).toEqual(data)
    })
    it('throws on failure', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false })
      await expect(applyChanges('req1', 'content')).rejects.toThrow()
    })
  })
})
