import i18n from '../i18n'
import { getAuthHeaders } from './auth'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

const t = (key: string) => i18n.t(key)

function authHeaders(): Record<string, string> {
  return getAuthHeaders()
}

// === TypeScript Interfaces ===

export interface ResourceUsage {
  cpuPercent: number
  memoryMb: number
  durationMs: number
}

export interface SandboxExecution {
  id: string
  devRequestId: string
  status: string // pending, running, completed, failed, timeout
  executionType: string // build, test, preview
  isolationLevel: string // container, microvm, gvisor
  command: string
  outputLog: string
  errorLog: string
  exitCode: number | null
  resourceUsage?: string | null // JSON string of ResourceUsage
  securityViolationsJson?: string | null // JSON array of strings
  startedAt?: string | null
  completedAt?: string | null
  createdAt: string
}

export interface SandboxExecuteRequest {
  executionType: string
  isolationLevel: string
  command: string
}

// === API Functions ===

export async function executeSandbox(projectId: string, request: SandboxExecuteRequest): Promise<SandboxExecution> {
  const response = await fetch(`${API_BASE_URL}/api/projects/${projectId}/sandbox/execute`, {
    method: 'POST',
    headers: { ...authHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  })
  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error || t('api.error.sandboxExecuteFailed'))
  }
  return response.json()
}

export async function getSandboxExecutions(projectId: string): Promise<SandboxExecution[]> {
  const response = await fetch(`${API_BASE_URL}/api/projects/${projectId}/sandbox/executions`, {
    headers: authHeaders(),
  })
  if (!response.ok) return []
  return response.json()
}

export async function getSandboxExecution(projectId: string, executionId: string): Promise<SandboxExecution | null> {
  const response = await fetch(`${API_BASE_URL}/api/projects/${projectId}/sandbox/executions/${executionId}`, {
    headers: authHeaders(),
  })
  if (!response.ok) return null
  return response.json()
}

export async function getLatestSandboxExecution(projectId: string): Promise<SandboxExecution | null> {
  const response = await fetch(`${API_BASE_URL}/api/projects/${projectId}/sandbox/executions/latest`, {
    headers: authHeaders(),
  })
  if (!response.ok) return null
  return response.json()
}
