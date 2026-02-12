import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('./auth', () => ({
  authFetch: vi.fn(),
}))

import {
  listPlanningSessions,
  getPlanningSession,
  createPlanningSession,
  sendPlanningMessage,
  completePlanningSession,
  deletePlanningSession,
  getPlanningStats,
  getPlanningModes,
} from './planning'
import type { PlanningSession, PlanningStats, PlanningMode } from './planning'
import { authFetch } from './auth'

const mockAuthFetch = vi.mocked(authFetch)

beforeEach(() => {
  vi.clearAllMocks()
})

describe('planning api', () => {
  const mockSession: PlanningSession = {
    id: 'ps-1',
    userId: 'u1',
    devRequestId: null,
    sessionName: 'My Planning Session',
    status: 'active',
    mode: 'brainstorm',
    messagesJson: '[]',
    planOutputJson: '{}',
    totalMessages: 4,
    userMessages: 2,
    aiMessages: 2,
    tokensUsed: 500,
    estimatedSavings: 10,
    createdAt: '2024-01-01',
    updatedAt: '2024-01-02',
  }

  describe('listPlanningSessions', () => {
    it('fetches sessions from correct endpoint', async () => {
      mockAuthFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([mockSession]),
      } as Response)

      const result = await listPlanningSessions()
      expect(result).toEqual([mockSession])
      expect(mockAuthFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/planning/sessions')
      )
    })

    it('throws on failure', async () => {
      mockAuthFetch.mockResolvedValueOnce({ ok: false } as Response)
      await expect(listPlanningSessions()).rejects.toThrow('Failed to load sessions')
    })
  })

  describe('getPlanningSession', () => {
    it('fetches specific session by ID', async () => {
      mockAuthFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockSession),
      } as Response)

      const result = await getPlanningSession('ps-1')
      expect(result).toEqual(mockSession)
      expect(mockAuthFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/planning/sessions/ps-1')
      )
    })

    it('throws on failure', async () => {
      mockAuthFetch.mockResolvedValueOnce({ ok: false } as Response)
      await expect(getPlanningSession('invalid')).rejects.toThrow('Failed to load session')
    })
  })

  describe('createPlanningSession', () => {
    it('sends POST with session data', async () => {
      mockAuthFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockSession),
      } as Response)

      const data = { sessionName: 'My Planning Session', mode: 'brainstorm' }
      const result = await createPlanningSession(data)
      expect(result).toEqual(mockSession)
      expect(mockAuthFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/planning/sessions'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(data),
        })
      )
    })

    it('supports optional devRequestId', async () => {
      mockAuthFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockSession),
      } as Response)

      const data = { sessionName: 'Session', mode: 'brainstorm', devRequestId: 'req-1' }
      await createPlanningSession(data)
      expect(mockAuthFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: JSON.stringify(data),
        })
      )
    })

    it('throws on failure', async () => {
      mockAuthFetch.mockResolvedValueOnce({ ok: false } as Response)
      await expect(createPlanningSession({ sessionName: 'x', mode: 'brainstorm' })).rejects.toThrow('Failed to create session')
    })
  })

  describe('sendPlanningMessage', () => {
    it('sends POST with message content', async () => {
      const updatedSession = { ...mockSession, totalMessages: 6 }
      mockAuthFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(updatedSession),
      } as Response)

      const result = await sendPlanningMessage('ps-1', 'What about React?')
      expect(result.totalMessages).toBe(6)
      expect(mockAuthFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/planning/sessions/ps-1/message'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ content: 'What about React?' }),
        })
      )
    })

    it('throws on failure', async () => {
      mockAuthFetch.mockResolvedValueOnce({ ok: false } as Response)
      await expect(sendPlanningMessage('ps-1', 'hi')).rejects.toThrow('Failed to send message')
    })
  })

  describe('completePlanningSession', () => {
    it('sends POST to complete endpoint', async () => {
      const completed = { ...mockSession, status: 'completed' }
      mockAuthFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(completed),
      } as Response)

      const result = await completePlanningSession('ps-1')
      expect(result.status).toBe('completed')
      expect(mockAuthFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/planning/sessions/ps-1/complete'),
        expect.objectContaining({ method: 'POST' })
      )
    })

    it('throws on failure', async () => {
      mockAuthFetch.mockResolvedValueOnce({ ok: false } as Response)
      await expect(completePlanningSession('ps-1')).rejects.toThrow('Failed to complete session')
    })
  })

  describe('deletePlanningSession', () => {
    it('sends DELETE for session ID', async () => {
      mockAuthFetch.mockResolvedValueOnce({ ok: true } as Response)

      await deletePlanningSession('ps-1')
      expect(mockAuthFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/planning/sessions/ps-1'),
        expect.objectContaining({ method: 'DELETE' })
      )
    })

    it('throws on failure', async () => {
      mockAuthFetch.mockResolvedValueOnce({ ok: false } as Response)
      await expect(deletePlanningSession('ps-1')).rejects.toThrow('Failed to delete session')
    })
  })

  describe('getPlanningStats', () => {
    it('returns stats on success', async () => {
      const stats: PlanningStats = {
        totalSessions: 5,
        activeSessions: 2,
        completedSessions: 3,
        totalMessages: 50,
        totalTokensUsed: 5000,
        estimatedSavings: 100,
        byMode: [{ mode: 'brainstorm', count: 3, totalMessages: 30, tokensUsed: 3000 }],
      }
      mockAuthFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(stats),
      } as Response)

      const result = await getPlanningStats()
      expect(result.totalSessions).toBe(5)
    })

    it('throws on failure', async () => {
      mockAuthFetch.mockResolvedValueOnce({ ok: false } as Response)
      await expect(getPlanningStats()).rejects.toThrow('Failed to load stats')
    })
  })

  describe('getPlanningModes', () => {
    it('returns modes on success', async () => {
      const modes: PlanningMode[] = [
        { id: 'brainstorm', name: 'Brainstorm', description: 'Free-form brainstorming' },
        { id: 'structured', name: 'Structured', description: 'Step-by-step planning' },
      ]
      mockAuthFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(modes),
      } as Response)

      const result = await getPlanningModes()
      expect(result).toHaveLength(2)
      expect(result[0].id).toBe('brainstorm')
    })

    it('throws on failure', async () => {
      mockAuthFetch.mockResolvedValueOnce({ ok: false } as Response)
      await expect(getPlanningModes()).rejects.toThrow('Failed to load modes')
    })
  })
})
