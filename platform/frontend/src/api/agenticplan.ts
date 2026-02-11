import { authFetch } from './auth'

const API = import.meta.env.VITE_API_URL || ''

export interface PlanStep {
  id: number
  name: string
  description: string
  status: string
  timeMs: number
  tokensUsed: number
  retries: number
}

export interface AgenticPlan {
  id: string
  planName: string
  userPrompt: string
  stepsJson: string
  status: string
  totalSteps: number
  completedSteps: number
  failedSteps: number
  retryCount: number
  totalTokensUsed: number
  totalTimeMs: number
  requiresApproval: boolean
  isApproved: boolean
  createdAt: string
  updatedAt: string
}

export interface AgenticPlanStats {
  totalPlans: number
  completedPlans: number
  totalStepsExecuted: number
  totalTokensUsed: number
  averageStepsPerPlan: number
  successRate: number
  recentPlans: { planName: string; status: string; totalSteps: number; completedSteps: number; createdAt: string }[]
}

export async function listPlans(): Promise<AgenticPlan[]> {
  const res = await authFetch(`${API}/api/agentic-plan/plans`)
  if (!res.ok) throw new Error('Failed to load plans')
  return res.json()
}

export async function generatePlan(prompt: string, planName?: string): Promise<AgenticPlan> {
  const res = await authFetch(`${API}/api/agentic-plan/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, planName }),
  })
  if (!res.ok) throw new Error('Failed to generate plan')
  return res.json()
}

export async function approvePlan(id: string): Promise<AgenticPlan> {
  const res = await authFetch(`${API}/api/agentic-plan/plans/${id}/approve`, { method: 'POST' })
  if (!res.ok) throw new Error('Failed to approve plan')
  return res.json()
}

export async function executePlan(id: string): Promise<AgenticPlan> {
  const res = await authFetch(`${API}/api/agentic-plan/plans/${id}/execute`, { method: 'POST' })
  if (!res.ok) throw new Error('Failed to execute plan')
  return res.json()
}

export async function getAgenticPlanStats(): Promise<AgenticPlanStats> {
  const res = await authFetch(`${API}/api/agentic-plan/stats`)
  if (!res.ok) throw new Error('Failed to load stats')
  return res.json()
}
