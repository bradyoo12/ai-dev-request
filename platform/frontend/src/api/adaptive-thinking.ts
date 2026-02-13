import i18n from '../i18n'
import { authFetch } from './auth'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'
const t = (key: string) => i18n.t(key)

export interface AdaptiveThinkingConfig {
  id: string
  enabled: boolean
  scaffoldEffort: string
  analyzeEffort: string
  reviewEffort: string
  generateEffort: string
  structuredOutputsEnabled: boolean
  totalLowEffortRequests: number
  totalMediumEffortRequests: number
  totalHighEffortRequests: number
  totalThinkingTokens: number
  estimatedSavings: number
  taskOverridesJson?: string
  createdAt: string
  updatedAt: string
}

export interface AdaptiveThinkingStats {
  totalLowEffortRequests: number
  totalMediumEffortRequests: number
  totalHighEffortRequests: number
  totalThinkingTokens: number
  estimatedSavings: number
  costSavingsPercent: number
}

export interface AdaptiveTaskType {
  id: string
  name: string
  description: string
  defaultEffort: string
  estimatedCostMultiplier: number
}

export interface EffortLevel {
  id: string
  name: string
  description: string
  costMultiplier: number
  avgLatencyMs: number
}

export async function getAdaptiveThinkingConfig(): Promise<AdaptiveThinkingConfig> {
  const response = await authFetch(`${API_BASE_URL}/api/adaptive-thinking/config`)
  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error || t('api.error.adaptiveThinkingLoad'))
  }
  return response.json()
}

export async function updateAdaptiveThinkingConfig(data: Partial<AdaptiveThinkingConfig>): Promise<AdaptiveThinkingConfig> {
  const response = await authFetch(`${API_BASE_URL}/api/adaptive-thinking/config`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error || t('api.error.adaptiveThinkingUpdate'))
  }
  return response.json()
}

export async function getAdaptiveThinkingStats(): Promise<AdaptiveThinkingStats> {
  const response = await authFetch(`${API_BASE_URL}/api/adaptive-thinking/stats`)
  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error || t('api.error.adaptiveThinkingStatsLoad'))
  }
  return response.json()
}

export async function getAdaptiveTaskTypes(): Promise<AdaptiveTaskType[]> {
  const response = await authFetch(`${API_BASE_URL}/api/adaptive-thinking/task-types`)
  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error || t('api.error.adaptiveThinkingTaskTypesLoad'))
  }
  return response.json()
}

export async function getEffortLevels(): Promise<EffortLevel[]> {
  const response = await authFetch(`${API_BASE_URL}/api/adaptive-thinking/effort-levels`)
  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error || t('api.error.adaptiveThinkingEffortLevelsLoad'))
  }
  return response.json()
}
