import i18n from '../i18n'
import { getAuthHeaders } from './auth'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

function authHeaders(): Record<string, string> {
  return getAuthHeaders()
}

const t = (key: string) => i18n.t(key)

// Types
export interface ParallelOrchestration {
  id: number
  devRequestId: string
  status: 'pending' | 'running' | 'completed' | 'failed'
  totalTasks: number
  completedTasks: number
  failedTasks: number
  dependencyGraphJson: string
  startedAt?: string
  completedAt?: string
  totalDurationMs: number
  mergeConflictsJson?: string
  createdAt: string
}

export interface SubagentTask {
  id: number
  devRequestId: string
  parentOrchestrationId?: number
  taskType: 'frontend' | 'backend' | 'tests' | 'docs' | 'schema'
  name: string
  description: string
  contextJson: string
  status: 'pending' | 'running' | 'completed' | 'failed'
  outputJson?: string
  startedAt?: string
  completedAt?: string
  durationMs: number
  tokensUsed: number
  errorMessage?: string
  createdAt: string
}

export interface MergeConflict {
  id: number
  type: 'file' | 'import' | 'api_contract' | 'type'
  filePath: string
  description: string
  conflictingTasks: number[]
  status: 'unresolved' | 'resolved' | 'manual'
  resolutionJson?: string
}

export interface OrchestrationLogEntry {
  timestamp: string
  taskType: string
  message: string
  level: 'info' | 'warning' | 'error' | 'success'
}

// API Functions
export async function startOrchestration(devRequestId: string): Promise<ParallelOrchestration> {
  const response = await fetch(`${API_BASE_URL}/api/requests/${devRequestId}/orchestration/start`, {
    method: 'POST',
    headers: authHeaders(),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.message || t('api.error.orchestrationStartFailed'))
  }

  return response.json()
}

export async function getOrchestrationStatus(devRequestId: string): Promise<ParallelOrchestration> {
  const response = await fetch(`${API_BASE_URL}/api/requests/${devRequestId}/orchestration/status`, {
    headers: authHeaders(),
  })

  if (!response.ok) {
    throw new Error(t('api.error.orchestrationStatusFailed'))
  }

  return response.json()
}

export async function getOrchestrationTasks(devRequestId: string): Promise<SubagentTask[]> {
  const response = await fetch(`${API_BASE_URL}/api/requests/${devRequestId}/orchestration/tasks`, {
    headers: authHeaders(),
  })

  if (!response.ok) {
    throw new Error(t('api.error.orchestrationTasksFailed'))
  }

  return response.json()
}

export async function cancelOrchestration(devRequestId: string): Promise<ParallelOrchestration> {
  const response = await fetch(`${API_BASE_URL}/api/requests/${devRequestId}/orchestration/cancel`, {
    method: 'POST',
    headers: authHeaders(),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.message || t('api.error.orchestrationCancelFailed'))
  }

  return response.json()
}

export async function getConflicts(orchestrationId: number): Promise<MergeConflict[]> {
  const response = await fetch(`${API_BASE_URL}/api/orchestration/${orchestrationId}/conflicts`, {
    headers: authHeaders(),
  })

  if (!response.ok) {
    throw new Error(t('api.error.conflictsFailed'))
  }

  return response.json()
}

export async function resolveConflict(
  orchestrationId: number,
  conflictId: number,
  auto: boolean
): Promise<MergeConflict> {
  const response = await fetch(`${API_BASE_URL}/api/orchestration/${orchestrationId}/resolve`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ conflictId, auto }),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.message || t('api.error.conflictResolveFailed'))
  }

  return response.json()
}

export function createEventSource(orchestrationId: number): EventSource {
  return new EventSource(`${API_BASE_URL}/api/orchestration/${orchestrationId}/stream`)
}
