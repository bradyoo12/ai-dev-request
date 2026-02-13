import { authFetch } from './auth'

const API = import.meta.env.VITE_API_URL || ''

export interface ComposerPlan {
  id: string
  userId: string
  projectName: string
  prompt: string
  planMode: string
  totalSteps: number
  completedSteps: number
  filesChanged: number
  linesAdded: number
  linesRemoved: number
  modelTier: string
  estimatedTokens: number
  actualTokens: number
  diffPreviewShown: boolean
  planApproved: boolean
  status: string
  planSummary: string
  createdAt: string
  updatedAt: string
}

export interface PlanStep {
  step: number
  description: string
  file: string
  changeType: string
  linesAdded: number
  linesRemoved: number
}

export interface CreatePlanResponse {
  plan: ComposerPlan
  steps: PlanStep[]
}

export interface ComposerMode {
  id: string
  name: string
  description: string
  color: string
}

export interface ComposerStats {
  totalPlans: number
  totalFiles: number
  totalLinesAdded: number
  totalLinesRemoved: number
  approvalRate: number
  byMode: { mode: string; count: number }[]
  byModel: { model: string; count: number; tokens: number }[]
}

export async function listPlans(): Promise<ComposerPlan[]> {
  const res = await authFetch(`${API}/api/composer`)
  if (!res.ok) throw new Error('Failed to list plans')
  return res.json()
}

export async function createPlan(projectName: string, prompt: string, planMode?: string, modelTier?: string): Promise<CreatePlanResponse> {
  const res = await authFetch(`${API}/api/composer/plan`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ projectName, prompt, planMode, modelTier }),
  })
  if (!res.ok) throw new Error('Failed to create plan')
  return res.json()
}

export async function approvePlan(id: string, approved: boolean): Promise<ComposerPlan> {
  const res = await authFetch(`${API}/api/composer/${id}/approve`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ approved }),
  })
  if (!res.ok) throw new Error('Failed to approve plan')
  return res.json()
}

export async function deletePlan(id: string): Promise<void> {
  const res = await authFetch(`${API}/api/composer/${id}`, { method: 'DELETE' })
  if (!res.ok) throw new Error('Failed to delete plan')
}

export async function getComposerStats(): Promise<ComposerStats> {
  const res = await authFetch(`${API}/api/composer/stats`)
  if (!res.ok) throw new Error('Failed to get stats')
  return res.json()
}

export async function getModes(): Promise<ComposerMode[]> {
  const res = await fetch(`${API}/api/composer/modes`)
  if (!res.ok) throw new Error('Failed to get modes')
  return res.json()
}
