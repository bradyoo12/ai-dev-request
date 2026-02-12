import i18n from '../i18n'
import { getAuthHeaders } from './auth'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

const t = (key: string) => i18n.t(key)

function authHeaders(): Record<string, string> {
  return getAuthHeaders()
}

// === TypeScript Interfaces ===

export interface UsageMeter {
  id: string
  userId: string
  devRequestId?: string | null
  meterType: string // ai_compute, build_minutes, test_runs, preview_deploys
  units: number
  unitCost: number
  totalCost: number
  status: string // pending, billed, credited
  outcome: string // success, failed, partial
  metadataJson?: string | null
  createdAt: string
  billedAt?: string | null
}

export interface UsageSummary {
  totalSpend: number
  aiComputeCost: number
  buildMinutesCost: number
  testRunsCost: number
  previewDeploysCost: number
  aiComputeUnits: number
  buildMinutesUnits: number
  testRunsUnits: number
  previewDeploysUnits: number
  successCount: number
  failedCount: number
  partialCount: number
  totalRecords: number
  fromDate: string
  toDate: string
}

export interface MeterTypeCost {
  meterType: string
  units: number
  totalCost: number
  count: number
}

export interface OutcomeCost {
  outcome: string
  totalCost: number
  count: number
}

export interface ProjectCostBreakdown {
  devRequestId: string
  totalCost: number
  byType: MeterTypeCost[]
  byOutcome: OutcomeCost[]
  totalRecords: number
}

export interface SpendingAlert {
  level: string // info, warning, critical
  message: string
  currentSpend: number
  threshold: number
}

export interface SpendingAlertResult {
  monthlySpend: number
  projectedMonthly: number
  warningThreshold: number
  criticalThreshold: number
  alerts: SpendingAlert[]
}

// === API Functions ===

export async function getUsageSummary(from?: string, to?: string): Promise<UsageSummary> {
  const params = new URLSearchParams()
  if (from) params.set('from', from)
  if (to) params.set('to', to)
  const qs = params.toString() ? `?${params.toString()}` : ''
  const response = await fetch(`${API_BASE_URL}/api/usage/summary${qs}`, {
    headers: authHeaders(),
  })
  if (!response.ok) {
    throw new Error(t('api.error.usageSummaryFailed'))
  }
  return response.json()
}

export async function getUsageHistory(limit = 50): Promise<UsageMeter[]> {
  const response = await fetch(`${API_BASE_URL}/api/usage/history?limit=${limit}`, {
    headers: authHeaders(),
  })
  if (!response.ok) return []
  return response.json()
}

export async function getProjectCostBreakdown(projectId: string): Promise<ProjectCostBreakdown | null> {
  const response = await fetch(`${API_BASE_URL}/api/usage/projects/${projectId}/costs`, {
    headers: authHeaders(),
  })
  if (!response.ok) return null
  return response.json()
}

export async function getSpendingAlerts(): Promise<SpendingAlertResult | null> {
  const response = await fetch(`${API_BASE_URL}/api/usage/spending-alerts`, {
    headers: authHeaders(),
  })
  if (!response.ok) return null
  return response.json()
}
