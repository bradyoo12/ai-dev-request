import { authFetch } from './auth'

const API = import.meta.env.VITE_API_URL || ''

export interface ModelRoutingRule {
  id: string
  userId: string
  taskType: string
  primaryModel: string
  fallbackModel: string
  routingStrategy: string
  costThreshold: number
  latencyThresholdMs: number
  totalRequests: number
  primaryHits: number
  fallbackHits: number
  avgPrimaryLatencyMs: number
  avgFallbackLatencyMs: number
  avgPrimaryCost: number
  avgFallbackCost: number
  accuracyScore: number
  enabled: boolean
  status: string
  createdAt: string
  updatedAt: string
}

export interface ModelComparison {
  model: string
  latencyMs: number
  cost: number
  accuracy: number
  selected: boolean
}

export interface SimulateResponse {
  selectedModel: string
  strategy: string
  taskType: string
  comparison: ModelComparison[]
  reasoning: string
}

export interface AIModel {
  id: string
  name: string
  description: string
  color: string
  speed: string
  accuracy: string
  costPer1k: string
}

export interface RoutingStats {
  totalRules: number
  totalRequests: number
  avgAccuracy: number
  avgLatency: number
  avgCost: number
  byStrategy: { strategy: string; count: number; requests: number }[]
  byTaskType: { taskType: string; count: number; requests: number }[]
}

export async function listRules(): Promise<ModelRoutingRule[]> {
  const res = await authFetch(`${API}/api/multi-model-routing`)
  if (!res.ok) return []
  return res.json()
}

export async function createRule(taskType?: string, primaryModel?: string, fallbackModel?: string, routingStrategy?: string, costThreshold?: number, latencyThresholdMs?: number): Promise<ModelRoutingRule> {
  const res = await authFetch(`${API}/api/multi-model-routing`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ taskType, primaryModel, fallbackModel, routingStrategy, costThreshold, latencyThresholdMs }),
  })
  return res.json()
}

export async function simulateRouting(taskType: string, prompt: string): Promise<SimulateResponse> {
  const res = await authFetch(`${API}/api/multi-model-routing/simulate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ taskType, prompt }),
  })
  return res.json()
}

export async function deleteRule(id: string): Promise<void> {
  await authFetch(`${API}/api/multi-model-routing/${id}`, { method: 'DELETE' })
}

export async function getRoutingStats(): Promise<RoutingStats> {
  const res = await authFetch(`${API}/api/multi-model-routing/stats`)
  if (!res.ok) return { totalRules: 0, totalRequests: 0, avgAccuracy: 0, avgLatency: 0, avgCost: 0, byStrategy: [], byTaskType: [] }
  return res.json()
}

export async function getModels(): Promise<AIModel[]> {
  const res = await fetch(`${API}/api/multi-model-routing/models`)
  if (!res.ok) return []
  return res.json()
}
