import i18n from '../i18n'
import { getAuthHeaders } from './auth'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

const t = (key: string) => i18n.t(key)

function authHeaders(): Record<string, string> {
  return getAuthHeaders()
}

// === Interfaces ===

export interface AgentTeam {
  id: string
  userId: string
  name: string
  description?: string | null
  strategy: string
  membersJson: string
  template?: string | null
  status: string
  lastExecutionJson?: string | null
  isPublic: boolean
  executionCount: number
  createdAt: string
  updatedAt: string
}

export interface CreateAgentTeamPayload {
  userId?: string
  name: string
  description?: string
  strategy?: string
  membersJson?: string
  template?: string
  isPublic?: boolean
}

export interface UpdateAgentTeamPayload {
  userId?: string
  name: string
  description?: string
  strategy?: string
  membersJson?: string
  template?: string
  isPublic?: boolean
}

// === API Functions ===

export async function getUserTeams(userId: string = 'anonymous'): Promise<AgentTeam[]> {
  const response = await fetch(`${API_BASE_URL}/api/agent-teams?userId=${encodeURIComponent(userId)}`, { headers: authHeaders() })
  if (!response.ok) { const error = await response.json().catch(() => ({})); throw new Error(error.error || t('api.error.agentTeamsListFailed')) }
  return response.json()
}

export async function getTeamById(id: string): Promise<AgentTeam> {
  const response = await fetch(`${API_BASE_URL}/api/agent-teams/${id}`, { headers: authHeaders() })
  if (!response.ok) { const error = await response.json().catch(() => ({})); throw new Error(error.error || t('api.error.agentTeamGetFailed')) }
  return response.json()
}

export async function createTeam(payload: CreateAgentTeamPayload): Promise<AgentTeam> {
  const response = await fetch(`${API_BASE_URL}/api/agent-teams`, { method: 'POST', headers: authHeaders(), body: JSON.stringify(payload) })
  if (!response.ok) { const error = await response.json().catch(() => ({})); throw new Error(error.error || t('api.error.agentTeamCreateFailed')) }
  return response.json()
}

export async function updateTeam(id: string, payload: UpdateAgentTeamPayload): Promise<AgentTeam> {
  const response = await fetch(`${API_BASE_URL}/api/agent-teams/${id}`, { method: 'PUT', headers: authHeaders(), body: JSON.stringify(payload) })
  if (!response.ok) { const error = await response.json().catch(() => ({})); throw new Error(error.error || t('api.error.agentTeamUpdateFailed')) }
  return response.json()
}

export async function deleteTeam(id: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/agent-teams/${id}`, { method: 'DELETE', headers: authHeaders() })
  if (!response.ok) { const error = await response.json().catch(() => ({})); throw new Error(error.error || t('api.error.agentTeamDeleteFailed')) }
}

export async function createFromTemplate(template: string, userId?: string): Promise<AgentTeam> {
  const response = await fetch(`${API_BASE_URL}/api/agent-teams/from-template`, { method: 'POST', headers: authHeaders(), body: JSON.stringify({ template, userId }) })
  if (!response.ok) { const error = await response.json().catch(() => ({})); throw new Error(error.error || t('api.error.agentTeamTemplateFailed')) }
  return response.json()
}

export async function spawnExecution(teamId: string, devRequestId: string): Promise<AgentTeam> {
  const response = await fetch(`${API_BASE_URL}/api/agent-teams/${teamId}/spawn`, { method: 'POST', headers: authHeaders(), body: JSON.stringify({ devRequestId }) })
  if (!response.ok) { const error = await response.json().catch(() => ({})); throw new Error(error.error || t('api.error.agentTeamSpawnFailed')) }
  return response.json()
}

export async function getPublicTeams(search?: string): Promise<AgentTeam[]> {
  const params = new URLSearchParams()
  if (search) params.set('search', search)
  const response = await fetch(`${API_BASE_URL}/api/agent-teams/public?${params}`, { headers: authHeaders() })
  if (!response.ok) return []
  return response.json()
}

export async function forkTeam(id: string, userId?: string): Promise<AgentTeam> {
  const response = await fetch(`${API_BASE_URL}/api/agent-teams/${id}/fork`, { method: 'POST', headers: authHeaders(), body: JSON.stringify({ userId }) })
  if (!response.ok) { const error = await response.json().catch(() => ({})); throw new Error(error.error || t('api.error.agentTeamForkFailed')) }
  return response.json()
}
