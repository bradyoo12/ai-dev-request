import { authFetch } from './auth'

const API = import.meta.env.VITE_API_URL || ''

export interface AiModelIntegration {
  id: number
  projectName: string
  providerId: string
  modelId: string
  capability: string
  integrationStatus: string
  credentialSecured: boolean
  estimatedCostPerRequest: number
  createdAt: string
}

export interface ModelInfo {
  id: string
  name: string
  capability: string
  costPer1kTokens: number
  quality: string
  speed: string
}

export interface ProviderInfo {
  id: string
  name: string
  description: string
  modelCount: number
  logo: string
  models: ModelInfo[]
}

export interface IntegrateResponse {
  id: number
  projectName: string
  providerId: string
  modelId: string
  capability: string
  integrationStatus: string
  credentialSecured: boolean
  estimatedCostPerRequest: number
  codeSnippet: string
  provider: { name: string; description: string; modelCount: number } | null
  securityNote: string
  recommendation: string
}

export interface IntegrationStats {
  total: number
  byProvider: { provider: string; count: number; avgCost: number }[]
}

export async function listIntegrations(): Promise<AiModelIntegration[]> {
  const res = await authFetch(`${API}/api/ai-model-integrations`)
  if (!res.ok) return []
  return res.json()
}

export async function integrateModel(projectName: string, providerId: string, modelId: string, capability: string = 'chat'): Promise<IntegrateResponse> {
  const res = await authFetch(`${API}/api/ai-model-integrations/integrate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ projectName, providerId, modelId, capability })
  })
  return res.json()
}

export async function deleteIntegration(id: number): Promise<void> {
  await authFetch(`${API}/api/ai-model-integrations/${id}`, { method: 'DELETE' })
}

export async function getIntegrationStats(): Promise<IntegrationStats> {
  const res = await authFetch(`${API}/api/ai-model-integrations/stats`)
  if (!res.ok) return { total: 0, byProvider: [] }
  return res.json()
}

export async function getProviders(): Promise<ProviderInfo[]> {
  const res = await fetch(`${API}/api/ai-model-integrations/providers`)
  if (!res.ok) return []
  return res.json()
}
