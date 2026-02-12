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
  spanId?: string
  parentSpanId?: string
  operationName?: string
  devRequestId?: string
  totalTokens: number
  inputTokens: number
  outputTokens: number
  totalCost: number
  estimatedCost: number
  latencyMs: number
  durationMs: number
  model?: string
  modelTier?: string
  status: string
  errorMessage?: string
  attributesJson?: string
  startedAt: string
  createdAt: string
  completedAt?: string
}

export interface SpanRecord {
  id: number
  spanName: string
  parentSpanId?: string
  model?: string
  inputTokens: number
  outputTokens: number
  totalTokens: number
  cost: number
  latencyMs: number
  status: string
  errorMessage?: string
  attributesJson?: string
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

export interface ObservabilityStatsResult {
  totalTraces: number
  totalTokens: number
  totalCost: number
  avgDurationMs: number
  errorRate: number
  tracesByOperation: Record<string, number>
}

export interface RecordTracePayload {
  operationName: string
  parentSpanId?: string
  inputTokens: number
  outputTokens: number
  durationMs: number
  model?: string
  modelTier?: string
  error?: string
  attributesJson?: string
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
  model?: string,
  operation?: string
): Promise<TraceListResult> {
  const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) })
  if (status) params.set('status', status)
  if (model) params.set('model', model)
  if (operation) params.set('operation', operation)

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

export async function recordTrace(payload: RecordTracePayload): Promise<TraceRecord> {
  const response = await fetch(
    `${API_BASE_URL}/api/observability/traces`,
    {
      method: 'POST',
      headers: { ...authHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }
  )
  if (!response.ok) {
    throw new Error(t('api.error.recordTraceFailed'))
  }
  return response.json()
}

export async function getObservabilityStats(): Promise<ObservabilityStatsResult> {
  const response = await fetch(
    `${API_BASE_URL}/api/observability/stats`,
    { headers: authHeaders() }
  )
  if (!response.ok) {
    throw new Error(t('api.error.observabilityStatsFailed'))
  }
  return response.json()
}

export async function getOperations(): Promise<string[]> {
  const response = await fetch(
    `${API_BASE_URL}/api/observability/operations`,
    { headers: authHeaders() }
  )
  if (!response.ok) {
    throw new Error(t('api.error.operationsFailed'))
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
