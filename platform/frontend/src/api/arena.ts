import { authFetch } from './auth'

export interface ArenaComparison {
  id: string
  userId: string
  promptText: string
  taskCategory: string
  modelOutputsJson: string
  selectedModel: string | null
  selectionReason: string | null
  modelCount: number
  totalCost: number
  totalTokens: number
  totalLatencyMs: number
  status: string
  createdAt: string
  completedAt: string | null
}

export interface ModelOutput {
  model: string
  provider: string
  output: string
  latencyMs: number
  tokenCount: number
  cost: number
}

export interface ArenaModel {
  name: string
  provider: string
  costPer1K: number
  avgLatencyMs: number
  description: string
  strengths: string
}

export interface ArenaStats {
  totalComparisons: number
  winnersSelected: number
  avgCost: number
  totalTokens: number
  avgLatency: number
  fastestModel: string
  mostSelected: string
  winRates: { model: string; wins: number; winRate: number }[]
  recentComparisons: { promptText: string; taskCategory: string; selectedModel: string | null; totalCost: number; createdAt: string }[]
}

export interface LeaderboardEntry {
  category: string
  totalComparisons: number
  models: { model: string; wins: number; winRate: number }[]
}

export async function listComparisons(): Promise<ArenaComparison[]> {
  const res = await authFetch('/api/arena/comparisons')
  if (!res.ok) throw new Error('Failed to list comparisons')
  return res.json()
}

export async function createComparison(data: { prompt: string; taskCategory?: string }): Promise<ArenaComparison> {
  const res = await authFetch('/api/arena/compare', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error('Failed to create comparison')
  return res.json()
}

export async function selectWinner(id: string, data: { model: string; reason?: string }): Promise<ArenaComparison> {
  const res = await authFetch(`/api/arena/comparisons/${id}/select-winner`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error('Failed to select winner')
  return res.json()
}

export async function getArenaStats(): Promise<ArenaStats> {
  const res = await authFetch('/api/arena/stats')
  if (!res.ok) throw new Error('Failed to get stats')
  return res.json()
}

export async function getArenaModels(): Promise<ArenaModel[]> {
  const res = await authFetch('/api/arena/models')
  if (!res.ok) throw new Error('Failed to get models')
  return res.json()
}

export async function getLeaderboard(): Promise<LeaderboardEntry[]> {
  const res = await authFetch('/api/arena/leaderboard')
  if (!res.ok) throw new Error('Failed to get leaderboard')
  return res.json()
}
