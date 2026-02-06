import i18n from '../i18n'
import { getAuthHeaders } from './auth'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

const t = (key: string) => i18n.t(key)

function authHeaders(): Record<string, string> {
  return getAuthHeaders()
}

export interface HostingPlan {
  id: number
  name: string
  displayName: string
  monthlyCostUsd: number
  vcpu: string
  memoryGb: string
  storageGb: number
  bandwidthGb: number
  supportsCustomDomain: boolean
  supportsAutoscale: boolean
  supportsSla: boolean
  maxInstances: number
  description?: string
  bestFor?: string
}

export async function getHostingPlans(): Promise<HostingPlan[]> {
  const response = await fetch(`${API_BASE_URL}/api/hosting/plans`, {
    headers: authHeaders(),
  })
  if (!response.ok) throw new Error(t('api.error.hostingPlansFailed'))
  return response.json()
}

export async function getRecommendedPlan(complexity: string): Promise<HostingPlan> {
  const response = await fetch(
    `${API_BASE_URL}/api/hosting/recommended/${encodeURIComponent(complexity)}`,
    { headers: authHeaders() }
  )
  if (!response.ok) throw new Error(t('api.error.hostingPlansFailed'))
  return response.json()
}
