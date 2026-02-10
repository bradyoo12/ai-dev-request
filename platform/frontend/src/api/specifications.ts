import i18n from '../i18n'
import { getAuthHeaders } from './auth'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

const t = (key: string) => i18n.t(key)

function authHeaders(): Record<string, string> {
  return getAuthHeaders()
}

// === TypeScript Interfaces ===

export interface UserStory {
  id: string
  title: string
  role: string
  action: string
  benefit: string
}

export interface AcceptanceCriterion {
  id: string
  storyId: string
  criteria: string
}

export interface EdgeCase {
  id: string
  description: string
  mitigation: string
}

export interface ArchitectureDecision {
  id: string
  title: string
  decision: string
  rationale: string
}

export interface ApiContract {
  method: string
  path: string
  description: string
  requestBody?: string | null
  responseType: string
}

export interface DataModel {
  name: string
  fields: string[]
}

export interface ComponentSpec {
  name: string
  type: string
  description: string
  children: string[]
}

export interface ImplementationTask {
  id: string
  file: string
  action: string
  description: string
  estimatedLines: number
}

export interface DevelopmentSpec {
  id: string
  devRequestId: number
  phase: string
  status: string
  userStories?: string | null
  acceptanceCriteria?: string | null
  edgeCases?: string | null
  architectureDecisions?: string | null
  apiContracts?: string | null
  dataModels?: string | null
  componentBreakdown?: string | null
  taskList?: string | null
  dependencyOrder?: string | null
  estimatedFiles?: string | null
  traceabilityLinks?: string | null
  rejectionFeedback?: string | null
  version: number
  createdAt: string
  updatedAt?: string | null
  approvedAt?: string | null
}

export interface DevelopmentSpecUpdate {
  userStories?: string | null
  acceptanceCriteria?: string | null
  edgeCases?: string | null
  architectureDecisions?: string | null
  apiContracts?: string | null
  dataModels?: string | null
  componentBreakdown?: string | null
  taskList?: string | null
  dependencyOrder?: string | null
  estimatedFiles?: string | null
  traceabilityLinks?: string | null
}

// === API Functions ===

export async function generateSpec(requestId: number, phase: string): Promise<DevelopmentSpec> {
  const response = await fetch(`${API_BASE_URL}/api/requests/${requestId}/specs/generate`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ phase }),
  })
  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error || t('api.error.specGenerateFailed'))
  }
  return response.json()
}

export async function getSpec(requestId: number): Promise<DevelopmentSpec | null> {
  const response = await fetch(`${API_BASE_URL}/api/requests/${requestId}/specs`, {
    headers: authHeaders(),
  })
  if (!response.ok) return null
  return response.json()
}

export async function getSpecHistory(requestId: number): Promise<DevelopmentSpec[]> {
  const response = await fetch(`${API_BASE_URL}/api/requests/${requestId}/specs/history`, {
    headers: authHeaders(),
  })
  if (!response.ok) return []
  return response.json()
}

export async function approveSpec(requestId: number, specId: string): Promise<DevelopmentSpec> {
  const response = await fetch(`${API_BASE_URL}/api/requests/${requestId}/specs/${specId}/approve`, {
    method: 'POST',
    headers: authHeaders(),
  })
  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error || t('api.error.specApproveFailed'))
  }
  return response.json()
}

export async function rejectSpec(requestId: number, specId: string, feedback: string): Promise<DevelopmentSpec> {
  const response = await fetch(`${API_BASE_URL}/api/requests/${requestId}/specs/${specId}/reject`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ feedback }),
  })
  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error || t('api.error.specRejectFailed'))
  }
  return response.json()
}

export async function updateSpec(requestId: number, specId: string, update: DevelopmentSpecUpdate): Promise<DevelopmentSpec> {
  const response = await fetch(`${API_BASE_URL}/api/requests/${requestId}/specs/${specId}`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify(update),
  })
  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error || t('api.error.specUpdateFailed'))
  }
  return response.json()
}
