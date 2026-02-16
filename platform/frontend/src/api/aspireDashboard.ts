import i18n from '../i18n'
import { getAuthHeaders } from './auth'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

const t = (key: string) => i18n.t(key)

function authHeaders(): Record<string, string> {
  return getAuthHeaders()
}

export interface HealthCheckResult {
  status: string
  totalDuration: string
  entries: Record<string, HealthCheckEntry>
}

export interface HealthCheckEntry {
  status: string
  duration: string
  description?: string
  tags?: string[]
}

export interface ServiceStatus {
  name: string
  status: 'healthy' | 'degraded' | 'unhealthy' | 'unknown'
  responseTimeMs: number
  lastChecked: string
}

export interface AspireDashboardInfo {
  services: ServiceStatus[]
  health: HealthCheckResult | null
  environment: string
  aspireVersion: string
}

/** Fetch health check status from the API */
export async function getHealthStatus(): Promise<HealthCheckResult> {
  const response = await fetch(`${API_BASE_URL}/health`, {
    headers: authHeaders(),
  })
  if (!response.ok) {
    throw new Error(t('aspireDashboard.healthError'))
  }
  return response.json()
}

/** Fetch liveness probe status */
export async function getLivenessStatus(): Promise<HealthCheckResult> {
  const response = await fetch(`${API_BASE_URL}/alive`, {
    headers: authHeaders(),
  })
  if (!response.ok) {
    throw new Error(t('aspireDashboard.livenessError'))
  }
  return response.json()
}

/** Fetch combined dashboard info */
export async function getAspireDashboardInfo(): Promise<AspireDashboardInfo> {
  const [health] = await Promise.all([
    getHealthStatus().catch(() => null),
  ])

  const apiStatus: ServiceStatus = {
    name: 'API',
    status: health ? 'healthy' : 'unhealthy',
    responseTimeMs: 0,
    lastChecked: new Date().toISOString(),
  }

  const dbStatus: ServiceStatus = {
    name: 'PostgreSQL',
    status: health?.entries?.['database']?.status === 'Healthy' ? 'healthy' : 'unknown',
    responseTimeMs: 0,
    lastChecked: new Date().toISOString(),
  }

  return {
    services: [apiStatus, dbStatus],
    health,
    environment: 'Development',
    aspireVersion: '9.0.0',
  }
}
