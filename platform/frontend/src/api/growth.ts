import { getAuthHeaders } from './auth'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

export interface GrowthOverview {
  totalVisitors: number
  totalRegistered: number
  totalTrialUsers: number
  totalPaidUsers: number
  monthlyGrowthRate: number
  conversionRate: number
  churnRate: number
}

export interface GrowthTrend {
  month: string
  visitors: number
  registered: number
  trialUsers: number
  paidUsers: number
}

export interface FunnelStep {
  stage: string
  count: number
  percentage: number
}

export async function getGrowthOverview(): Promise<GrowthOverview> {
  const res = await fetch(`${API_BASE_URL}/api/admin/growth/overview`, {
    headers: getAuthHeaders(),
  })
  if (!res.ok) throw new Error('Failed to load growth overview')
  return res.json()
}

export async function getGrowthTrends(months = 12): Promise<GrowthTrend[]> {
  const res = await fetch(`${API_BASE_URL}/api/admin/growth/trends?months=${months}`, {
    headers: getAuthHeaders(),
  })
  if (!res.ok) throw new Error('Failed to load growth trends')
  return res.json()
}

export async function getGrowthFunnel(): Promise<FunnelStep[]> {
  const res = await fetch(`${API_BASE_URL}/api/admin/growth/funnel`, {
    headers: getAuthHeaders(),
  })
  if (!res.ok) throw new Error('Failed to load growth funnel')
  return res.json()
}

export async function exportGrowthCsv(): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/api/admin/growth/export`, {
    headers: getAuthHeaders(),
  })
  if (!res.ok) throw new Error('Failed to export growth data')
  const blob = await res.blob()
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `growth-metrics-${new Date().toISOString().split('T')[0]}.csv`
  a.click()
  URL.revokeObjectURL(url)
}
