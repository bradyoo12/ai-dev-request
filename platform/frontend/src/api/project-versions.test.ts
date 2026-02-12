import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../i18n', () => ({
  default: { t: (key: string) => key },
}))

const mockFetch = vi.fn()
global.fetch = mockFetch

const mockStorage: Record<string, string> = {}
Object.defineProperty(window, 'localStorage', {
  value: {
    getItem: vi.fn((key: string) => mockStorage[key] ?? null),
    setItem: vi.fn((key: string, value: string) => { mockStorage[key] = value }),
    removeItem: vi.fn((key: string) => { delete mockStorage[key] }),
    clear: vi.fn(() => Object.keys(mockStorage).forEach(k => delete mockStorage[k])),
  },
  writable: true,
})

import { getVersions, getVersion, getLatestVersion, getDiff, rollbackToVersion } from './project-versions'
import type { ProjectVersion, VersionDiff } from './project-versions'

beforeEach(() => {
  vi.clearAllMocks()
  Object.keys(mockStorage).forEach(k => delete mockStorage[k])
})

describe('project-versions api', () => {
  const mockVersion: ProjectVersion = {
    id: 'v1',
    projectId: 'p1',
    versionNumber: 1,
    label: 'Initial build',
    source: 'build',
    fileCount: 10,
    changedFiles: ['index.html', 'app.js'],
    createdAt: '2024-01-01',
  }

  const mockDiff: VersionDiff = {
    fromVersionId: 'v1',
    toVersionId: 'v2',
    fromVersionNumber: 1,
    toVersionNumber: 2,
    addedFiles: ['styles.css'],
    removedFiles: [],
    modifiedFiles: ['app.js'],
    totalChanges: 2,
  }

  describe('getVersions', () => {
    it('calls correct URL with project ID', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([mockVersion]),
      })

      const result = await getVersions('p1')
      expect(result).toEqual([mockVersion])
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/projects/p1/versions'),
        expect.objectContaining({
          headers: expect.objectContaining({ 'Content-Type': 'application/json' }),
        })
      )
    })

    it('throws with server error on failure', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ error: 'Project not found' }),
      })

      await expect(getVersions('invalid')).rejects.toThrow('Project not found')
    })

    it('throws default error when server returns no message', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.reject(new Error('parse')),
      })

      await expect(getVersions('p1')).rejects.toThrow('versionHistory.error.loadFailed')
    })
  })

  describe('getVersion', () => {
    it('calls correct URL with project and version IDs', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockVersion),
      })

      const result = await getVersion('p1', 'v1')
      expect(result).toEqual(mockVersion)
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/projects/p1/versions/v1'),
        expect.any(Object)
      )
    })

    it('throws on failure', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({}),
      })

      await expect(getVersion('p1', 'invalid')).rejects.toThrow()
    })
  })

  describe('getLatestVersion', () => {
    it('returns latest version on success', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockVersion),
      })

      const result = await getLatestVersion('p1')
      expect(result).toEqual(mockVersion)
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/projects/p1/versions/latest'),
        expect.any(Object)
      )
    })

    it('returns null on 404', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
      })

      const result = await getLatestVersion('p1')
      expect(result).toBeNull()
    })

    it('throws on non-404 failure', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: () => Promise.resolve({ error: 'Server error' }),
      })

      await expect(getLatestVersion('p1')).rejects.toThrow('Server error')
    })
  })

  describe('getDiff', () => {
    it('calls correct URL with from/to version IDs', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockDiff),
      })

      const result = await getDiff('p1', 'v1', 'v2')
      expect(result).toEqual(mockDiff)
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/projects/p1/versions/v1/diff/v2'),
        expect.any(Object)
      )
    })

    it('throws on failure', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({}),
      })

      await expect(getDiff('p1', 'v1', 'v2')).rejects.toThrow()
    })
  })

  describe('rollbackToVersion', () => {
    it('sends POST to rollback endpoint', async () => {
      const rolledBack = { ...mockVersion, versionNumber: 3, label: 'Rollback to v1' }
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(rolledBack),
      })

      const result = await rollbackToVersion('p1', 'v1')
      expect(result.label).toBe('Rollback to v1')
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/projects/p1/versions/v1/rollback'),
        expect.objectContaining({ method: 'POST' })
      )
    })

    it('throws with server error on failure', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ error: 'Cannot rollback' }),
      })

      await expect(rollbackToVersion('p1', 'v1')).rejects.toThrow('Cannot rollback')
    })
  })
})
