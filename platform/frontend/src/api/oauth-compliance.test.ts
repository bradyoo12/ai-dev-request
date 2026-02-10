import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../i18n', () => ({ default: { t: (key: string) => key } }))
vi.mock('./auth', () => ({
  getAuthHeaders: () => ({ 'Content-Type': 'application/json', Authorization: 'Bearer test' }),
}))

const mockFetch = vi.fn()
global.fetch = mockFetch

beforeEach(() => { vi.clearAllMocks() })

import {
  analyzeOAuthScopes,
  getOAuthReport,
  generateComplianceDocs,
  getComplianceDocs,
  getOAuthScopes,
} from './oauth-compliance'

describe('oauth-compliance api', () => {
  const requestId = '00000000-0000-0000-0000-000000000001'

  describe('analyzeOAuthScopes', () => {
    it('returns analysis response', async () => {
      const data = { reportId: 'rpt-1', totalScopesDetected: 5, overPermissionedCount: 2, status: 'analyzed', createdAt: '2026-01-01T00:00:00Z' }
      mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(data) })
      const result = await analyzeOAuthScopes(requestId)
      expect(result).toEqual(data)
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining(`/api/projects/${requestId}/oauth/analyze`),
        expect.objectContaining({ method: 'POST' })
      )
    })

    it('throws on failure', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false, json: () => Promise.resolve({ error: 'fail' }) })
      await expect(analyzeOAuthScopes(requestId)).rejects.toThrow('fail')
    })
  })

  describe('getOAuthReport', () => {
    it('returns report when found', async () => {
      const data = { id: 'rpt-1', totalScopesDetected: 3, overPermissionedCount: 1, status: 'analyzed' }
      mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(data) })
      expect(await getOAuthReport(requestId)).toEqual(data)
    })

    it('returns null when not found', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false })
      expect(await getOAuthReport(requestId)).toBeNull()
    })
  })

  describe('generateComplianceDocs', () => {
    it('returns updated report', async () => {
      const data = { id: 'rpt-1', status: 'docs_generated', complianceDocsJson: '{}' }
      mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(data) })
      const result = await generateComplianceDocs(requestId)
      expect(result).toEqual(data)
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining(`/api/projects/${requestId}/oauth/compliance-docs`),
        expect.objectContaining({ method: 'POST' })
      )
    })

    it('throws on failure', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false, json: () => Promise.resolve({ error: 'gen fail' }) })
      await expect(generateComplianceDocs(requestId)).rejects.toThrow('gen fail')
    })
  })

  describe('getComplianceDocs', () => {
    it('returns docs when found', async () => {
      const data = { privacyPolicy: '# Privacy', dataUsageDisclosure: '# Data', scopeJustifications: '# Scopes', providerCompliance: '# Provider', generatedAt: '2026-01-01T00:00:00Z' }
      mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(data) })
      expect(await getComplianceDocs(requestId)).toEqual(data)
    })

    it('returns null when not found', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false })
      expect(await getComplianceDocs(requestId)).toBeNull()
    })
  })

  describe('getOAuthScopes', () => {
    it('returns scopes list', async () => {
      const data = [
        { provider: 'google', scope: 'email', description: 'Email', justification: 'Auth', isOverPermissioned: false, detectedInFile: 'src/auth.ts' },
      ]
      mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(data) })
      const result = await getOAuthScopes(requestId)
      expect(result).toEqual(data)
    })

    it('returns empty array on failure', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false })
      expect(await getOAuthScopes(requestId)).toEqual([])
    })
  })
})
