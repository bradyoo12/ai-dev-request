import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../i18n', () => ({ default: { t: (key: string) => key } }))
vi.mock('./auth', () => ({
  getAuthHeaders: () => ({ 'Content-Type': 'application/json', Authorization: 'Bearer test' }),
}))

const mockFetch = vi.fn()
global.fetch = mockFetch

beforeEach(() => { vi.clearAllMocks() })

import { generateSpec, getSpec, getSpecHistory, approveSpec, rejectSpec, updateSpec } from './specifications'

describe('specifications api', () => {
  describe('generateSpec', () => {
    it('generates spec for a phase', async () => {
      const data = { id: 'abc-123', devRequestId: 1, phase: 'requirements', status: 'review', version: 1, createdAt: '2024-01-01' }
      mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(data) })
      expect(await generateSpec(1, 'requirements')).toEqual(data)
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/requests/1/specs/generate'),
        expect.objectContaining({ method: 'POST' })
      )
    })
    it('throws on failure', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false, json: () => Promise.resolve({ error: 'Not found' }) })
      await expect(generateSpec(1, 'requirements')).rejects.toThrow('Not found')
    })
  })

  describe('getSpec', () => {
    it('returns spec', async () => {
      const data = { id: 'abc-123', phase: 'requirements', status: 'review' }
      mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(data) })
      expect(await getSpec(1)).toEqual(data)
    })
    it('returns null on failure', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false })
      expect(await getSpec(1)).toBeNull()
    })
  })

  describe('getSpecHistory', () => {
    it('returns history', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve([]) })
      expect(await getSpecHistory(1)).toEqual([])
    })
    it('returns empty on failure', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false })
      expect(await getSpecHistory(1)).toEqual([])
    })
  })

  describe('approveSpec', () => {
    it('approves spec', async () => {
      const data = { id: 'abc-123', status: 'approved' }
      mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(data) })
      expect(await approveSpec(1, 'abc-123')).toEqual(data)
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/requests/1/specs/abc-123/approve'),
        expect.objectContaining({ method: 'POST' })
      )
    })
    it('throws on failure', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false, json: () => Promise.resolve({ error: 'Already approved' }) })
      await expect(approveSpec(1, 'abc-123')).rejects.toThrow('Already approved')
    })
  })

  describe('rejectSpec', () => {
    it('rejects spec with feedback', async () => {
      const data = { id: 'abc-123', status: 'rejected' }
      mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(data) })
      expect(await rejectSpec(1, 'abc-123', 'needs more detail')).toEqual(data)
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/requests/1/specs/abc-123/reject'),
        expect.objectContaining({ method: 'POST' })
      )
    })
    it('throws on failure', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false, json: () => Promise.resolve({ error: 'Cannot reject' }) })
      await expect(rejectSpec(1, 'abc-123', 'feedback')).rejects.toThrow('Cannot reject')
    })
  })

  describe('updateSpec', () => {
    it('updates spec', async () => {
      const data = { id: 'abc-123', status: 'review', userStories: '[]' }
      mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(data) })
      expect(await updateSpec(1, 'abc-123', { userStories: '[]' })).toEqual(data)
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/requests/1/specs/abc-123'),
        expect.objectContaining({ method: 'PUT' })
      )
    })
    it('throws on failure', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false, json: () => Promise.resolve({ error: 'Cannot edit' }) })
      await expect(updateSpec(1, 'abc-123', {})).rejects.toThrow('Cannot edit')
    })
  })
})
