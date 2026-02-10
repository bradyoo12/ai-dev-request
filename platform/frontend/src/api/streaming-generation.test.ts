import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../i18n', () => ({ default: { t: (key: string) => key } }))
vi.mock('./auth', () => ({
  getAuthHeaders: () => ({ 'Content-Type': 'application/json', Authorization: 'Bearer test' }),
}))

const mockFetch = vi.fn()
global.fetch = mockFetch

beforeEach(() => { vi.clearAllMocks() })

import { startGeneration, cancelGeneration, getStreamStatus, getStreamHistory } from './streaming-generation'

describe('streaming-generation api', () => {
  describe('startGeneration', () => {
    it('starts a generation stream', async () => {
      const data = { id: 'stream-1', devRequestId: 1, status: 'idle' }
      mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(data) })
      expect(await startGeneration(1)).toEqual(data)
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/requests/1/generate/start'),
        expect.objectContaining({ method: 'POST' })
      )
    })
    it('throws on failure', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false, json: () => Promise.resolve({ error: 'Start failed' }) })
      await expect(startGeneration(1)).rejects.toThrow('Start failed')
    })
  })

  describe('cancelGeneration', () => {
    it('cancels an active stream', async () => {
      const data = { id: 'stream-1', devRequestId: 1, status: 'cancelled' }
      mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(data) })
      expect(await cancelGeneration(1)).toEqual(data)
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/requests/1/generate/cancel'),
        expect.objectContaining({ method: 'POST' })
      )
    })
    it('throws on failure', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false, json: () => Promise.resolve({ error: 'No active stream' }) })
      await expect(cancelGeneration(1)).rejects.toThrow('No active stream')
    })
  })

  describe('getStreamStatus', () => {
    it('returns stream status', async () => {
      const data = { id: 'stream-1', status: 'streaming', progressPercent: 45.5 }
      mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(data) })
      expect(await getStreamStatus(1)).toEqual(data)
    })
    it('returns null on failure', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false })
      expect(await getStreamStatus(1)).toBeNull()
    })
  })

  describe('getStreamHistory', () => {
    it('returns stream history', async () => {
      const data = [
        { id: 'stream-1', status: 'completed', completedFiles: 4, streamedTokens: 1200 },
        { id: 'stream-2', status: 'cancelled', completedFiles: 2, streamedTokens: 600 },
      ]
      mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(data) })
      expect(await getStreamHistory(1)).toEqual(data)
    })
    it('returns empty array on failure', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false })
      expect(await getStreamHistory(1)).toEqual([])
    })
  })
})
