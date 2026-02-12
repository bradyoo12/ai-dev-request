import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  startOrchestration,
  getOrchestrationStatus,
  getOrchestrationTasks,
  cancelOrchestration,
  getConflicts,
  resolveConflict,
  createEventSource,
} from './orchestration'

// Mock fetch globally
global.fetch = vi.fn()

// Mock getAuthHeaders
vi.mock('./auth', () => ({
  getAuthHeaders: () => ({ Authorization: 'Bearer test-token' }),
}))

// Mock i18n
vi.mock('../i18n', () => ({
  default: {
    t: (key: string) => key,
  },
}))

describe('Orchestration API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('startOrchestration', () => {
    it('should start orchestration successfully', async () => {
      const mockResponse = {
        id: 1,
        devRequestId: 'test-123',
        status: 'running',
        totalTasks: 5,
        completedTasks: 0,
        failedTasks: 0,
        dependencyGraphJson: '{}',
        totalDurationMs: 0,
        createdAt: new Date().toISOString(),
      }

      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response)

      const result = await startOrchestration('test-123')

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/requests/test-123/orchestration/start'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({ Authorization: 'Bearer test-token' }),
        })
      )
      expect(result).toEqual(mockResponse)
    })

    it('should handle errors', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ message: 'Start failed' }),
      } as Response)

      await expect(startOrchestration('test-123')).rejects.toThrow('Start failed')
    })
  })

  describe('getOrchestrationStatus', () => {
    it('should fetch orchestration status', async () => {
      const mockStatus = {
        id: 1,
        devRequestId: 'test-123',
        status: 'running',
        totalTasks: 5,
        completedTasks: 2,
        failedTasks: 0,
        dependencyGraphJson: '{}',
        totalDurationMs: 30000,
        createdAt: new Date().toISOString(),
      }

      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockStatus,
      } as Response)

      const result = await getOrchestrationStatus('test-123')

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/requests/test-123/orchestration/status'),
        expect.objectContaining({
          headers: expect.objectContaining({ Authorization: 'Bearer test-token' }),
        })
      )
      expect(result).toEqual(mockStatus)
    })
  })

  describe('getOrchestrationTasks', () => {
    it('should fetch orchestration tasks', async () => {
      const mockTasks = [
        {
          id: 1,
          devRequestId: 'test-123',
          parentOrchestrationId: 1,
          taskType: 'frontend',
          name: 'Generate Frontend',
          description: 'Creating components',
          contextJson: '{}',
          status: 'completed',
          durationMs: 15000,
          tokensUsed: 5000,
          createdAt: new Date().toISOString(),
        },
      ]

      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockTasks,
      } as Response)

      const result = await getOrchestrationTasks('test-123')

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/requests/test-123/orchestration/tasks'),
        expect.any(Object)
      )
      expect(result).toEqual(mockTasks)
    })
  })

  describe('cancelOrchestration', () => {
    it('should cancel orchestration', async () => {
      const mockResponse = {
        id: 1,
        devRequestId: 'test-123',
        status: 'failed',
        totalTasks: 5,
        completedTasks: 2,
        failedTasks: 3,
        dependencyGraphJson: '{}',
        totalDurationMs: 30000,
        createdAt: new Date().toISOString(),
      }

      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response)

      const result = await cancelOrchestration('test-123')

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/requests/test-123/orchestration/cancel'),
        expect.objectContaining({
          method: 'POST',
        })
      )
      expect(result).toEqual(mockResponse)
    })
  })

  describe('getConflicts', () => {
    it('should fetch conflicts', async () => {
      const mockConflicts = [
        {
          id: 1,
          type: 'import',
          filePath: 'src/types.ts',
          description: 'Import conflict',
          conflictingTasks: [1, 2],
          status: 'unresolved',
        },
      ]

      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockConflicts,
      } as Response)

      const result = await getConflicts(1)

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/orchestration/1/conflicts'),
        expect.any(Object)
      )
      expect(result).toEqual(mockConflicts)
    })
  })

  describe('resolveConflict', () => {
    it('should resolve conflict with auto mode', async () => {
      const mockResolved = {
        id: 1,
        type: 'import',
        filePath: 'src/types.ts',
        description: 'Import conflict',
        conflictingTasks: [1, 2],
        status: 'resolved',
        resolutionJson: '{"strategy": "auto"}',
      }

      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResolved,
      } as Response)

      const result = await resolveConflict(1, 1, true)

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/orchestration/1/resolve'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ conflictId: 1, auto: true }),
        })
      )
      expect(result).toEqual(mockResolved)
    })

    it('should resolve conflict with manual mode', async () => {
      const mockResolved = {
        id: 1,
        type: 'import',
        filePath: 'src/types.ts',
        description: 'Import conflict',
        conflictingTasks: [1, 2],
        status: 'manual',
      }

      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResolved,
      } as Response)

      const result = await resolveConflict(1, 1, false)

      expect(result).toEqual(mockResolved)
    })
  })

  describe('createEventSource', () => {
    it('should create EventSource with correct URL', () => {
      const mockEventSource = {
        onmessage: null,
        onerror: null,
        close: vi.fn(),
      }

      const EventSourceConstructor = vi.fn(function(this: unknown) {
        return mockEventSource
      })
      global.EventSource = EventSourceConstructor as unknown as typeof EventSource

      const eventSource = createEventSource(1)

      expect(global.EventSource).toHaveBeenCalledWith(
        expect.stringContaining('/api/orchestration/1/stream')
      )
      expect(eventSource).toBeDefined()
    })
  })
})
