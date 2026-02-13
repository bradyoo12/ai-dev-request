import { authFetch } from './auth'

const API = import.meta.env.VITE_API_URL || ''

export interface PlaywrightHealingResult {
  id: string
  testFile: string
  testName: string
  originalSelector: string
  healedSelector: string
  healingStrategy: string
  confidence: number
  status: string
  failureReason: string
  healingAttempts: number
  healingTimeMs: number
  devRequestId: number | null
  createdAt: string
  updatedAt: string
}

export interface HealingStrategy {
  id: string
  name: string
  description: string
  color: string
}

export interface HealingStats {
  totalHealings: number
  successfulHealings: number
  failedHealings: number
  pendingReview: number
  healRate: number
  avgConfidence: number
  avgHealingTimeMs: number
  byStrategy: { strategy: string; count: number; avgConfidence: number }[]
  recentHealings: { id: string; testName: string; status: string; confidence: number; healingStrategy: string; updatedAt: string }[]
}

export async function listHealingResults(status?: string): Promise<PlaywrightHealingResult[]> {
  const url = status
    ? `${API}/api/playwright-healing/results?status=${encodeURIComponent(status)}`
    : `${API}/api/playwright-healing/results`
  const res = await authFetch(url)
  if (!res.ok) throw new Error('Failed to load healing results')
  return res.json()
}

export async function healTest(data: {
  testFile?: string
  testName?: string
  originalSelector?: string
  devRequestId?: number
}): Promise<PlaywrightHealingResult> {
  const res = await authFetch(`${API}/api/playwright-healing/heal`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error('Failed to heal test')
  return res.json()
}

export async function approveHealing(id: string): Promise<PlaywrightHealingResult> {
  const res = await authFetch(`${API}/api/playwright-healing/results/${id}/approve`, { method: 'POST' })
  if (!res.ok) throw new Error('Failed to approve healing')
  return res.json()
}

export async function rejectHealing(id: string): Promise<PlaywrightHealingResult> {
  const res = await authFetch(`${API}/api/playwright-healing/results/${id}/reject`, { method: 'POST' })
  if (!res.ok) throw new Error('Failed to reject healing')
  return res.json()
}

export async function getHealingStats(): Promise<HealingStats> {
  const res = await authFetch(`${API}/api/playwright-healing/stats`)
  if (!res.ok) throw new Error('Failed to load healing stats')
  return res.json()
}

export async function getHealingStrategies(): Promise<HealingStrategy[]> {
  const res = await fetch(`${API}/api/playwright-healing/strategies`)
  if (!res.ok) throw new Error('Failed to load strategies')
  return res.json()
}
