import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../i18n', () => ({
  default: { t: (key: string) => key },
}))

vi.mock('./auth', () => ({
  getAuthHeaders: () => ({ 'Content-Type': 'application/json', Authorization: 'Bearer test' }),
}))

const mockFetch = vi.fn()
global.fetch = mockFetch

beforeEach(() => {
  vi.clearAllMocks()
})

import {
  InsufficientTokensError,
  createRequest,
  getRequest,
  getRequests,
  analyzeRequest,
  getAnalysis,
  generateProposal,
  getProposal,
  approveProposal,
  startBuild,
  getBuildStatus,
  completeRequest,
  getPricingPlans,
  getCostEstimate,
  exportZip,
  exportToGitHub,
  getVersions,
  rollbackToVersion,
  getGitHubStatus,
  syncToGitHub,
  getTemplates,
} from './requests'

describe('requests api', () => {
  describe('InsufficientTokensError', () => {
    it('creates error with correct properties', () => {
      const err = new InsufficientTokensError({ required: 100, balance: 10, shortfall: 90, action: 'build' })
      expect(err.name).toBe('InsufficientTokensError')
      expect(err.required).toBe(100)
      expect(err.balance).toBe(10)
      expect(err.shortfall).toBe(90)
      expect(err.action).toBe('build')
    })
  })

  describe('createRequest', () => {
    it('creates request successfully', async () => {
      const data = { id: '1', description: 'test', category: 'web', complexity: 'simple', status: 'new', createdAt: '2024-01-01' }
      mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(data) })
      const result = await createRequest({ description: 'test' })
      expect(result).toEqual(data)
      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/api/requests'), expect.objectContaining({ method: 'POST' }))
    })

    it('throws on failure', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false, json: () => Promise.resolve({ message: 'Failed' }) })
      await expect(createRequest({ description: 'test' })).rejects.toThrow('Failed')
    })
  })

  describe('getRequest', () => {
    it('returns request', async () => {
      const data = { id: '1', description: 'test' }
      mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(data) })
      const result = await getRequest('1')
      expect(result).toEqual(data)
    })

    it('throws on failure', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false })
      await expect(getRequest('1')).rejects.toThrow()
    })
  })

  describe('getRequests', () => {
    it('returns list of requests', async () => {
      const data = [{ id: '1' }]
      mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(data) })
      const result = await getRequests()
      expect(result).toEqual(data)
    })

    it('throws on failure', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false })
      await expect(getRequests()).rejects.toThrow()
    })
  })

  describe('analyzeRequest', () => {
    it('analyzes request', async () => {
      const data = { requestId: '1', category: 'web', complexity: 'simple', summary: 'test' }
      mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(data) })
      const result = await analyzeRequest('1')
      expect(result).toEqual(data)
    })

    it('throws InsufficientTokensError on 402', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 402,
        json: () => Promise.resolve({ required: 100, balance: 10, shortfall: 90, action: 'analysis' }),
      })
      await expect(analyzeRequest('1')).rejects.toThrow(InsufficientTokensError)
    })

    it('throws on other errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: () => Promise.resolve({ error: 'Server error' }),
      })
      await expect(analyzeRequest('1')).rejects.toThrow('Server error')
    })
  })

  describe('getAnalysis', () => {
    it('returns analysis', async () => {
      const data = { requestId: '1', category: 'web' }
      mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(data) })
      const result = await getAnalysis('1')
      expect(result).toEqual(data)
    })

    it('throws on failure', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false })
      await expect(getAnalysis('1')).rejects.toThrow()
    })
  })

  describe('generateProposal', () => {
    it('generates proposal', async () => {
      const data = { requestId: '1', proposal: { title: 'test' } }
      mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(data) })
      const result = await generateProposal('1')
      expect(result).toEqual(data)
    })

    it('throws InsufficientTokensError on 402', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 402,
        json: () => Promise.resolve({ required: 200, balance: 10, shortfall: 190, action: 'proposal' }),
      })
      await expect(generateProposal('1')).rejects.toThrow(InsufficientTokensError)
    })
  })

  describe('getProposal', () => {
    it('returns proposal', async () => {
      const data = { requestId: '1', proposal: {} }
      mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(data) })
      const result = await getProposal('1')
      expect(result).toEqual(data)
    })

    it('throws on failure', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false })
      await expect(getProposal('1')).rejects.toThrow()
    })
  })

  describe('approveProposal', () => {
    it('approves proposal', async () => {
      const data = { id: '1', status: 'approved' }
      mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(data) })
      const result = await approveProposal('1')
      expect(result).toEqual(data)
    })

    it('throws on failure', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false, json: () => Promise.resolve({}) })
      await expect(approveProposal('1')).rejects.toThrow()
    })
  })

  describe('startBuild', () => {
    it('starts build', async () => {
      const data = { requestId: '1', production: { projectId: 'p1' } }
      mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(data) })
      const result = await startBuild('1')
      expect(result).toEqual(data)
    })

    it('throws InsufficientTokensError on 402', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 402,
        json: () => Promise.resolve({ required: 300, balance: 10, shortfall: 290, action: 'build' }),
      })
      await expect(startBuild('1')).rejects.toThrow(InsufficientTokensError)
    })
  })

  describe('getBuildStatus', () => {
    it('returns build status', async () => {
      const data = { requestId: '1', status: 'building' }
      mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(data) })
      const result = await getBuildStatus('1')
      expect(result).toEqual(data)
    })

    it('throws on failure', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false })
      await expect(getBuildStatus('1')).rejects.toThrow()
    })
  })

  describe('completeRequest', () => {
    it('completes request', async () => {
      const data = { id: '1', status: 'completed' }
      mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(data) })
      const result = await completeRequest('1')
      expect(result).toEqual(data)
    })

    it('throws on failure', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false, json: () => Promise.resolve({}) })
      await expect(completeRequest('1')).rejects.toThrow()
    })
  })

  describe('getPricingPlans', () => {
    it('returns plans', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve([]) })
      const result = await getPricingPlans()
      expect(result).toEqual([])
    })

    it('throws on failure', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false })
      await expect(getPricingPlans()).rejects.toThrow()
    })
  })

  describe('getCostEstimate', () => {
    it('returns cost estimate', async () => {
      const data = { developmentCost: 1000, estimatedDays: 5 }
      mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(data) })
      const result = await getCostEstimate('simple', 'web')
      expect(result).toEqual(data)
    })

    it('throws on failure', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false })
      await expect(getCostEstimate('simple', 'web')).rejects.toThrow()
    })
  })

  describe('exportZip', () => {
    it('returns blob', async () => {
      const blob = new Blob(['test'])
      mockFetch.mockResolvedValueOnce({ ok: true, blob: () => Promise.resolve(blob) })
      const result = await exportZip('1')
      expect(result).toEqual(blob)
    })

    it('throws on failure', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false })
      await expect(exportZip('1')).rejects.toThrow()
    })
  })

  describe('exportToGitHub', () => {
    it('exports to github', async () => {
      const data = { repoUrl: 'https://github.com/test', repoFullName: 'user/repo', filesUploaded: 10, totalFiles: 10 }
      mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(data) })
      const result = await exportToGitHub('1', 'token')
      expect(result).toEqual(data)
    })

    it('throws on failure', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false, json: () => Promise.resolve({ message: 'Failed' }) })
      await expect(exportToGitHub('1', 'token')).rejects.toThrow('Failed')
    })
  })

  describe('getVersions', () => {
    it('returns versions', async () => {
      const data = [{ id: '1', versionNumber: 1 }]
      mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(data) })
      const result = await getVersions('1')
      expect(result).toEqual(data)
    })

    it('returns empty on failure', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false })
      const result = await getVersions('1')
      expect(result).toEqual([])
    })
  })

  describe('rollbackToVersion', () => {
    it('rolls back to version', async () => {
      const data = { id: '1', versionNumber: 2 }
      mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(data) })
      const result = await rollbackToVersion('1', 'v1')
      expect(result).toEqual(data)
    })

    it('throws on failure', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false, json: () => Promise.resolve({}) })
      await expect(rollbackToVersion('1', 'v1')).rejects.toThrow()
    })
  })

  describe('getGitHubStatus', () => {
    it('returns github status', async () => {
      const data = { linked: true, repoUrl: 'https://github.com/test' }
      mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(data) })
      const result = await getGitHubStatus('1')
      expect(result).toEqual(data)
    })

    it('returns unlinked on failure', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false })
      const result = await getGitHubStatus('1')
      expect(result).toEqual({ linked: false })
    })
  })

  describe('syncToGitHub', () => {
    it('syncs to github', async () => {
      const data = { repoFullName: 'user/repo', filesCreated: 5, filesUpdated: 3, totalFiles: 8 }
      mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(data) })
      const result = await syncToGitHub('1', 'token')
      expect(result).toEqual(data)
    })

    it('throws on failure', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false, json: () => Promise.resolve({}) })
      await expect(syncToGitHub('1', 'token')).rejects.toThrow()
    })
  })

  describe('getTemplates', () => {
    it('returns templates', async () => {
      const data = [{ id: '1', name: 'React App' }]
      mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(data) })
      const result = await getTemplates()
      expect(result).toEqual(data)
    })

    it('returns empty on failure', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false })
      const result = await getTemplates()
      expect(result).toEqual([])
    })

    it('includes filters in query', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve([]) })
      await getTemplates('web', 'react')
      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('category=web'))
    })
  })
})
