import i18n from '../i18n'
import { getAuthHeaders } from './auth'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

const t = (key: string) => i18n.t(key)

function authHeaders(): Record<string, string> {
  return getAuthHeaders()
}

// === Interfaces ===

export interface AgentSkill {
  id: string
  userId: string
  name: string
  description?: string | null
  category?: string | null
  instructionContent?: string | null
  scriptsJson?: string | null
  resourcesJson?: string | null
  tagsJson?: string | null
  isBuiltIn: boolean
  isPublic: boolean
  downloadCount: number
  version?: string | null
  author?: string | null
  createdAt: string
  updatedAt: string
}

export interface CreateAgentSkillPayload {
  userId?: string
  name: string
  description?: string
  category?: string
  instructionContent?: string
  scriptsJson?: string
  resourcesJson?: string
  tagsJson?: string
  isPublic?: boolean
  version?: string
  author?: string
}

export interface UpdateAgentSkillPayload {
  userId?: string
  name: string
  description?: string
  category?: string
  instructionContent?: string
  scriptsJson?: string
  resourcesJson?: string
  tagsJson?: string
  isPublic?: boolean
  version?: string
  author?: string
}

export interface ExportSkillResult {
  json: string
}

// === API Functions ===

export async function getUserSkills(userId: string = 'anonymous'): Promise<AgentSkill[]> {
  const response = await fetch(`${API_BASE_URL}/api/agent-skills?userId=${encodeURIComponent(userId)}`, { headers: authHeaders() })
  if (!response.ok) { const error = await response.json().catch(() => ({})); throw new Error(error.error || t('api.error.agentSkillsListFailed')) }
  return response.json()
}

export async function getSkillById(id: string): Promise<AgentSkill> {
  const response = await fetch(`${API_BASE_URL}/api/agent-skills/${id}`, { headers: authHeaders() })
  if (!response.ok) { const error = await response.json().catch(() => ({})); throw new Error(error.error || t('api.error.agentSkillGetFailed')) }
  return response.json()
}

export async function createSkill(payload: CreateAgentSkillPayload): Promise<AgentSkill> {
  const response = await fetch(`${API_BASE_URL}/api/agent-skills`, { method: 'POST', headers: authHeaders(), body: JSON.stringify(payload) })
  if (!response.ok) { const error = await response.json().catch(() => ({})); throw new Error(error.error || t('api.error.agentSkillCreateFailed')) }
  return response.json()
}

export async function updateSkill(id: string, payload: UpdateAgentSkillPayload): Promise<AgentSkill> {
  const response = await fetch(`${API_BASE_URL}/api/agent-skills/${id}`, { method: 'PUT', headers: authHeaders(), body: JSON.stringify(payload) })
  if (!response.ok) { const error = await response.json().catch(() => ({})); throw new Error(error.error || t('api.error.agentSkillUpdateFailed')) }
  return response.json()
}

export async function deleteSkill(id: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/agent-skills/${id}`, { method: 'DELETE', headers: authHeaders() })
  if (!response.ok) { const error = await response.json().catch(() => ({})); throw new Error(error.error || t('api.error.agentSkillDeleteFailed')) }
}

export async function getPublicSkills(search?: string, category?: string): Promise<AgentSkill[]> {
  const params = new URLSearchParams()
  if (search) params.set('search', search)
  if (category) params.set('category', category)
  const response = await fetch(`${API_BASE_URL}/api/agent-skills/public?${params}`, { headers: authHeaders() })
  if (!response.ok) return []
  return response.json()
}

export async function getBuiltInSkills(): Promise<AgentSkill[]> {
  const response = await fetch(`${API_BASE_URL}/api/agent-skills/built-in`, { headers: authHeaders() })
  if (!response.ok) return []
  return response.json()
}

export async function detectSkills(requestText: string): Promise<AgentSkill[]> {
  const response = await fetch(`${API_BASE_URL}/api/agent-skills/detect`, { method: 'POST', headers: authHeaders(), body: JSON.stringify({ requestText }) })
  if (!response.ok) return []
  return response.json()
}

export async function exportSkill(id: string): Promise<ExportSkillResult> {
  const response = await fetch(`${API_BASE_URL}/api/agent-skills/${id}/export`, { method: 'POST', headers: authHeaders() })
  if (!response.ok) { const error = await response.json().catch(() => ({})); throw new Error(error.error || t('api.error.agentSkillExportFailed')) }
  return response.json()
}

export async function importSkill(json: string, userId?: string): Promise<AgentSkill> {
  const response = await fetch(`${API_BASE_URL}/api/agent-skills/import`, { method: 'POST', headers: authHeaders(), body: JSON.stringify({ json, userId }) })
  if (!response.ok) { const error = await response.json().catch(() => ({})); throw new Error(error.error || t('api.error.agentSkillImportFailed')) }
  return response.json()
}

export async function forkSkill(id: string, userId?: string): Promise<AgentSkill> {
  const response = await fetch(`${API_BASE_URL}/api/agent-skills/${id}/fork`, { method: 'POST', headers: authHeaders(), body: JSON.stringify({ userId }) })
  if (!response.ok) { const error = await response.json().catch(() => ({})); throw new Error(error.error || t('api.error.agentSkillForkFailed')) }
  return response.json()
}
