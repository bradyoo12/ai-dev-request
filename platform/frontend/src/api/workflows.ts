import i18n from '../i18n'
import { getAuthHeaders } from './auth'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

const t = (key: string) => i18n.t(key)

function authHeaders(): Record<string, string> {
  return getAuthHeaders()
}

export interface WorkflowStep {
  name: string
  status: string
  startedAt?: string
  completedAt?: string
  error?: string
}

export interface WorkflowExecution {
  id: number
  devRequestId: number
  workflowType: string
  status: string
  stepsJson: string
  retryCount: number
  createdAt: string
  completedAt?: string
}

export interface StepFailureRate {
  stepName: string
  failureCount: number
  failureRate: number
}

export interface WorkflowMetrics {
  totalWorkflows: number
  completedWorkflows: number
  failedWorkflows: number
  runningWorkflows: number
  successRate: number
  avgDurationSeconds: number
  stepFailureRates: StepFailureRate[]
}

export async function startWorkflow(requestId: number, workflowType = 'full'): Promise<WorkflowExecution> {
  const response = await fetch(`${API_BASE_URL}/api/workflows/start`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ requestId, workflowType }),
  })
  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error || t('api.error.workflowStartFailed'))
  }
  return response.json()
}

export async function getWorkflowStatus(executionId: number): Promise<WorkflowExecution | null> {
  const response = await fetch(`${API_BASE_URL}/api/workflows/${executionId}`, {
    headers: authHeaders(),
  })
  if (!response.ok) return null
  return response.json()
}

export async function retryWorkflowStep(executionId: number, stepName: string): Promise<WorkflowExecution> {
  const response = await fetch(`${API_BASE_URL}/api/workflows/${executionId}/retry/${stepName}`, {
    method: 'POST',
    headers: authHeaders(),
  })
  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error || t('api.error.workflowRetryFailed'))
  }
  return response.json()
}

export async function cancelWorkflow(executionId: number): Promise<WorkflowExecution> {
  const response = await fetch(`${API_BASE_URL}/api/workflows/${executionId}/cancel`, {
    method: 'POST',
    headers: authHeaders(),
  })
  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error || t('api.error.workflowCancelFailed'))
  }
  return response.json()
}

export async function listWorkflows(requestId?: number): Promise<WorkflowExecution[]> {
  const params = requestId ? `?requestId=${requestId}` : ''
  const response = await fetch(`${API_BASE_URL}/api/workflows${params}`, {
    headers: authHeaders(),
  })
  if (!response.ok) return []
  return response.json()
}

export async function getWorkflowMetrics(): Promise<WorkflowMetrics> {
  const response = await fetch(`${API_BASE_URL}/api/workflows/metrics`, {
    headers: authHeaders(),
  })
  if (!response.ok) {
    throw new Error(t('api.error.workflowMetricsFailed'))
  }
  return response.json()
}
