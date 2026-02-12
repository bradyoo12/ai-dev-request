import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('./auth', () => ({
  authFetch: vi.fn(),
}))

import {
  listComparisons,
  createComparison,
  selectWinner,
  getArenaStats,
  getArenaModels,
  getLeaderboard,
} from './arena'
import type { ArenaComparison, ArenaStats, ArenaModel, LeaderboardEntry } from './arena'
import { authFetch } from './auth'

const mockAuthFetch = vi.mocked(authFetch)

beforeEach(() => {
  vi.clearAllMocks()
})

describe('arena api', () => {
  const mockComparison: ArenaComparison = {
    id: 'c1',
    userId: 'u1',
    promptText: 'Build a todo app',
    taskCategory: 'web',
    modelOutputsJson: '{}',
    selectedModel: null,
    selectionReason: null,
    modelCount: 3,
    totalCost: 0.05,
    totalTokens: 1000,
    totalLatencyMs: 2000,
    status: 'completed',
    createdAt: '2024-01-01',
    completedAt: '2024-01-01',
  }

  describe('listComparisons', () => {
    it('fetches comparisons from correct endpoint', async () => {
      mockAuthFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([mockComparison]),
      } as Response)

      const result = await listComparisons()
      expect(result).toEqual([mockComparison])
      expect(mockAuthFetch).toHaveBeenCalledWith('/api/arena/comparisons')
    })

    it('throws on failure', async () => {
      mockAuthFetch.mockResolvedValueOnce({
        ok: false,
      } as Response)

      await expect(listComparisons()).rejects.toThrow('Failed to list comparisons')
    })
  })

  describe('createComparison', () => {
    it('sends POST with prompt data', async () => {
      mockAuthFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockComparison),
      } as Response)

      const result = await createComparison({ prompt: 'Build a todo app', taskCategory: 'web' })
      expect(result).toEqual(mockComparison)
      expect(mockAuthFetch).toHaveBeenCalledWith(
        '/api/arena/compare',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ prompt: 'Build a todo app', taskCategory: 'web' }),
        })
      )
    })

    it('sends POST without optional taskCategory', async () => {
      mockAuthFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockComparison),
      } as Response)

      await createComparison({ prompt: 'test' })
      expect(mockAuthFetch).toHaveBeenCalledWith(
        '/api/arena/compare',
        expect.objectContaining({
          body: JSON.stringify({ prompt: 'test' }),
        })
      )
    })

    it('throws on failure', async () => {
      mockAuthFetch.mockResolvedValueOnce({
        ok: false,
      } as Response)

      await expect(createComparison({ prompt: 'test' })).rejects.toThrow('Failed to create comparison')
    })
  })

  describe('selectWinner', () => {
    it('sends POST to select winner endpoint', async () => {
      const selected = { ...mockComparison, selectedModel: 'gpt-4', selectionReason: 'Better code' }
      mockAuthFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(selected),
      } as Response)

      const result = await selectWinner('c1', { model: 'gpt-4', reason: 'Better code' })
      expect(result.selectedModel).toBe('gpt-4')
      expect(mockAuthFetch).toHaveBeenCalledWith(
        '/api/arena/comparisons/c1/select-winner',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ model: 'gpt-4', reason: 'Better code' }),
        })
      )
    })

    it('throws on failure', async () => {
      mockAuthFetch.mockResolvedValueOnce({
        ok: false,
      } as Response)

      await expect(selectWinner('c1', { model: 'gpt-4' })).rejects.toThrow('Failed to select winner')
    })
  })

  describe('getArenaStats', () => {
    it('returns stats on success', async () => {
      const mockStats: ArenaStats = {
        totalComparisons: 10,
        winnersSelected: 8,
        avgCost: 0.03,
        totalTokens: 5000,
        avgLatency: 1500,
        fastestModel: 'haiku',
        mostSelected: 'gpt-4',
        winRates: [{ model: 'gpt-4', wins: 5, winRate: 62.5 }],
        recentComparisons: [],
      }
      mockAuthFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockStats),
      } as Response)

      const result = await getArenaStats()
      expect(result.totalComparisons).toBe(10)
    })

    it('throws on failure', async () => {
      mockAuthFetch.mockResolvedValueOnce({ ok: false } as Response)
      await expect(getArenaStats()).rejects.toThrow('Failed to get stats')
    })
  })

  describe('getArenaModels', () => {
    it('returns models on success', async () => {
      const models: ArenaModel[] = [
        { name: 'gpt-4', provider: 'openai', costPer1K: 0.03, avgLatencyMs: 2000, description: 'GPT-4', strengths: 'reasoning' },
      ]
      mockAuthFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(models),
      } as Response)

      const result = await getArenaModels()
      expect(result).toHaveLength(1)
      expect(result[0].name).toBe('gpt-4')
    })

    it('throws on failure', async () => {
      mockAuthFetch.mockResolvedValueOnce({ ok: false } as Response)
      await expect(getArenaModels()).rejects.toThrow('Failed to get models')
    })
  })

  describe('getLeaderboard', () => {
    it('returns leaderboard on success', async () => {
      const leaderboard: LeaderboardEntry[] = [
        { category: 'web', totalComparisons: 5, models: [{ model: 'gpt-4', wins: 3, winRate: 60 }] },
      ]
      mockAuthFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(leaderboard),
      } as Response)

      const result = await getLeaderboard()
      expect(result[0].category).toBe('web')
    })

    it('throws on failure', async () => {
      mockAuthFetch.mockResolvedValueOnce({ ok: false } as Response)
      await expect(getLeaderboard()).rejects.toThrow('Failed to get leaderboard')
    })
  })
})
