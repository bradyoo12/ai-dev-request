import { authFetch } from './auth'

const API = import.meta.env.VITE_API_URL || ''

export interface AgenticWorkflow {
  id: number
  projectName: string
  workflowName: string
  workflowVersion: string
  deploymentStrategy: string
  rolloutPercent: number
  successRate: number
  avgLatencyMs: number
  costPerRequest: number
  totalRequests: number
  failedRequests: number
  rollbackTriggered: boolean
  rollbackReason: string
  rollbackVersion: string
  healthStatus: string
  monitoringAlerts: string
  status: string
  createdAt: string
}

export interface DeployResponse {
  id: number
  projectName: string
  workflowName: string
  workflowVersion: string
  deploymentStrategy: string
  rolloutPercent: number
  successRate: number
  avgLatencyMs: number
  costPerRequest: number
  totalRequests: number
  failedRequests: number
  rollbackTriggered: boolean
  rollbackReason: string
  rollbackVersion: string
  healthStatus: string
  alerts: { type: string; message: string }[]
  recommendation: string
}

export interface DeployStrategy {
  id: string
  name: string
  description: string
  rollout: string
  riskLevel: string
  features: string[]
}

export interface WorkflowStats {
  total: number
  byStrategy: { strategy: string; count: number; avgSuccess: number }[]
}

export async function listWorkflows(): Promise<AgenticWorkflow[]> {
  const res = await authFetch(`${API}/api/agentic-workflows`)
  if (!res.ok) return []
  return res.json()
}

export async function deployWorkflow(projectName: string, workflowName: string, version: string, strategy: string): Promise<DeployResponse> {
  const res = await authFetch(`${API}/api/agentic-workflows/deploy`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ projectName, workflowName, version, strategy })
  })
  return res.json()
}

export async function deleteWorkflow(id: number): Promise<void> {
  await authFetch(`${API}/api/agentic-workflows/${id}`, { method: 'DELETE' })
}

export async function getWorkflowStats(): Promise<WorkflowStats> {
  const res = await authFetch(`${API}/api/agentic-workflows/stats`)
  if (!res.ok) return { total: 0, byStrategy: [] }
  return res.json()
}

export async function getStrategies(): Promise<DeployStrategy[]> {
  const res = await fetch(`${API}/api/agentic-workflows/strategies`)
  if (!res.ok) return []
  return res.json()
}
