import { authFetch } from './auth'

const API = import.meta.env.VITE_API_URL || ''

export interface WorkersAiDeployment {
  id: string
  projectName: string
  modelId: string
  modelCategory: string
  edgeRegion: string
  edgeLocations: number
  inferenceLatencyMs: number
  totalInferences: number
  tokensProcessed: number
  costUsd: number
  customModel: boolean
  customModelSource: string
  zeroColdStart: boolean
  successRate: number
  status: string
  createdAt: string
}

export interface DeployResponse {
  deployment: WorkersAiDeployment
  endpoint: string
  capabilities: {
    zeroColdStart: boolean
    serverlessGpu: boolean
    globalEdge: boolean
    customModels: boolean
    payPerInference: boolean
  }
  pricing: {
    inputTokens: string
    outputTokens: string
    imageInference: string
    embeddingTokens: string
  }
  deployTimeMs: number
}

export interface AiModel {
  id: string
  name: string
  category: string
  provider: string
  popular: boolean
}

export interface WorkersAiStats {
  totalDeployments: number
  totalInferences?: number
  avgLatencyMs?: number
  avgSuccessRate?: number
  totalCostUsd?: number
  customModels?: number
  byCategory?: { category: string; count: number; avgLatencyMs: number }[]
}

export async function listDeployments(): Promise<WorkersAiDeployment[]> {
  const res = await authFetch(`${API}/api/workers-ai`)
  if (!res.ok) return []
  return res.json()
}

export async function deploy(
  projectName: string,
  modelId: string,
  modelCategory: string,
  edgeRegion: string,
  customModel: boolean,
  customModelSource: string | null
): Promise<DeployResponse> {
  const res = await authFetch(`${API}/api/workers-ai/deploy`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ projectName, modelId, modelCategory, edgeRegion, customModel, customModelSource })
  })
  return res.json()
}

export async function deleteDeployment(id: string): Promise<void> {
  await authFetch(`${API}/api/workers-ai/${id}`, { method: 'DELETE' })
}

export async function getWorkersAiStats(): Promise<WorkersAiStats> {
  const res = await authFetch(`${API}/api/workers-ai/stats`)
  if (!res.ok) return { totalDeployments: 0 }
  return res.json()
}

export async function getAiModels(): Promise<AiModel[]> {
  const res = await fetch(`${API}/api/workers-ai/models`)
  if (!res.ok) return []
  return res.json()
}
