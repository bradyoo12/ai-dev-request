import i18n from '../i18n'
import { authFetch } from './auth'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'
const t = (key: string) => i18n.t(key)

export interface ModelRoutingConfig {
  id: string
  enabled: boolean
  defaultTier: string
  taskRoutingJson?: string
  monthlyBudget: number
  currentMonthCost: number
  fastTierTokens: number
  standardTierTokens: number
  premiumTierTokens: number
  totalRoutingDecisions: number
  estimatedSavings: number
  createdAt: string
  updatedAt: string
}

export interface RoutingStats {
  fastTierTokens: number
  standardTierTokens: number
  premiumTierTokens: number
  totalRoutingDecisions: number
  currentMonthCost: number
  monthlyBudget: number
  estimatedSavings: number
}

export interface ModelTier {
  id: string
  name: string
  model: string
  description: string
  costPer1kTokens: number
  avgLatencyMs: number
  bestFor: string[]
}

export interface TaskType {
  id: string
  name: string
  defaultTier: string
}

export async function getModelRoutingConfig(): Promise<ModelRoutingConfig> {
  const response = await authFetch(`${API_BASE_URL}/api/model-routing/config`)
  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error || t('api.error.modelRoutingLoad'))
  }
  return response.json()
}

export async function updateModelRoutingConfig(data: Partial<ModelRoutingConfig>): Promise<ModelRoutingConfig> {
  const response = await authFetch(`${API_BASE_URL}/api/model-routing/config`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error || t('api.error.modelRoutingUpdate'))
  }
  return response.json()
}

export async function getRoutingStats(): Promise<RoutingStats> {
  const response = await authFetch(`${API_BASE_URL}/api/model-routing/stats`)
  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error || t('api.error.modelRoutingStatsLoad'))
  }
  return response.json()
}

export async function getModelTiers(): Promise<ModelTier[]> {
  const response = await authFetch(`${API_BASE_URL}/api/model-routing/tiers`)
  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error || t('api.error.modelRoutingTiersLoad'))
  }
  return response.json()
}

export async function getTaskTypes(): Promise<TaskType[]> {
  const response = await authFetch(`${API_BASE_URL}/api/model-routing/task-types`)
  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error || t('api.error.modelRoutingTaskTypesLoad'))
  }
  return response.json()
}
