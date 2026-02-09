import i18n from '../i18n'
import { getAuthHeaders } from './auth'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

const t = (key: string) => i18n.t(key)

function authHeaders(): Record<string, string> {
  return getAuthHeaders()
}

export interface AgentCard {
  id: number
  agentKey: string
  name: string
  description?: string
  scopes?: string
  clientId?: string
  isActive: boolean
  createdAt: string
}

export interface A2AConsent {
  id: number
  fromAgentId: number
  toAgentId: number
  scopes: string
  isGranted: boolean
  grantedAt: string
  revokedAt?: string
  expiresAt?: string
}

export interface A2ATask {
  id: number
  taskUid: string
  fromAgentId: number
  toAgentId: number
  status: string
  errorMessage?: string
  createdAt: string
  completedAt?: string
}

export interface A2AArtifact {
  id: number
  taskId: number
  artifactType: string
  schemaVersion: string
  dataJson: string
  direction: string
  createdAt: string
}

// Agent APIs
export async function registerAgent(data: {
  agentKey: string
  name: string
  description?: string
  scopes?: string
}): Promise<AgentCard> {
  const response = await fetch(`${API_BASE_URL}/api/a2a/agents`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(data),
  })
  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error || t('api.error.a2aRegisterFailed'))
  }
  return response.json()
}

export async function getAgents(mine = false): Promise<AgentCard[]> {
  const response = await fetch(
    `${API_BASE_URL}/api/a2a/agents?mine=${mine}`,
    { headers: authHeaders() }
  )
  if (!response.ok) return []
  return response.json()
}

// Consent APIs
export async function grantConsent(data: {
  fromAgentId: number
  toAgentId: number
  scopes: string
}): Promise<A2AConsent> {
  const response = await fetch(`${API_BASE_URL}/api/a2a/consents`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(data),
  })
  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error || t('api.error.a2aConsentFailed'))
  }
  return response.json()
}

export async function revokeConsent(consentId: number): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/a2a/consents/${consentId}`, {
    method: 'DELETE',
    headers: authHeaders(),
  })
  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error || t('api.error.a2aRevokeFailed'))
  }
}

export async function getConsents(): Promise<A2AConsent[]> {
  const response = await fetch(`${API_BASE_URL}/api/a2a/consents`, {
    headers: authHeaders(),
  })
  if (!response.ok) return []
  return response.json()
}

// Task APIs
export async function createA2ATask(data: {
  fromAgentId: number
  toAgentId: number
  artifactType: string
  dataJson: string
}): Promise<A2ATask> {
  const response = await fetch(`${API_BASE_URL}/api/a2a/tasks`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(data),
  })
  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error || t('api.error.a2aTaskFailed'))
  }
  return response.json()
}

export async function getA2ATasks(page = 1, pageSize = 20): Promise<A2ATask[]> {
  const response = await fetch(
    `${API_BASE_URL}/api/a2a/tasks?page=${page}&pageSize=${pageSize}`,
    { headers: authHeaders() }
  )
  if (!response.ok) return []
  return response.json()
}

export async function getA2ATaskArtifacts(taskId: number): Promise<A2AArtifact[]> {
  const response = await fetch(`${API_BASE_URL}/api/a2a/tasks/${taskId}/artifacts`, {
    headers: authHeaders(),
  })
  if (!response.ok) return []
  return response.json()
}
