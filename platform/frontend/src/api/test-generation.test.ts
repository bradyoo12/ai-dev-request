import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../i18n', () => ({ default: { t: (key: string) => key } }))
vi.mock('./auth', () => ({
  getAuthHeaders: () => ({ 'Content-Type': 'application/json', Authorization: 'Bearer test' }),
}))

const mockFetch = vi.fn()
global.fetch = mockFetch

beforeEach(() => { vi.clearAllMocks() })

import {
  triggerTestGeneration,
  getTestResults,
  getTestHistory,
  generateFromNaturalLanguage,
  getMcpStatus,
  configureMcp,
  analyzeCoverage,
} from './test-generation'

describe('test-generation api', () => {
  describe('triggerTestGeneration', () => {
    it('triggers test generation for a project', async () => {
      const data = { id: 'gen-1', projectId: 1, status: 'completed', testFilesGenerated: 3 }
      mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(data) })
      expect(await triggerTestGeneration(1)).toEqual(data)
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/projects/1/tests/generate'),
        expect.objectContaining({ method: 'POST' })
      )
    })
    it('throws on failure', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false, json: () => Promise.resolve({ error: 'Generation failed' }) })
      await expect(triggerTestGeneration(1)).rejects.toThrow('Generation failed')
    })
  })

  describe('getTestResults', () => {
    it('returns test results', async () => {
      const data = { id: 'gen-1', projectId: 1, status: 'completed' }
      mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(data) })
      expect(await getTestResults(1)).toEqual(data)
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/projects/1/tests/results'),
        expect.any(Object)
      )
    })
    it('returns null on failure', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false })
      expect(await getTestResults(1)).toBeNull()
    })
  })

  describe('getTestHistory', () => {
    it('returns test history', async () => {
      const data = [
        { id: 'gen-2', generationVersion: 2 },
        { id: 'gen-1', generationVersion: 1 },
      ]
      mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(data) })
      expect(await getTestHistory(1)).toEqual(data)
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/projects/1/tests/history'),
        expect.any(Object)
      )
    })
    it('returns empty array on failure', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false })
      expect(await getTestHistory(1)).toEqual([])
    })
  })

  describe('generateFromNaturalLanguage', () => {
    it('generates tests from natural language scenario', async () => {
      const data = { id: 'gen-1', status: 'completed', totalTestCount: 5 }
      mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(data) })
      expect(await generateFromNaturalLanguage(1, 'user logs in', 'e2e')).toEqual(data)
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/projects/1/tests/generate-from-nl'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ scenario: 'user logs in', testType: 'e2e' }),
        })
      )
    })
    it('throws on failure', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false, json: () => Promise.resolve({ error: 'NL gen failed' }) })
      await expect(generateFromNaturalLanguage(1, 'scenario', 'e2e')).rejects.toThrow('NL gen failed')
    })
  })

  describe('getMcpStatus', () => {
    it('returns MCP connection status', async () => {
      const data = { isConfigured: true, status: 'connected', serverUrl: 'http://localhost:3000' }
      mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(data) })
      expect(await getMcpStatus(1)).toEqual(data)
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/projects/1/tests/mcp-status'),
        expect.any(Object)
      )
    })
    it('returns default status on failure', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false })
      const result = await getMcpStatus(1)
      expect(result.isConfigured).toBe(false)
      expect(result.status).toBe('not_configured')
    })
  })

  describe('configureMcp', () => {
    it('configures MCP connection', async () => {
      const data = { id: 'cfg-1', projectId: 1, serverUrl: 'http://localhost:3000', status: 'connected' }
      mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(data) })
      expect(await configureMcp(1, 'http://localhost:3000', 'sse')).toEqual(data)
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/projects/1/tests/configure-mcp'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ serverUrl: 'http://localhost:3000', transport: 'sse', authType: undefined, authToken: undefined }),
        })
      )
    })
    it('throws on failure', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false, json: () => Promise.resolve({ error: 'Config failed' }) })
      await expect(configureMcp(1, 'http://bad', 'sse')).rejects.toThrow('Config failed')
    })
  })

  describe('analyzeCoverage', () => {
    it('analyzes test coverage', async () => {
      const data = { overallCoverage: 72, lineCoverage: 80, branchCoverage: 60, summary: 'Good coverage' }
      mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(data) })
      expect(await analyzeCoverage(1)).toEqual(data)
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/projects/1/tests/coverage-analysis'),
        expect.objectContaining({ method: 'POST' })
      )
    })
    it('throws on failure', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false, json: () => Promise.resolve({ error: 'Coverage failed' }) })
      await expect(analyzeCoverage(1)).rejects.toThrow('Coverage failed')
    })
  })
})
