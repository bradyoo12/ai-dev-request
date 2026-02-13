import i18n from '../i18n'
import { getAuthHeaders } from './auth'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

const t = (key: string) => i18n.t(key)

function authHeaders(): Record<string, string> {
  return getAuthHeaders()
}

// === TypeScript Interfaces ===

export interface FileAttribution {
  filePath: string
  ranges: AttributionRange[]
}

export interface AttributionRange {
  startLine: number
  endLine: number
  source: string  // "ai" | "human" | "mixed"
  conversationId?: string
  agentId?: string
  timestamp?: string
}

export interface AgentTrace {
  id: string
  devRequestId: string
  status: string
  totalFiles: number
  aiGeneratedFiles: number
  humanEditedFiles: number
  mixedFiles: number
  aiContributionPercentage: number
  traceDataJson?: string | null
  exportFormat?: string | null
  exportedAt?: string | null
  version: number
  createdAt: string
  updatedAt?: string | null
}

// === API Functions ===

export async function recordAttribution(projectId: string): Promise<AgentTrace> {
  const response = await fetch(`${API_BASE_URL}/api/projects/${projectId}/traces`, {
    method: 'POST',
    headers: authHeaders(),
  })
  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error || t('api.error.traceFailed'))
  }
  return response.json()
}

export async function getLatestTrace(projectId: string): Promise<AgentTrace | null> {
  const response = await fetch(`${API_BASE_URL}/api/projects/${projectId}/traces/latest`, {
    headers: authHeaders(),
  })
  if (!response.ok) return null
  return response.json()
}

export async function getTraceHistory(projectId: string): Promise<AgentTrace[]> {
  const response = await fetch(`${API_BASE_URL}/api/projects/${projectId}/traces/history`, {
    headers: authHeaders(),
  })
  if (!response.ok) return []
  return response.json()
}

export async function exportTrace(projectId: string, traceId: string): Promise<AgentTrace | null> {
  const response = await fetch(`${API_BASE_URL}/api/projects/${projectId}/traces/${traceId}/export`, {
    method: 'POST',
    headers: authHeaders(),
  })
  if (!response.ok) return null
  return response.json()
}
