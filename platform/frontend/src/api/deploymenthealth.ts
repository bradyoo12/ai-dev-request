import i18n from '../i18n'
import { authFetch } from './auth'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'
const t = (key: string) => i18n.t(key)

export interface DeploymentHealthConfig {
  id: string
  projectId: string
  deploymentUrl: string
  status: string
  monitoringEnabled: boolean
  checkIntervalSeconds: number
  errorRateThreshold: number
  latencyThresholdMs: number
  autoRollbackEnabled: boolean
  totalChecks: number
  successfulChecks: number
  failedChecks: number
  currentErrorRate: number
  avgResponseTimeMs: number
  p95ResponseTimeMs: number
  p99ResponseTimeMs: number
  uptimePercentage: number
  rollbackCount: number
  lastCheckAt: string | null
}

export interface HealthStats {
  status: string
  uptimePercentage: number
  totalChecks: number
  successfulChecks: number
  failedChecks: number
  currentErrorRate: number
  avgResponseTimeMs: number
  p95ResponseTimeMs: number
  p99ResponseTimeMs: number
  rollbackCount: number
  lastCheckAt: string | null
}

export interface HealthEvent {
  timestamp: string
  status: string
  responseTimeMs: number
  error: string | null
}

export interface IncidentRecord {
  startedAt: string
  resolvedAt: string | null
  type: string
  description: string
}

export async function getHealthConfig(projectId: string): Promise<DeploymentHealthConfig> {
  const response = await authFetch(`${API_BASE_URL}/api/deployment-health/config/${projectId}`)
  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error || t('api.error.healthConfigLoad'))
  }
  return response.json()
}

export async function updateHealthConfig(projectId: string, config: {
  deploymentUrl?: string
  monitoringEnabled: boolean
  checkIntervalSeconds: number
  errorRateThreshold: number
  latencyThresholdMs: number
  autoRollbackEnabled: boolean
}): Promise<DeploymentHealthConfig> {
  const response = await authFetch(`${API_BASE_URL}/api/deployment-health/config/${projectId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(config),
  })
  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error || t('api.error.healthConfigUpdate'))
  }
  return response.json()
}

export async function getHealthStats(projectId: string): Promise<HealthStats> {
  const response = await authFetch(`${API_BASE_URL}/api/deployment-health/stats/${projectId}`)
  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error || t('api.error.healthStatsLoad'))
  }
  return response.json()
}

export async function getHealthEvents(projectId: string): Promise<HealthEvent[]> {
  const response = await authFetch(`${API_BASE_URL}/api/deployment-health/events/${projectId}`)
  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error || t('api.error.healthEventsLoad'))
  }
  return response.json()
}

export async function getIncidents(projectId: string): Promise<IncidentRecord[]> {
  const response = await authFetch(`${API_BASE_URL}/api/deployment-health/incidents/${projectId}`)
  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error || t('api.error.healthIncidentsLoad'))
  }
  return response.json()
}
