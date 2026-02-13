import { authFetch } from './auth'

const API = import.meta.env.VITE_API_URL || ''

export interface ConfidenceScore {
  id: number
  requestTitle: string
  requestDescription: string
  confidenceLevel: string
  score: number
  complexityRating: string
  ambiguityLevel: string
  feasibilityRating: string
  estimatedEffort: string
  createdAt: string
}

export interface EvaluateResponse {
  id: number
  requestTitle: string
  confidenceLevel: string
  score: number
  complexityRating: string
  ambiguityLevel: string
  feasibilityRating: string
  estimatedEffort: string
  factors: { factor: string; score: number; detail: string }[]
  suggestions: string[]
  recommendation: string
}

export interface ConfidenceLevel {
  id: string
  name: string
  description: string
  scoreRange: string
  successRate: string
  color: string
  characteristics: string[]
}

export interface ConfidenceStats {
  total: number
  byLevel: { level: string; count: number; avgScore: number }[]
}

export async function listScores(): Promise<ConfidenceScore[]> {
  const res = await authFetch(`${API}/api/confidence-scores`)
  if (!res.ok) return []
  return res.json()
}

export async function evaluateRequest(title: string, description: string): Promise<EvaluateResponse> {
  const res = await authFetch(`${API}/api/confidence-scores/evaluate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, description })
  })
  return res.json()
}

export async function deleteScore(id: number): Promise<void> {
  await authFetch(`${API}/api/confidence-scores/${id}`, { method: 'DELETE' })
}

export async function getScoreStats(): Promise<ConfidenceStats> {
  const res = await authFetch(`${API}/api/confidence-scores/stats`)
  if (!res.ok) return { total: 0, byLevel: [] }
  return res.json()
}

export async function getConfidenceLevels(): Promise<ConfidenceLevel[]> {
  const res = await fetch(`${API}/api/confidence-scores/levels`)
  if (!res.ok) return []
  return res.json()
}
