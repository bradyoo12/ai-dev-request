import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../i18n', () => ({ default: { t: (key: string) => key } }))
vi.mock('./auth', () => ({
  getAuthHeaders: () => ({ 'Content-Type': 'application/json', Authorization: 'Bearer test' }),
}))

const mockFetch = vi.fn()
global.fetch = mockFetch

beforeEach(() => { vi.clearAllMocks() })

import {
  triggerSecretScan,
  getSecretScanResults,
  getSecretPatterns,
  generateSecureConfig,
  getSecureConfig,
} from './secrets'

describe('secrets api', () => {
  const requestId = '00000000-0000-0000-0000-000000000001'

  describe('triggerSecretScan', () => {
    it('returns scan response', async () => {
      const data = { scanResultId: 'scan-1', findingCount: 3, criticalCount: 1, highCount: 1, mediumCount: 1, lowCount: 0, status: 'completed', scannedAt: '2026-01-01T00:00:00Z' }
      mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(data) })
      const result = await triggerSecretScan(requestId)
      expect(result).toEqual(data)
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining(`/api/projects/${requestId}/secrets/scan`),
        expect.objectContaining({ method: 'POST' })
      )
    })

    it('throws on failure', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false, json: () => Promise.resolve({ error: 'fail' }) })
      await expect(triggerSecretScan(requestId)).rejects.toThrow('fail')
    })
  })

  describe('getSecretScanResults', () => {
    it('returns results when found', async () => {
      const data = { id: 'scan-1', findings: [], findingCount: 0, status: 'completed' }
      mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(data) })
      expect(await getSecretScanResults(requestId)).toEqual(data)
    })

    it('returns null when not found', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false })
      expect(await getSecretScanResults(requestId)).toBeNull()
    })
  })

  describe('getSecretPatterns', () => {
    it('returns patterns list', async () => {
      const data = [{ id: 'aws-key', name: 'AWS Access Key', severity: 'critical', description: 'AWS key' }]
      mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(data) })
      const result = await getSecretPatterns()
      expect(result).toEqual(data)
    })

    it('returns empty array on failure', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false })
      expect(await getSecretPatterns()).toEqual([])
    })
  })

  describe('generateSecureConfig', () => {
    it('returns config response', async () => {
      const data = { id: 'cfg-1', envTemplate: '# env', gitignore: '.env', configModule: 'export const config', keyVaultConfig: '// kv', language: 'typescript' }
      mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(data) })
      const result = await generateSecureConfig(requestId, 'typescript')
      expect(result).toEqual(data)
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining(`/api/projects/${requestId}/secrets/config/generate?language=typescript`),
        expect.objectContaining({ method: 'POST' })
      )
    })

    it('throws on failure', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false, json: () => Promise.resolve({ error: 'gen fail' }) })
      await expect(generateSecureConfig(requestId)).rejects.toThrow('gen fail')
    })
  })

  describe('getSecureConfig', () => {
    it('returns config when found', async () => {
      const data = { id: 'cfg-1', envTemplate: '# env', language: 'typescript' }
      mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(data) })
      expect(await getSecureConfig(requestId)).toEqual(data)
    })

    it('returns null when not found', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false })
      expect(await getSecureConfig(requestId)).toBeNull()
    })
  })
})
