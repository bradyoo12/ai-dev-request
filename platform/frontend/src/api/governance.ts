import { authFetch } from './auth'

const API = import.meta.env.VITE_API_URL || ''

export interface GovernanceAction {
  id: string
  projectName: string
  actionType: string
  actionDescription: string
  classification: string
  agentId: string
  requiresApproval: boolean
  approvalStatus: string
  approvedBy: string
  blocked: boolean
  blockReason: string
  rolled: boolean
  rollbackAction: string
  executionTimeMs: number
  affectedFiles: number
  auditTrail: string
  status: string
  createdAt: string
}

export interface EvaluateResponse {
  action: GovernanceAction
  classification: string
  requiresApproval: boolean
  blocked: boolean
  recommendation: string
  rollbackAvailable: boolean
  guardrails: { rule: string; enabled: boolean; applies: boolean }[]
}

export interface GovernanceRule {
  id: string
  name: string
  description: string
  severity: string
  enabled: boolean
  color: string
}

export interface GovernanceStats {
  totalActions: number
  blockedActions: number
  pendingApprovals: number
  autoApproved: number
  rollbackCount: number
  avgExecutionTimeMs: number
  byClassification: { classification: string; count: number; blockedCount: number; approvalRate: number }[]
}

export async function listActions(): Promise<GovernanceAction[]> {
  const res = await authFetch(`${API}/api/governance`)
  if (!res.ok) throw new Error('Failed to list actions')
  return res.json()
}

export async function evaluateAction(projectName: string, actionType: string, actionDescription: string, agentId: string): Promise<EvaluateResponse> {
  const res = await authFetch(`${API}/api/governance/evaluate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ projectName, actionType, actionDescription, agentId }),
  })
  if (!res.ok) throw new Error('Failed to evaluate action')
  return res.json()
}

export async function deleteAction(id: string): Promise<void> {
  const res = await authFetch(`${API}/api/governance/${id}`, { method: 'DELETE' })
  if (!res.ok) throw new Error('Failed to delete action')
}

export async function getGovernanceStats(): Promise<GovernanceStats> {
  const res = await authFetch(`${API}/api/governance/stats`)
  if (!res.ok) throw new Error('Failed to get stats')
  return res.json()
}

export async function getRules(): Promise<GovernanceRule[]> {
  const res = await fetch(`${API}/api/governance/rules`)
  if (!res.ok) throw new Error('Failed to get rules')
  return res.json()
}
