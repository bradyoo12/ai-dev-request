import i18n from '../i18n'
import { getAuthHeaders } from './auth'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

const t = (key: string) => i18n.t(key)

function authHeaders(): Record<string, string> {
  return getAuthHeaders()
}

// === Interfaces ===

export interface AnalyticsEvent {
  id?: string
  userId?: number | null
  eventType: string
  eventData?: string | null
  sessionId?: string | null
  page?: string | null
  referrer?: string | null
  userAgent?: string | null
  createdAt?: string
}

export interface DashboardMetrics {
  activeUsers: number
  totalRequests: number
  completionRate: number
  avgBuildTimeMinutes: number
  totalEvents: number
  period: string
}

export interface FunnelStage {
  name: string
  count: number
  conversionRate: number
  dropOffRate: number
}

export interface FunnelData {
  stages: FunnelStage[]
  period: string
}

export interface UsageBreakdown {
  eventType: string
  count: number
  uniqueUsers: number
}

export interface TrendPoint {
  date: string
  value: number
}

// === API Functions ===

export async function recordAnalyticsEvent(event: Omit<AnalyticsEvent, 'id' | 'createdAt'>): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/analytics/events`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(event),
  })
  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error || t('api.error.analyticsRecordFailed'))
  }
}

export async function getDashboardMetrics(period: string = 'weekly'): Promise<DashboardMetrics> {
  const response = await fetch(`${API_BASE_URL}/api/analytics/dashboard?period=${period}`, {
    headers: authHeaders(),
  })
  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error || t('api.error.analyticsDashboardFailed'))
  }
  return response.json()
}

export async function getFunnelData(period: string = 'weekly'): Promise<FunnelData> {
  const response = await fetch(`${API_BASE_URL}/api/analytics/funnel?period=${period}`, {
    headers: authHeaders(),
  })
  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error || t('api.error.analyticsFunnelFailed'))
  }
  return response.json()
}

export async function getUsageBreakdown(period: string = 'weekly'): Promise<UsageBreakdown[]> {
  const response = await fetch(`${API_BASE_URL}/api/analytics/usage?period=${period}`, {
    headers: authHeaders(),
  })
  if (!response.ok) return []
  return response.json()
}

export async function getTrends(period: string = 'weekly', metric: string = 'total_events'): Promise<TrendPoint[]> {
  const response = await fetch(`${API_BASE_URL}/api/analytics/trends?period=${period}&metric=${metric}`, {
    headers: authHeaders(),
  })
  if (!response.ok) return []
  return response.json()
}
