import i18n from '../i18n'
import { authFetch } from './auth'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'
const t = (key: string) => i18n.t(key)

export interface AiModelConfig {
  id: string
  selectedModel: string
  extendedThinkingEnabled: boolean
  thinkingBudgetTokens: number
  streamThinkingEnabled: boolean
  autoModelSelection: boolean
  totalRequestsOpus: number
  totalRequestsSonnet: number
  totalThinkingTokens: number
  totalOutputTokens: number
  estimatedCost: number
  modelHistoryJson?: string
  // Gemini-specific settings
  geminiSafetyLevel?: string // "BLOCK_NONE" | "BLOCK_LOW_AND_ABOVE" | "BLOCK_MEDIUM_AND_ABOVE" | "BLOCK_HIGH"
  geminiTemperature?: number // 0.0 - 2.0
  createdAt: string
  updatedAt: string
}

export interface AvailableModel {
  id: string
  name: string
  modelId: string
  description: string
  inputCostPer1k: number
  outputCostPer1k: number
  supportsExtendedThinking: boolean
  maxOutputTokens: number
  avgLatencyMs: number
  tier: string
  badge: string
  capabilities: string[]
}

export interface CostEstimate {
  estimatedInputTokens: number
  estimatedOutputTokens: number
  opusCost: number
  sonnetCost: number
  opusThinkingCost: number
  savings: number
}

export interface AiModelStats {
  totalRequests: number
  totalRequestsOpus: number
  totalRequestsSonnet: number
  totalThinkingTokens: number
  totalOutputTokens: number
  estimatedCost: number
  perProviderStats?: ProviderStats[]
}

export interface Provider {
  id: string // "claude" | "gemini"
  name: string
  description: string
  available: boolean
}

export interface Model {
  id: string // "sonnet-4-5" | "pro-1.5"
  name: string
  provider: string
  tier: string // "fast" | "balanced" | "advanced"
  costPerToken: number
  description?: string
  capabilities?: string[]
}

export interface ProviderStats {
  provider: string
  totalRequests: number
  totalTokens: number
  estimatedCost: number
}

export async function getAiModelConfig(): Promise<AiModelConfig> {
  const response = await authFetch(`${API_BASE_URL}/api/ai-model/config`)
  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error || t('api.error.aiModelConfigLoad'))
  }
  return response.json()
}

export async function updateAiModelConfig(data: Partial<AiModelConfig>): Promise<AiModelConfig> {
  const response = await authFetch(`${API_BASE_URL}/api/ai-model/config`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error || t('api.error.aiModelConfigUpdate'))
  }
  return response.json()
}

export async function getAvailableModels(): Promise<AvailableModel[]> {
  const response = await authFetch(`${API_BASE_URL}/api/ai-model/models`)
  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error || t('api.error.aiModelModelsLoad'))
  }
  return response.json()
}

export async function estimateCost(data: {
  inputText?: string
  expectedOutputTokens?: number
  includeThinking?: boolean
  thinkingBudget?: number
}): Promise<CostEstimate> {
  const response = await authFetch(`${API_BASE_URL}/api/ai-model/estimate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error || t('api.error.aiModelEstimate'))
  }
  return response.json()
}

export async function getAiModelStats(): Promise<AiModelStats> {
  const response = await authFetch(`${API_BASE_URL}/api/ai-model/stats`)
  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error || t('api.error.aiModelStatsLoad'))
  }
  return response.json()
}

export async function getAvailableProviders(): Promise<Provider[]> {
  const response = await authFetch(`${API_BASE_URL}/api/ai-model/providers`)
  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error || t('api.error.aiModelProvidersLoad'))
  }
  return response.json()
}

export async function getModelsForProvider(provider: string): Promise<Model[]> {
  const response = await authFetch(`${API_BASE_URL}/api/ai-model/models?provider=${provider}`)
  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error || t('api.error.aiModelModelsLoad'))
  }
  return response.json()
}
