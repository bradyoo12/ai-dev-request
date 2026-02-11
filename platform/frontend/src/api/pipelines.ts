import i18n from '../i18n'
import { authFetch } from './auth'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'
const t = (key: string) => i18n.t(key)

export interface PipelineStep {
  id: string
  type: string
  name: string
  description?: string
  customPrompt?: string
  enabled: boolean
}

export interface Pipeline {
  id: string
  name: string
  description?: string
  steps: PipelineStep[]
  status: string
  isTemplate: boolean
  templateCategory?: string
  executionCount: number
  isOwner: boolean
  createdAt: string
  updatedAt: string
}

export async function listPipelines(): Promise<Pipeline[]> {
  const response = await authFetch(`${API_BASE_URL}/api/pipelines`)
  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error || t('api.error.pipelineLoad'))
  }
  return response.json()
}

export async function getPipeline(id: string): Promise<Pipeline> {
  const response = await authFetch(`${API_BASE_URL}/api/pipelines/${id}`)
  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error || t('api.error.pipelineLoad'))
  }
  return response.json()
}

export async function createPipeline(data: {
  name: string
  description?: string
  steps: PipelineStep[]
}): Promise<Pipeline> {
  const response = await authFetch(`${API_BASE_URL}/api/pipelines`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error || t('api.error.pipelineCreate'))
  }
  return response.json()
}

export async function updatePipeline(
  id: string,
  data: { name?: string; description?: string; steps?: PipelineStep[] }
): Promise<Pipeline> {
  const response = await authFetch(`${API_BASE_URL}/api/pipelines/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error || t('api.error.pipelineUpdate'))
  }
  return response.json()
}

export async function deletePipeline(id: string): Promise<void> {
  const response = await authFetch(`${API_BASE_URL}/api/pipelines/${id}`, {
    method: 'DELETE',
  })
  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error || t('api.error.pipelineDelete'))
  }
}
