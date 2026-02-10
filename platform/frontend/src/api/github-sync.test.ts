import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../i18n', () => ({ default: { t: (key: string) => key } }))
vi.mock('./auth', () => ({
  getAuthHeaders: () => ({ 'Content-Type': 'application/json', Authorization: 'Bearer test' }),
}))

const mockFetch = vi.fn()
global.fetch = mockFetch

beforeEach(() => { vi.clearAllMocks() })

import { connectRepo, disconnectRepo, pushToRepo, pullFromRepo, getSyncStatus, resolveConflicts, getSyncHistory } from './github-sync'

describe('github-sync api', () => {
  describe('connectRepo', () => {
    it('connects project to repo', async () => {
      const data = { id: 'abc-123', projectId: 1, status: 'connected', gitHubRepoOwner: 'owner', gitHubRepoName: 'repo' }
      mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(data) })
      expect(await connectRepo(1, { repoOwner: 'owner', repoName: 'repo' })).toEqual(data)
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/projects/1/github/connect'),
        expect.objectContaining({ method: 'POST' })
      )
    })
    it('throws on failure', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false, json: () => Promise.resolve({ error: 'Already connected' }) })
      await expect(connectRepo(1, { repoOwner: 'owner', repoName: 'repo' })).rejects.toThrow('Already connected')
    })
  })

  describe('disconnectRepo', () => {
    it('disconnects project from repo', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ message: 'Disconnected' }) })
      await disconnectRepo(1)
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/projects/1/github/disconnect'),
        expect.objectContaining({ method: 'DELETE' })
      )
    })
    it('throws on failure', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false, json: () => Promise.resolve({ error: 'Not connected' }) })
      await expect(disconnectRepo(1)).rejects.toThrow('Not connected')
    })
  })

  describe('pushToRepo', () => {
    it('pushes to repo', async () => {
      const data = { id: 'abc-123', status: 'synced', lastPushAt: '2024-01-01' }
      mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(data) })
      expect(await pushToRepo(1)).toEqual(data)
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/projects/1/github/push'),
        expect.objectContaining({ method: 'POST' })
      )
    })
    it('throws on failure', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false, json: () => Promise.resolve({ error: 'Sync in progress' }) })
      await expect(pushToRepo(1)).rejects.toThrow('Sync in progress')
    })
  })

  describe('pullFromRepo', () => {
    it('pulls from repo', async () => {
      const data = { id: 'abc-123', status: 'synced', lastPullAt: '2024-01-01' }
      mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(data) })
      expect(await pullFromRepo(1)).toEqual(data)
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/projects/1/github/pull'),
        expect.objectContaining({ method: 'POST' })
      )
    })
    it('throws on failure', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false, json: () => Promise.resolve({ error: 'Sync in progress' }) })
      await expect(pullFromRepo(1)).rejects.toThrow('Sync in progress')
    })
  })

  describe('getSyncStatus', () => {
    it('returns sync status', async () => {
      const data = { id: 'abc-123', status: 'connected', gitHubRepoOwner: 'owner', gitHubRepoName: 'repo' }
      mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(data) })
      expect(await getSyncStatus(1)).toEqual(data)
    })
    it('returns null on failure', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false })
      expect(await getSyncStatus(1)).toBeNull()
    })
  })

  describe('resolveConflicts', () => {
    it('resolves conflicts', async () => {
      const data = { id: 'abc-123', status: 'synced' }
      mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(data) })
      expect(await resolveConflicts(1, 'ours')).toEqual(data)
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/projects/1/github/resolve'),
        expect.objectContaining({ method: 'POST' })
      )
    })
    it('throws on failure', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false, json: () => Promise.resolve({ error: 'No conflicts' }) })
      await expect(resolveConflicts(1, 'ours')).rejects.toThrow('No conflicts')
    })
  })

  describe('getSyncHistory', () => {
    it('returns history', async () => {
      const data = [{ action: 'push', status: 'success', timestamp: '2024-01-01' }]
      mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(data) })
      expect(await getSyncHistory(1)).toEqual(data)
    })
    it('returns empty on failure', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false })
      expect(await getSyncHistory(1)).toEqual([])
    })
  })
})
