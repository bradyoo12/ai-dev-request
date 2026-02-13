import { authFetch } from './auth'

const API = import.meta.env.VITE_API_URL || ''

export interface InferenceCostRecord {
  id: string
  projectName: string
  requestType: string
  modelUsed: string
  modelRouted: string
  costUsd: number
  originalCostUsd: number
  savingsUsd: number
  savingsPercent: number
  cacheHit: boolean
  batched: boolean
  responseReused: boolean
  similarityScore: number
  inputTokens: number
  outputTokens: number
  latencyMs: number
  optimizationStrategy: string
  status: string
  createdAt: string
}

export interface AnalyzeResponse {
  record: InferenceCostRecord
  routing: { original: string; routed: string; reason: string }
  optimizations: { cacheHit: boolean; batched: boolean; responseReused: boolean; similarity: number; strategy: string }
  costBreakdown: { originalCost: string; routedCost: string; finalCost: string; savings: string; savingsPercent: string }
}

export interface CostStrategy {
  id: string
  name: string
  description: string
  savingsRange: string
  color: string
}

export interface CostStats {
  totalRequests: number
  totalCostUsd: number
  totalOriginalCostUsd: number
  totalSavingsUsd: number
  avgSavingsPercent: number
  cacheHitRate: number
  byStrategy: { strategy: string; count: number; avgSavingsPercent: number; totalSavingsUsd: number }[]
}

export async function listRecords(): Promise<InferenceCostRecord[]> {
  const res = await authFetch(`${API}/api/inference-cost`)
  if (!res.ok) throw new Error('Failed to list records')
  return res.json()
}

export async function analyzeRequest(projectName: string, requestType: string): Promise<AnalyzeResponse> {
  const res = await authFetch(`${API}/api/inference-cost/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ projectName, requestType }),
  })
  if (!res.ok) throw new Error('Failed to analyze')
  return res.json()
}

export async function deleteRecord(id: string): Promise<void> {
  const res = await authFetch(`${API}/api/inference-cost/${id}`, { method: 'DELETE' })
  if (!res.ok) throw new Error('Failed to delete')
}

export async function getCostStats(): Promise<CostStats> {
  const res = await authFetch(`${API}/api/inference-cost/stats`)
  if (!res.ok) throw new Error('Failed to get stats')
  return res.json()
}

export async function getStrategies(): Promise<CostStrategy[]> {
  const res = await fetch(`${API}/api/inference-cost/strategies`)
  if (!res.ok) throw new Error('Failed to get strategies')
  return res.json()
}
