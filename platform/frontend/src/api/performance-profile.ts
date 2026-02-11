import i18n from '../i18n'
import { getAuthHeaders } from './auth'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'
const t = (key: string) => i18n.t(key)

export interface OptimizationSuggestion {
  id: string
  category: string
  title: string
  description: string
  impact: number
  effort: string
  applied: boolean
}

export interface PerformanceProfile {
  id: string
  projectId: string
  bundleScore: number
  renderingScore: number
  dataLoadingScore: number
  accessibilityScore: number
  seoScore: number
  overallScore: number
  estimatedBundleSizeKb: number
  suggestionCount: number
  optimizationsApplied: number
  suggestionsJson: string
  metricsJson: string
  status: string
  createdAt: string
  optimizedAt: string | null
}

function authHeaders() {
  return getAuthHeaders()
}

export async function runProfile(projectId: string): Promise<PerformanceProfile> {
  const response = await fetch(`${API_BASE_URL}/api/projects/${projectId}/performance/profile`, {
    method: 'POST',
    headers: authHeaders(),
  })
  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error || t('performanceProfile.error.profileFailed'))
  }
  return response.json()
}

export async function getResults(projectId: string): Promise<PerformanceProfile> {
  const response = await fetch(`${API_BASE_URL}/api/projects/${projectId}/performance/results`, {
    headers: authHeaders(),
  })
  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error || t('performanceProfile.error.loadFailed'))
  }
  return response.json()
}

export async function getHistory(projectId: string): Promise<PerformanceProfile[]> {
  const response = await fetch(`${API_BASE_URL}/api/projects/${projectId}/performance/history`, {
    headers: authHeaders(),
  })
  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error || t('performanceProfile.error.loadFailed'))
  }
  return response.json()
}

export async function applyOptimizations(projectId: string, profileId: string, suggestionIds: string[]): Promise<PerformanceProfile> {
  const response = await fetch(`${API_BASE_URL}/api/projects/${projectId}/performance/optimize`, {
    method: 'POST',
    headers: { ...authHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ profileId, suggestionIds }),
  })
  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error || t('performanceProfile.error.optimizeFailed'))
  }
  return response.json()
}
