import i18n from '../i18n'
import { getAuthHeaders } from './auth'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

const t = (key: string) => i18n.t(key)

function authHeaders(): Record<string, string> {
  return getAuthHeaders()
}

export interface TraceRecord {
  id: number
  traceId: string
  devRequestId?: string
  totalTokens: number
  totalCost: number
  latencyMs: number
  model?: string
  status: string
  createdAt: string
  completedAt?: string
}

export interface SpanRecord {
  id: number
  spanName: string
  model?: string
  inputTokens: number
  outputTokens: number
  totalTokens: number
  cost: number
  latencyMs: number
  status: string
  startedAt: string
  completedAt?: string
}

export interface TraceListResult {
  traces: TraceRecord[]
  totalCount: number
  page: number
  pageSize: number
}

export interface TraceDetailResult extends TraceRecord {
  spans: SpanRecord[]
}

export interface CostBucket {
  date: string
  cost: number
  traceCount: number
}

export interface ModelCostBreakdown {
  model: string
  cost: number
  traceCount: number
  totalTokens: number
}

export interface CostAnalyticsResult {
  totalCost: number
  totalTraces: number
  buckets: CostBucket[]
  costByModel: ModelCostBreakdown[]
}

export interface PerformanceMetricsResult {
  totalTraces: number
  successRate: number
  avgLatencyMs: number
  p50LatencyMs: number
  p95LatencyMs: number
  p99LatencyMs: number
  avgTokensPerTrace: number
  errorCount: number
}

export interface UsageBucket {
  date: string
  inputTokens: number
  outputTokens: number
  totalTokens: number
  spanCount: number
}

export interface ModelUsageBreakdown {
  model: string
  inputTokens: number
  outputTokens: number
  totalTokens: number
  spanCount: number
}

export interface UsageAnalyticsResult {
  totalInputTokens: number
  totalOutputTokens: number
  totalTokens: number
  buckets: UsageBucket[]
  usageByModel: ModelUsageBreakdown[]
}

export async function getTraces(
  page = 1,
  pageSize = 20,
  status?: string,
  model?: string
): Promise<TraceListResult> {
  const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) })
  if (status) params.set('status', status)
  if (model) params.set('model', model)

  const response = await fetch(
    `${API_BASE_URL}/api/observability/traces?${params}`,
    { headers: authHeaders() }
  )
  if (!response.ok) {
    throw new Error(t('api.error.tracesFailed'))
  }
  return response.json()
}

export async function getTrace(traceId: string): Promise<TraceDetailResult> {
  const response = await fetch(
    `${API_BASE_URL}/api/observability/traces/${encodeURIComponent(traceId)}`,
    { headers: authHeaders() }
  )
  if (!response.ok) {
    throw new Error(t('api.error.traceDetailFailed'))
  }
  return response.json()
}

export async function getCostAnalytics(
  startDate?: string,
  endDate?: string,
  granularity = 'daily'
): Promise<CostAnalyticsResult> {
  const params = new URLSearchParams({ granularity })
  if (startDate) params.set('startDate', startDate)
  if (endDate) params.set('endDate', endDate)

  const response = await fetch(
    `${API_BASE_URL}/api/observability/analytics/cost?${params}`,
    { headers: authHeaders() }
  )
  if (!response.ok) {
    throw new Error(t('api.error.costAnalyticsFailed'))
  }
  return response.json()
}

export async function getPerformanceMetrics(): Promise<PerformanceMetricsResult> {
  const response = await fetch(
    `${API_BASE_URL}/api/observability/analytics/performance`,
    { headers: authHeaders() }
  )
  if (!response.ok) {
    throw new Error(t('api.error.performanceMetricsFailed'))
  }
  return response.json()
}

export async function getUsageAnalytics(
  startDate?: string,
  endDate?: string,
  granularity = 'daily'
): Promise<UsageAnalyticsResult> {
  const params = new URLSearchParams({ granularity })
  if (startDate) params.set('startDate', startDate)
  if (endDate) params.set('endDate', endDate)

  const response = await fetch(
    `${API_BASE_URL}/api/observability/analytics/usage?${params}`,
    { headers: authHeaders() }
  )
  if (!response.ok) {
    throw new Error(t('api.error.usageAnalyticsFailed'))
  }
  return response.json()
}
