import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../i18n', () => ({ default: { t: (key: string) => key } }))
vi.mock('./auth', () => ({
  getAuthHeaders: () => ({ 'Content-Type': 'application/json', Authorization: 'Bearer test' }),
}))

const mockFetch = vi.fn()
global.fetch = mockFetch

beforeEach(() => { vi.clearAllMocks() })

import {
  deployPreview,
  getPreviewStatus,
  getPreviewUrl,
  expirePreview,
  listPreviews,
} from './preview'

describe('preview api', () => {
  const projectId = '00000000-0000-0000-0000-000000000001'

  describe('deployPreview', () => {
    it('returns deployed preview', async () => {
      const data = { id: 'p-1', status: 'Deployed', previewUrl: 'https://abc-preview.azurestaticapps.net' }
      mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(data) })
      const result = await deployPreview(projectId)
      expect(result).toEqual(data)
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining(`/api/projects/${projectId}/preview/deploy`),
        expect.objectContaining({ method: 'POST' })
      )
    })

    it('throws on failure', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false, json: () => Promise.resolve({ error: 'deploy fail' }) })
      await expect(deployPreview(projectId)).rejects.toThrow('deploy fail')
    })
  })

  describe('getPreviewStatus', () => {
    it('returns preview when found', async () => {
      const data = { id: 'p-1', status: 'Deployed' }
      mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(data) })
      expect(await getPreviewStatus(projectId)).toEqual(data)
    })

    it('returns null when not found', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false })
      expect(await getPreviewStatus(projectId)).toBeNull()
    })
  })

  describe('getPreviewUrl', () => {
    it('returns URL when found', async () => {
      const data = { previewUrl: 'https://abc-preview.azurestaticapps.net' }
      mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(data) })
      expect(await getPreviewUrl(projectId)).toBe('https://abc-preview.azurestaticapps.net')
    })

    it('returns null when not found', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false })
      expect(await getPreviewUrl(projectId)).toBeNull()
    })
  })

  describe('expirePreview', () => {
    it('returns expired preview', async () => {
      const data = { id: 'p-1', status: 'Expired' }
      mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(data) })
      const result = await expirePreview(projectId)
      expect(result.status).toBe('Expired')
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining(`/api/projects/${projectId}/preview`),
        expect.objectContaining({ method: 'DELETE' })
      )
    })

    it('throws on failure', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false, json: () => Promise.resolve({ error: 'no preview' }) })
      await expect(expirePreview(projectId)).rejects.toThrow('no preview')
    })
  })

  describe('listPreviews', () => {
    it('returns preview list', async () => {
      const data = [
        { id: 'p-1', status: 'Deployed' },
        { id: 'p-2', status: 'Expired' },
      ]
      mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(data) })
      const result = await listPreviews(projectId)
      expect(result).toHaveLength(2)
    })

    it('throws on failure', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false, json: () => Promise.resolve({}) })
      await expect(listPreviews(projectId)).rejects.toThrow()
    })
  })
})
