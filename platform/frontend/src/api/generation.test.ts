import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../i18n', () => ({ default: { t: (key: string) => key } }))
vi.mock('./auth', () => ({
  getAuthHeaders: () => ({ 'Content-Type': 'application/json', Authorization: 'Bearer test' }),
}))

const mockFetch = vi.fn()
global.fetch = mockFetch

beforeEach(() => { vi.clearAllMocks() })

import {
  createManifest,
  getManifest,
  validateConsistency,
  resolveConflicts,
  getGeneratedFiles,
} from './generation'

describe('generation api', () => {
  const projectId = '00000000-0000-0000-0000-000000000001'

  describe('createManifest', () => {
    it('sends POST with file specs', async () => {
      const data = { id: 'mf-1', fileCount: 2, validationStatus: 'pending' }
      mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(data) })
      const files = [{ path: 'src/App.tsx', content: 'export default function App() {}' }]
      const result = await createManifest(projectId, files)
      expect(result).toEqual(data)
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining(`/api/projects/${projectId}/generation/manifest`),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ files }),
        })
      )
    })

    it('throws on failure', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false, json: () => Promise.resolve({ error: 'bad request' }) })
      await expect(createManifest(projectId, [])).rejects.toThrow('bad request')
    })
  })

  describe('getManifest', () => {
    it('returns manifest when found', async () => {
      const data = { id: 'mf-1', fileCount: 3 }
      mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(data) })
      expect(await getManifest(projectId)).toEqual(data)
    })

    it('returns null when not found', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false })
      expect(await getManifest(projectId)).toBeNull()
    })
  })

  describe('validateConsistency', () => {
    it('returns validated manifest', async () => {
      const data = { id: 'mf-1', validationStatus: 'passed', issueCount: 0 }
      mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(data) })
      const result = await validateConsistency(projectId)
      expect(result.validationStatus).toBe('passed')
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining(`/api/projects/${projectId}/generation/validate`),
        expect.objectContaining({ method: 'POST' })
      )
    })

    it('throws on failure', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false, json: () => Promise.resolve({ error: 'fail' }) })
      await expect(validateConsistency(projectId)).rejects.toThrow('fail')
    })
  })

  describe('resolveConflicts', () => {
    it('returns resolved manifest', async () => {
      const data = { id: 'mf-1', validationStatus: 'resolved', issueCount: 0 }
      mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(data) })
      const result = await resolveConflicts(projectId)
      expect(result.validationStatus).toBe('resolved')
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining(`/api/projects/${projectId}/generation/resolve`),
        expect.objectContaining({ method: 'POST' })
      )
    })

    it('throws on failure', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false, json: () => Promise.resolve({}) })
      await expect(resolveConflicts(projectId)).rejects.toThrow()
    })
  })

  describe('getGeneratedFiles', () => {
    it('returns file list', async () => {
      const data = [
        { path: 'src/App.tsx', language: 'TypeScript', size: 500, exportCount: 1, importCount: 2, dependencyCount: 1, dependentCount: 0 },
      ]
      mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(data) })
      const result = await getGeneratedFiles(projectId)
      expect(result).toHaveLength(1)
      expect(result[0].language).toBe('TypeScript')
    })

    it('returns empty array on failure', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false })
      const result = await getGeneratedFiles(projectId)
      expect(result).toEqual([])
    })
  })
})
