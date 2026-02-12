import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../i18n', () => ({
  default: { t: (key: string) => key },
}))

vi.mock('./auth', () => ({
  authFetch: vi.fn(),
}))

import {
  listPipelines,
  getPipeline,
  createPipeline,
  updatePipeline,
  deletePipeline,
} from './pipelines'
import type { Pipeline } from './pipelines'
import { authFetch } from './auth'

const mockAuthFetch = vi.mocked(authFetch)

beforeEach(() => {
  vi.clearAllMocks()
})

describe('pipelines api', () => {
  const mockPipeline: Pipeline = {
    id: 'pipe-1',
    name: 'My Pipeline',
    description: 'A test pipeline',
    steps: [
      { id: 's1', type: 'analyze', name: 'Analyze', enabled: true },
    ],
    status: 'active',
    isTemplate: false,
    executionCount: 3,
    isOwner: true,
    createdAt: '2024-01-01',
    updatedAt: '2024-01-02',
  }

  describe('listPipelines', () => {
    it('calls correct URL and returns pipelines', async () => {
      mockAuthFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([mockPipeline]),
      } as Response)

      const result = await listPipelines()
      expect(result).toEqual([mockPipeline])
      expect(mockAuthFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/pipelines')
      )
    })

    it('throws with server error on failure', async () => {
      mockAuthFetch.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ error: 'Unauthorized' }),
      } as Response)

      await expect(listPipelines()).rejects.toThrow('Unauthorized')
    })

    it('throws default error when JSON parse fails', async () => {
      mockAuthFetch.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.reject(new Error('parse')),
      } as Response)

      await expect(listPipelines()).rejects.toThrow('api.error.pipelineLoad')
    })
  })

  describe('getPipeline', () => {
    it('calls correct URL with pipeline ID', async () => {
      mockAuthFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockPipeline),
      } as Response)

      const result = await getPipeline('pipe-1')
      expect(result).toEqual(mockPipeline)
      expect(mockAuthFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/pipelines/pipe-1')
      )
    })

    it('throws on failure', async () => {
      mockAuthFetch.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({}),
      } as Response)

      await expect(getPipeline('invalid')).rejects.toThrow()
    })
  })

  describe('createPipeline', () => {
    it('sends POST with pipeline data', async () => {
      mockAuthFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockPipeline),
      } as Response)

      const data = {
        name: 'My Pipeline',
        description: 'A test pipeline',
        steps: [{ id: 's1', type: 'analyze', name: 'Analyze', enabled: true }],
      }
      const result = await createPipeline(data)
      expect(result).toEqual(mockPipeline)
      expect(mockAuthFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/pipelines'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(data),
        })
      )
    })

    it('throws with server error on failure', async () => {
      mockAuthFetch.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ error: 'Validation failed' }),
      } as Response)

      await expect(createPipeline({ name: '', steps: [] })).rejects.toThrow('Validation failed')
    })
  })

  describe('updatePipeline', () => {
    it('sends PUT with updated data', async () => {
      const updated = { ...mockPipeline, name: 'Updated Pipeline' }
      mockAuthFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(updated),
      } as Response)

      const result = await updatePipeline('pipe-1', { name: 'Updated Pipeline' })
      expect(result.name).toBe('Updated Pipeline')
      expect(mockAuthFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/pipelines/pipe-1'),
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify({ name: 'Updated Pipeline' }),
        })
      )
    })

    it('throws on failure', async () => {
      mockAuthFetch.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ error: 'Not found' }),
      } as Response)

      await expect(updatePipeline('invalid', { name: 'x' })).rejects.toThrow('Not found')
    })
  })

  describe('deletePipeline', () => {
    it('sends DELETE for pipeline ID', async () => {
      mockAuthFetch.mockResolvedValueOnce({
        ok: true,
      } as Response)

      await deletePipeline('pipe-1')
      expect(mockAuthFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/pipelines/pipe-1'),
        expect.objectContaining({ method: 'DELETE' })
      )
    })

    it('throws with server error on failure', async () => {
      mockAuthFetch.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ error: 'Cannot delete' }),
      } as Response)

      await expect(deletePipeline('pipe-1')).rejects.toThrow('Cannot delete')
    })
  })
})
