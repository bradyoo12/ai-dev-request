import i18n from '../i18n'
import { getAuthHeaders } from './auth'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

const t = (key: string) => i18n.t(key)

function authHeaders(): Record<string, string> {
  return getAuthHeaders()
}

export interface ProjectSummary {
  id: string
  name: string
  status: 'Active' | 'Paused' | 'Archived'
  productionUrl?: string
  previewUrl?: string
  dailyCost: number
  planName: string
  deploymentStatus: string
  lastDeployedAt?: string
  createdAt: string
}

export interface ProjectCostBreakdown {
  projectId: string
  hostingCost: number
  aiUsageCost: number
  containerCost: number
  storageCost: number
  bandwidthCost: number
  totalDailyCost: number
  calculatedAt: string
}

export interface ProjectDetail {
  id: string
  name: string
  status: 'Active' | 'Paused' | 'Archived'
  productionUrl?: string
  previewUrl?: string
  devRequestId?: string
  createdAt: string
  updatedAt: string
  lastDeployedAt?: string
  deploymentStatus: string
  region?: string
  containerAppName?: string
  planName?: string
  planCost?: number
  planVcpu?: string
  planMemoryGb?: string
  planStorageGb?: number
  planBandwidthGb?: number
  containerVcpu?: string
  containerMemoryGb?: string
  costBreakdown?: ProjectCostBreakdown
}

export interface ProjectLogEntry {
  id: string
  projectId: string
  level: string
  source: string
  message: string
  timestamp: string
}

export interface LogQueryParams {
  level?: string
  source?: string
  search?: string
  from?: string
  to?: string
  limit?: number
}

export async function getProjects(): Promise<ProjectSummary[]> {
  const response = await fetch(`${API_BASE_URL}/api/projects`, {
    headers: authHeaders(),
  })

  if (!response.ok) {
    throw new Error(t('api.error.projectListFailed'))
  }

  return response.json()
}

export async function getProject(id: string): Promise<ProjectDetail> {
  const response = await fetch(`${API_BASE_URL}/api/projects/${id}`, {
    headers: authHeaders(),
  })

  if (!response.ok) {
    throw new Error(t('api.error.projectLoadFailed'))
  }

  return response.json()
}

export async function getProjectCostEstimate(id: string): Promise<{ projectId: string; dailyCost: number; monthlyCost: number; calculatedAt: string }> {
  const response = await fetch(`${API_BASE_URL}/api/projects/${id}/cost-estimate`, {
    headers: authHeaders(),
  })

  if (!response.ok) {
    throw new Error(t('api.error.projectCostFailed'))
  }

  return response.json()
}

export async function getProjectCostBreakdown(id: string): Promise<ProjectCostBreakdown> {
  const response = await fetch(`${API_BASE_URL}/api/projects/${id}/cost-breakdown`, {
    headers: authHeaders(),
  })

  if (!response.ok) {
    throw new Error(t('api.error.projectCostFailed'))
  }

  return response.json()
}

export async function getProjectLogs(id: string, params?: LogQueryParams): Promise<ProjectLogEntry[]> {
  const queryParams = new URLSearchParams()

  if (params) {
    if (params.level) queryParams.append('level', params.level)
    if (params.source) queryParams.append('source', params.source)
    if (params.search) queryParams.append('search', params.search)
    if (params.from) queryParams.append('from', params.from)
    if (params.to) queryParams.append('to', params.to)
    if (params.limit) queryParams.append('limit', params.limit.toString())
  }

  const url = `${API_BASE_URL}/api/projects/${id}/logs${queryParams.toString() ? `?${queryParams.toString()}` : ''}`

  const response = await fetch(url, {
    headers: authHeaders(),
  })

  if (!response.ok) {
    throw new Error(t('api.error.projectLogsFailed'))
  }

  return response.json()
}

export function createProjectLogStream(id: string): EventSource {
  const token = localStorage.getItem('token')
  const url = `${API_BASE_URL}/api/projects/${id}/logs/stream${token ? `?token=${token}` : ''}`
  return new EventSource(url)
}
