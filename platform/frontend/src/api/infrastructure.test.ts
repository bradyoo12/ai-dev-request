import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../i18n', () => ({ default: { t: (key: string) => key } }))
vi.mock('./auth', () => ({
  getAuthHeaders: () => ({ 'Content-Type': 'application/json', Authorization: 'Bearer test' }),
}))

const mockFetch = vi.fn()
global.fetch = mockFetch

beforeEach(() => { vi.clearAllMocks() })

import {
  analyzeInfrastructure,
  getInfrastructureConfig,
  updateInfrastructureConfig,
  generateBicep,
  getCostEstimation,
  downloadTemplates,
} from './infrastructure'

describe('infrastructure api', () => {
  const projectId = '00000000-0000-0000-0000-000000000001'

  describe('analyzeInfrastructure', () => {
    it('returns analysis result', async () => {
      const data = { id: 'cfg-1', selectedServices: ['container_apps'], tier: 'Basic' }
      mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(data) })
      const result = await analyzeInfrastructure(projectId)
      expect(result).toEqual(data)
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining(`/api/projects/${projectId}/infrastructure/analyze`),
        expect.objectContaining({ method: 'POST' })
      )
    })

    it('throws on failure', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false, json: () => Promise.resolve({ error: 'fail' }) })
      await expect(analyzeInfrastructure(projectId)).rejects.toThrow('fail')
    })
  })

  describe('getInfrastructureConfig', () => {
    it('returns config when found', async () => {
      const data = { id: 'cfg-1', tier: 'Free' }
      mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(data) })
      expect(await getInfrastructureConfig(projectId)).toEqual(data)
    })

    it('returns null when not found', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false })
      expect(await getInfrastructureConfig(projectId)).toBeNull()
    })
  })

  describe('updateInfrastructureConfig', () => {
    it('sends PUT with services and tier', async () => {
      const data = { id: 'cfg-1', selectedServices: ['postgresql'], tier: 'Standard' }
      mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(data) })
      const result = await updateInfrastructureConfig(projectId, ['postgresql'], 'Standard')
      expect(result).toEqual(data)
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining(`/api/projects/${projectId}/infrastructure/config`),
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify({ selectedServices: ['postgresql'], tier: 'Standard' }),
        })
      )
    })

    it('throws on failure', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false, json: () => Promise.resolve({ error: 'bad' }) })
      await expect(updateInfrastructureConfig(projectId, [], 'Basic')).rejects.toThrow('bad')
    })
  })

  describe('generateBicep', () => {
    it('returns config with generated templates', async () => {
      const data = { id: 'cfg-1', generatedBicepMain: 'targetScope...' }
      mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(data) })
      const result = await generateBicep(projectId)
      expect(result.generatedBicepMain).toBe('targetScope...')
    })

    it('throws on failure', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false, json: () => Promise.resolve({}) })
      await expect(generateBicep(projectId)).rejects.toThrow()
    })
  })

  describe('getCostEstimation', () => {
    it('returns cost estimation', async () => {
      const data = { lineItems: [], totalMonthlyCostUsd: 25, tier: 'Basic', currency: 'USD' }
      mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(data) })
      const result = await getCostEstimation(projectId)
      expect(result.totalMonthlyCostUsd).toBe(25)
    })

    it('throws on failure', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false, json: () => Promise.resolve({}) })
      await expect(getCostEstimation(projectId)).rejects.toThrow()
    })
  })

  describe('downloadTemplates', () => {
    it('returns blob', async () => {
      const blob = new Blob(['zip-data'], { type: 'application/zip' })
      mockFetch.mockResolvedValueOnce({ ok: true, blob: () => Promise.resolve(blob) })
      const result = await downloadTemplates(projectId)
      expect(result).toBeInstanceOf(Blob)
    })

    it('throws on failure', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false })
      await expect(downloadTemplates(projectId)).rejects.toThrow('Template download failed')
    })
  })
})
