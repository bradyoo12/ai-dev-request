import { authFetch } from './auth'

const API = import.meta.env.VITE_API_URL || ''

export interface AiAgentRule {
  id: string
  userId: string
  scope: string
  category: string
  title: string
  content: string
  projectName: string
  isActive: boolean
  priority: number
  timesApplied: number
  devRequestId: number | null
  createdAt: string
  updatedAt: string
}

export interface RuleCategory {
  id: string
  name: string
  description: string
  color: string
}

export interface RuleStats {
  totalRules: number
  activeRules: number
  totalApplied: number
  byScope: { scope: string; count: number; active: number }[]
  byCategory: { category: string; count: number; totalApplied: number }[]
}

export async function listRules(scope?: string, category?: string): Promise<AiAgentRule[]> {
  const params = new URLSearchParams()
  if (scope) params.set('scope', scope)
  if (category) params.set('category', category)
  const qs = params.toString() ? `?${params}` : ''
  const res = await authFetch(`${API}/api/agent-rules${qs}`)
  if (!res.ok) throw new Error('Failed to list rules')
  return res.json()
}

export async function createRule(data: { title: string; content: string; scope?: string; category?: string; projectName?: string; priority?: number }): Promise<AiAgentRule> {
  const res = await authFetch(`${API}/api/agent-rules`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error('Failed to create rule')
  return res.json()
}

export async function toggleRule(id: string): Promise<AiAgentRule> {
  const res = await authFetch(`${API}/api/agent-rules/${id}/toggle`, { method: 'PATCH' })
  if (!res.ok) throw new Error('Failed to toggle rule')
  return res.json()
}

export async function deleteRule(id: string): Promise<void> {
  const res = await authFetch(`${API}/api/agent-rules/${id}`, { method: 'DELETE' })
  if (!res.ok) throw new Error('Failed to delete rule')
}

export async function getRuleStats(): Promise<RuleStats> {
  const res = await authFetch(`${API}/api/agent-rules/stats`)
  if (!res.ok) throw new Error('Failed to get rule stats')
  return res.json()
}

export async function getCategories(): Promise<RuleCategory[]> {
  const res = await fetch(`${API}/api/agent-rules/categories`)
  if (!res.ok) throw new Error('Failed to get categories')
  return res.json()
}
