import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../i18n', () => ({ default: { t: (key: string) => key } }))
vi.mock('./auth', () => ({
  getAuthHeaders: () => ({ 'Content-Type': 'application/json', Authorization: 'Bearer test' }),
}))

const mockFetch = vi.fn()
global.fetch = mockFetch

beforeEach(() => { vi.clearAllMocks() })

import { triggerCompilation, getCompilationResult, triggerAutoFix, getSupportedLanguages } from './compiler'

describe('compiler api', () => {
  describe('triggerCompilation', () => {
    it('triggers compilation', async () => {
      const data = { resultId: 'r1', success: true, errors: [], warnings: [], rawOutput: '', retryCount: 0 }
      mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(data) })
      expect(await triggerCompilation('req-1', 'typescript')).toEqual(data)
    })
    it('throws on failure', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false, json: () => Promise.resolve({ error: 'Failed' }) })
      await expect(triggerCompilation('req-1', 'typescript')).rejects.toThrow('Failed')
    })
  })

  describe('getCompilationResult', () => {
    it('returns result', async () => {
      const data = { id: 'r1', devRequestId: 'req-1', language: 'typescript', success: true, errorsJson: '[]', warningsJson: '[]', retryCount: 0, compiledAt: '2026-01-01' }
      mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(data) })
      expect(await getCompilationResult('req-1')).toEqual(data)
    })
    it('returns null on failure', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false })
      expect(await getCompilationResult('req-1')).toBeNull()
    })
  })

  describe('triggerAutoFix', () => {
    it('triggers auto-fix', async () => {
      const data = { resultId: 'r2', success: true, errors: [], warnings: [], rawOutput: '', retryCount: 2 }
      mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(data) })
      expect(await triggerAutoFix('req-1')).toEqual(data)
    })
    it('throws on failure', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false, json: () => Promise.resolve({ error: 'Fix failed' }) })
      await expect(triggerAutoFix('req-1')).rejects.toThrow('Fix failed')
    })
  })

  describe('getSupportedLanguages', () => {
    it('returns languages', async () => {
      const data = [{ id: 'typescript', name: 'TypeScript', command: 'npx tsc', extensions: ['.ts'] }]
      mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(data) })
      expect(await getSupportedLanguages()).toEqual(data)
    })
    it('returns empty on failure', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false })
      expect(await getSupportedLanguages()).toEqual([])
    })
  })
})
