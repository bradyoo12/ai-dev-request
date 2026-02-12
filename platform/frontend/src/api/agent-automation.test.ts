import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../i18n', () => ({
  default: { t: (key: string) => key },
}))

vi.mock('./auth', () => ({
  authFetch: vi.fn(),
}))

import {
  getAgentConfig,
  updateAgentConfig,
  getAgentTasks,
  retryAgentTask,
} from './agent-automation'
import type { AgentAutomationConfig, AgentTask } from './agent-automation'
import { authFetch } from './auth'

const mockAuthFetch = vi.mocked(authFetch)

beforeEach(() => {
  vi.clearAllMocks()
})

describe('agent-automation api', () => {
  const mockConfig: AgentAutomationConfig = {
    enabled: true,
    triggerLabels: ['auto-implement', 'agent'],
    maxConcurrent: 2,
    autoMerge: false,
  }

  const mockTask: AgentTask = {
    id: 'task-1',
    issueNumber: 42,
    issueTitle: 'Fix login bug',
    status: 'implementing',
    startedAt: '2024-01-01T00:00:00Z',
  }

  describe('getAgentConfig', () => {
    it('fetches agent automation config', async () => {
      mockAuthFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockConfig),
      } as Response)

      const result = await getAgentConfig()
      expect(result).toEqual(mockConfig)
      expect(mockAuthFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/agent-automation/config')
      )
    })

    it('throws with server error on failure', async () => {
      mockAuthFetch.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ error: 'Config not found' }),
      } as Response)

      await expect(getAgentConfig()).rejects.toThrow('Config not found')
    })

    it('throws default error when JSON parse fails', async () => {
      mockAuthFetch.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.reject(new Error('parse')),
      } as Response)

      await expect(getAgentConfig()).rejects.toThrow('api.error.agentAutomationConfigLoad')
    })
  })

  describe('updateAgentConfig', () => {
    it('sends PUT with updated config', async () => {
      const updated = { ...mockConfig, enabled: false }
      mockAuthFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(updated),
      } as Response)

      const result = await updateAgentConfig({ enabled: false })
      expect(result.enabled).toBe(false)
      expect(mockAuthFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/agent-automation/config'),
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify({ enabled: false }),
        })
      )
    })

    it('throws on failure', async () => {
      mockAuthFetch.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ error: 'Invalid config' }),
      } as Response)

      await expect(updateAgentConfig({})).rejects.toThrow('Invalid config')
    })
  })

  describe('getAgentTasks', () => {
    it('fetches agent tasks', async () => {
      mockAuthFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([mockTask]),
      } as Response)

      const result = await getAgentTasks()
      expect(result).toHaveLength(1)
      expect(result[0].issueNumber).toBe(42)
      expect(mockAuthFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/agent-automation/tasks')
      )
    })

    it('passes page parameter', async () => {
      mockAuthFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([]),
      } as Response)

      await getAgentTasks(2)
      expect(mockAuthFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/agent-automation/tasks?page=2')
      )
    })

    it('throws on failure', async () => {
      mockAuthFetch.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ error: 'Unauthorized' }),
      } as Response)

      await expect(getAgentTasks()).rejects.toThrow('Unauthorized')
    })
  })

  describe('retryAgentTask', () => {
    it('sends POST to retry a task', async () => {
      const retried = { ...mockTask, status: 'queued' as const }
      mockAuthFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(retried),
      } as Response)

      const result = await retryAgentTask('task-1')
      expect(result.status).toBe('queued')
      expect(mockAuthFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/agent-automation/tasks/task-1/retry'),
        expect.objectContaining({ method: 'POST' })
      )
    })

    it('throws on failure', async () => {
      mockAuthFetch.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ error: 'Task not found' }),
      } as Response)

      await expect(retryAgentTask('task-999')).rejects.toThrow('Task not found')
    })
  })
})
