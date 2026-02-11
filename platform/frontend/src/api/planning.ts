import { authFetch } from './auth'

const API = import.meta.env.VITE_API_URL || ''

export interface PlanningMessage {
  role: string
  content: string
  timestamp: string
}

export interface PlanningSession {
  id: string
  userId: string
  devRequestId: string | null
  sessionName: string
  status: string
  mode: string
  messagesJson: string
  planOutputJson: string
  totalMessages: number
  userMessages: number
  aiMessages: number
  tokensUsed: number
  estimatedSavings: number
  createdAt: string
  updatedAt: string
}

export interface PlanningMode {
  id: string
  name: string
  description: string
}

export interface PlanningStats {
  totalSessions: number
  activeSessions: number
  completedSessions: number
  totalMessages: number
  totalTokensUsed: number
  estimatedSavings: number
  byMode: { mode: string; count: number; totalMessages: number; tokensUsed: number }[]
}

export interface PlanSummary {
  mode: string
  totalExchanges: number
  keyTopics: string[]
  summary: string
  nextSteps: string[]
  completedAt: string
}

export async function listPlanningSessions(): Promise<PlanningSession[]> {
  const res = await authFetch(`${API}/api/planning/sessions`)
  if (!res.ok) throw new Error('Failed to load sessions')
  return res.json()
}

export async function getPlanningSession(id: string): Promise<PlanningSession> {
  const res = await authFetch(`${API}/api/planning/sessions/${id}`)
  if (!res.ok) throw new Error('Failed to load session')
  return res.json()
}

export async function createPlanningSession(data: { sessionName: string; mode: string; devRequestId?: string }): Promise<PlanningSession> {
  const res = await authFetch(`${API}/api/planning/sessions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error('Failed to create session')
  return res.json()
}

export async function sendPlanningMessage(id: string, content: string): Promise<PlanningSession> {
  const res = await authFetch(`${API}/api/planning/sessions/${id}/message`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content }),
  })
  if (!res.ok) throw new Error('Failed to send message')
  return res.json()
}

export async function completePlanningSession(id: string): Promise<PlanningSession> {
  const res = await authFetch(`${API}/api/planning/sessions/${id}/complete`, { method: 'POST' })
  if (!res.ok) throw new Error('Failed to complete session')
  return res.json()
}

export async function deletePlanningSession(id: string): Promise<void> {
  const res = await authFetch(`${API}/api/planning/sessions/${id}`, { method: 'DELETE' })
  if (!res.ok) throw new Error('Failed to delete session')
}

export async function getPlanningStats(): Promise<PlanningStats> {
  const res = await authFetch(`${API}/api/planning/stats`)
  if (!res.ok) throw new Error('Failed to load stats')
  return res.json()
}

export async function getPlanningModes(): Promise<PlanningMode[]> {
  const res = await authFetch(`${API}/api/planning/modes`)
  if (!res.ok) throw new Error('Failed to load modes')
  return res.json()
}
