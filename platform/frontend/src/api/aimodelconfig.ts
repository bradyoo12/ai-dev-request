import i18n from '../i18n'
import { authFetch } from './auth'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'
const t = (key: string) => i18n.t(key)

export interface AiModelConfig {
  id: string
  selectedModel: string
  thinkingMode: string
  thinkingBudgetTokens: number
  streamingEnabled: boolean
  showThinkingProcess: boolean
  defaultTemperature: number
  maxOutputTokens: number
  totalRequests: number
  totalTokensUsed: number
  totalThinkingTokensUsed: number
  totalCost: number
  avgResponseTimeMs: number
  modelUsageHistoryJson: string
  createdAt: string
  updatedAt: string
}

export interface AvailableModel {
  id: string
  name: string
  provider: string
  description: string
  costPerInputToken: number
  costPerOutputToken: number
  costPerThinkingToken: number
  avgLatencyMs: number
  contextWindow: number
  maxOutputTokens: number
  supportsThinking: boolean
  bestFor: string[]
  tier: string
}

export interface TestModelRequest {
  modelId?: string
  thinkingMode?: string
  prompt?: string
}

export interface TestModelResponse {
  modelId: string
  thinkingMode: string
  prompt: string
  response: string
  thinkingSteps: string[]
  inputTokens: number
  outputTokens: number
  thinkingTokens: number
  latencyMs: number
  estimatedCost: number
}

export interface AiModelUsage {
  totalRequests: number
  totalTokensUsed: number
  totalThinkingTokensUsed: number
  totalCost: number
  avgResponseTimeMs: number
  modelUsageHistoryJson: string
}

export interface ThinkingMode {
  id: string
  name: string
  description: string
  defaultBudgetTokens: number
  minBudgetTokens: number
  maxBudgetTokens: number
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

export async function testModel(data: TestModelRequest): Promise<TestModelResponse> {
  const response = await authFetch(`${API_BASE_URL}/api/ai-model/test`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error || t('api.error.aiModelTestFailed'))
  }
  return response.json()
}

export async function getAiModelUsage(): Promise<AiModelUsage> {
  const response = await authFetch(`${API_BASE_URL}/api/ai-model/usage`)
  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error || t('api.error.aiModelUsageLoad'))
  }
  return response.json()
}

export async function getThinkingModes(): Promise<ThinkingMode[]> {
  const response = await authFetch(`${API_BASE_URL}/api/ai-model/thinking-modes`)
  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error || t('api.error.aiModelThinkingModesLoad'))
  }
  return response.json()
}
