import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../i18n', () => ({ default: { t: (key: string) => key } }))
vi.mock('./auth', () => ({
  getAuthHeaders: () => ({ 'Content-Type': 'application/json', Authorization: 'Bearer test' }),
}))

const mockFetch = vi.fn()
global.fetch = mockFetch

beforeEach(() => { vi.clearAllMocks() })

import { startWorkflow, getWorkflowStatus, retryWorkflowStep, cancelWorkflow, listWorkflows, getWorkflowMetrics } from './workflows'

describe('workflows api', () => {
  describe('startWorkflow', () => {
    it('starts workflow', async () => {
      const data = { id: 1, devRequestId: 1, workflowType: 'full', status: 'Running', stepsJson: '[]', retryCount: 0, createdAt: '2024-01-01' }
      mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(data) })
      expect(await startWorkflow(1)).toEqual(data)
    })
    it('throws on failure', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false, json: () => Promise.resolve({ error: 'Failed' }) })
      await expect(startWorkflow(1)).rejects.toThrow('Failed')
    })
  })

  describe('getWorkflowStatus', () => {
    it('returns workflow', async () => {
      const data = { id: 1, status: 'Running' }
      mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(data) })
      expect(await getWorkflowStatus(1)).toEqual(data)
    })
    it('returns null on failure', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false })
      expect(await getWorkflowStatus(1)).toBeNull()
    })
  })

  describe('retryWorkflowStep', () => {
    it('retries step', async () => {
      const data = { id: 1, retryCount: 1 }
      mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(data) })
      expect(await retryWorkflowStep(1, 'analysis')).toEqual(data)
    })
    it('throws on failure', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false, json: () => Promise.resolve({ error: 'Not failed' }) })
      await expect(retryWorkflowStep(1, 'analysis')).rejects.toThrow('Not failed')
    })
  })

  describe('cancelWorkflow', () => {
    it('cancels workflow', async () => {
      const data = { id: 1, status: 'Cancelled' }
      mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(data) })
      expect(await cancelWorkflow(1)).toEqual(data)
    })
    it('throws on failure', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false, json: () => Promise.resolve({ error: 'Already done' }) })
      await expect(cancelWorkflow(1)).rejects.toThrow('Already done')
    })
  })

  describe('listWorkflows', () => {
    it('returns workflows', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve([]) })
      expect(await listWorkflows()).toEqual([])
    })
    it('returns empty on failure', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false })
      expect(await listWorkflows()).toEqual([])
    })
    it('passes requestId parameter', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve([]) })
      await listWorkflows(42)
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('?requestId=42'),
        expect.any(Object)
      )
    })
  })

  describe('getWorkflowMetrics', () => {
    it('returns metrics', async () => {
      const data = { totalWorkflows: 10, completedWorkflows: 8, failedWorkflows: 2, runningWorkflows: 0, successRate: 80, avgDurationSeconds: 120, stepFailureRates: [] }
      mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(data) })
      expect(await getWorkflowMetrics()).toEqual(data)
    })
    it('throws on failure', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false })
      await expect(getWorkflowMetrics()).rejects.toThrow()
    })
  })
})
