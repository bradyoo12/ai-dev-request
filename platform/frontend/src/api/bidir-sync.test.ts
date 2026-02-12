import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../i18n', () => ({
  default: { t: (key: string) => key },
}))

vi.mock('./auth', () => ({
  authFetch: vi.fn(),
}))

import {
  getBidirSyncConfig,
  updateBidirSyncConfig,
  pushToGitHub,
  pullFromGitHub,
  getBidirSyncStatus,
  getBidirSyncHistory,
  getBidirSyncStats,
} from './bidir-sync'
import type { BidirectionalGitSyncConfig, PushResult, PullResult, SyncHistoryEntry, BidirSyncStats } from './bidir-sync'
import { authFetch } from './auth'

const mockAuthFetch = vi.mocked(authFetch)

beforeEach(() => {
  vi.clearAllMocks()
})

describe('bidir-sync api', () => {
  const mockConfig: BidirectionalGitSyncConfig = {
    id: 'bs-1',
    userId: 'u1',
    devRequestId: 1,
    projectName: 'my-project',
    repoOwner: 'testuser',
    repoName: 'my-repo',
    defaultBranch: 'main',
    aiBranch: 'ai-generated',
    syncEnabled: true,
    autoPushEnabled: false,
    autoPullEnabled: false,
    webhookEnabled: false,
    status: 'connected',
    totalPushes: 5,
    totalPulls: 3,
    totalConflicts: 1,
    conflictsResolved: 1,
    aheadCount: 2,
    behindCount: 0,
    changedFilesCount: 3,
    conflictFiles: [],
    createdAt: '2024-01-01',
    updatedAt: '2024-01-02',
  }

  describe('getBidirSyncConfig', () => {
    it('calls correct URL with project ID', async () => {
      mockAuthFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockConfig),
      } as Response)

      const result = await getBidirSyncConfig(1)
      expect(result).toEqual(mockConfig)
      expect(mockAuthFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/bidir-sync/config/1')
      )
    })

    it('throws with server error on failure', async () => {
      mockAuthFetch.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ error: 'Config not found' }),
      } as Response)

      await expect(getBidirSyncConfig(999)).rejects.toThrow('Config not found')
    })

    it('throws default error when JSON parse fails', async () => {
      mockAuthFetch.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.reject(new Error('parse')),
      } as Response)

      await expect(getBidirSyncConfig(1)).rejects.toThrow('api.error.bidirSyncConfigLoad')
    })
  })

  describe('updateBidirSyncConfig', () => {
    it('sends PUT with updated config fields', async () => {
      const updated = { ...mockConfig, autoPushEnabled: true }
      mockAuthFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(updated),
      } as Response)

      const result = await updateBidirSyncConfig(1, { autoPushEnabled: true })
      expect(result.autoPushEnabled).toBe(true)
      expect(mockAuthFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/bidir-sync/config/1'),
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify({ autoPushEnabled: true }),
        })
      )
    })

    it('throws on failure', async () => {
      mockAuthFetch.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ error: 'Invalid config' }),
      } as Response)

      await expect(updateBidirSyncConfig(1, {})).rejects.toThrow('Invalid config')
    })
  })

  describe('pushToGitHub', () => {
    it('sends POST with project ID', async () => {
      const pushResult: PushResult = {
        commitSha: 'abc123',
        repoUrl: 'https://github.com/testuser/my-repo',
        filesCount: 5,
        branch: 'ai-generated',
        pushedAt: '2024-01-02',
      }
      mockAuthFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(pushResult),
      } as Response)

      const result = await pushToGitHub(1)
      expect(result.commitSha).toBe('abc123')
      expect(mockAuthFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/bidir-sync/push'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ projectId: 1 }),
        })
      )
    })

    it('throws on failure', async () => {
      mockAuthFetch.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ error: 'Push failed' }),
      } as Response)

      await expect(pushToGitHub(1)).rejects.toThrow('Push failed')
    })
  })

  describe('pullFromGitHub', () => {
    it('sends POST with project ID', async () => {
      const pullResult: PullResult = {
        changedFiles: ['index.html'],
        conflictFiles: [],
        hasConflicts: false,
        pulledAt: '2024-01-02',
      }
      mockAuthFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(pullResult),
      } as Response)

      const result = await pullFromGitHub(1)
      expect(result.hasConflicts).toBe(false)
      expect(mockAuthFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/bidir-sync/pull'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ projectId: 1 }),
        })
      )
    })

    it('throws on failure', async () => {
      mockAuthFetch.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({}),
      } as Response)

      await expect(pullFromGitHub(1)).rejects.toThrow()
    })
  })

  describe('getBidirSyncStatus', () => {
    it('returns status for project', async () => {
      mockAuthFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockConfig),
      } as Response)

      const result = await getBidirSyncStatus(1)
      expect(result.status).toBe('connected')
      expect(mockAuthFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/bidir-sync/status/1')
      )
    })

    it('throws on failure', async () => {
      mockAuthFetch.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({}),
      } as Response)

      await expect(getBidirSyncStatus(1)).rejects.toThrow()
    })
  })

  describe('getBidirSyncHistory', () => {
    it('returns sync history entries', async () => {
      const history: SyncHistoryEntry[] = [
        { operation: 'push', timestamp: '2024-01-02', files: 5, status: 'success', commitSha: 'abc' },
      ]
      mockAuthFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(history),
      } as Response)

      const result = await getBidirSyncHistory(1)
      expect(result).toHaveLength(1)
      expect(result[0].operation).toBe('push')
      expect(mockAuthFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/bidir-sync/history/1')
      )
    })

    it('throws on failure', async () => {
      mockAuthFetch.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({}),
      } as Response)

      await expect(getBidirSyncHistory(1)).rejects.toThrow()
    })
  })

  describe('getBidirSyncStats', () => {
    it('returns global sync stats', async () => {
      const stats: BidirSyncStats = {
        totalSyncs: 20,
        totalPushes: 12,
        totalPulls: 8,
        totalConflicts: 2,
        conflictsResolved: 2,
        connectedRepos: 3,
        status: 'healthy',
      }
      mockAuthFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(stats),
      } as Response)

      const result = await getBidirSyncStats()
      expect(result.totalSyncs).toBe(20)
      expect(result.connectedRepos).toBe(3)
      expect(mockAuthFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/bidir-sync/stats')
      )
    })

    it('throws on failure', async () => {
      mockAuthFetch.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({}),
      } as Response)

      await expect(getBidirSyncStats()).rejects.toThrow()
    })
  })
})
