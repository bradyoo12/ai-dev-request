import { getAuthHeaders } from './auth'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

export interface ChurnOverview {
  activeSubscribers: number
  churnRate: number
  mrr: number
  netGrowth: number
  churnRateChange: number
  netGrowthPrevious: number
  newThisMonth: number
  churnedThisMonth: number
}

export interface ChurnTrend {
  period: string
  totalSubscribers: number
  newSubscribers: number
  churnedSubscribers: number
  churnRate: number
  mrr: number
  netGrowth: number
}

export interface ChurnByPlan {
  plan: string
  activeSubscribers: number
  churnedSubscribers: number
  churnRate: number
  revenueLost: number
}

export interface SubscriptionEvent {
  id: number
  userId: string
  userEmail: string | null
  eventType: string
  fromPlan: string | null
  toPlan: string | null
  reason: string | null
  createdAt: string
}

export interface SubscriptionEventList {
  items: SubscriptionEvent[]
  total: number
  page: number
  pageSize: number
}

export async function getChurnOverview(): Promise<ChurnOverview> {
  const res = await fetch(`${API_BASE_URL}/api/admin/churn/overview`, {
    headers: getAuthHeaders(),
  })
  if (!res.ok) throw new Error('Failed to load churn overview')
  return res.json()
}

export async function getChurnTrends(months = 12): Promise<ChurnTrend[]> {
  const res = await fetch(`${API_BASE_URL}/api/admin/churn/trends?months=${months}`, {
    headers: getAuthHeaders(),
  })
  if (!res.ok) throw new Error('Failed to load churn trends')
  return res.json()
}

export async function getChurnByPlan(): Promise<ChurnByPlan[]> {
  const res = await fetch(`${API_BASE_URL}/api/admin/churn/by-plan`, {
    headers: getAuthHeaders(),
  })
  if (!res.ok) throw new Error('Failed to load churn by plan')
  return res.json()
}

export async function getSubscriptionEvents(
  page = 1,
  pageSize = 20,
  eventType?: string,
  plan?: string
): Promise<SubscriptionEventList> {
  const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) })
  if (eventType && eventType !== 'all') params.set('eventType', eventType)
  if (plan && plan !== 'all') params.set('plan', plan)

  const res = await fetch(`${API_BASE_URL}/api/admin/churn/events?${params}`, {
    headers: getAuthHeaders(),
  })
  if (!res.ok) throw new Error('Failed to load subscription events')
  return res.json()
}

export async function exportChurnCsv(): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/api/admin/churn/export`, {
    headers: getAuthHeaders(),
  })
  if (!res.ok) throw new Error('Failed to export churn data')
  const blob = await res.blob()
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'churn-events.csv'
  a.click()
  URL.revokeObjectURL(url)
}
