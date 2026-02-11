import i18n from '../i18n'
import { getAuthHeaders } from './auth'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'
const t = (key: string) => i18n.t(key)

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp: string
}

export interface ComponentPreview {
  id: string
  componentName: string
  code: string
  chatHistory: ChatMessage[]
  iterationCount: number
  status: string
  designTokens: string | null
  createdAt: string
  updatedAt: string
}

function authHeaders(): Record<string, string> {
  return getAuthHeaders()
}

export async function getPreviews(): Promise<ComponentPreview[]> {
  const response = await fetch(`${API_BASE_URL}/api/component-preview`, {
    headers: authHeaders(),
  })
  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error || t('componentPreview.error.loadFailed'))
  }
  return response.json()
}

export async function getPreview(id: string): Promise<ComponentPreview> {
  const response = await fetch(`${API_BASE_URL}/api/component-preview/${id}`, {
    headers: authHeaders(),
  })
  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error || t('componentPreview.error.loadFailed'))
  }
  return response.json()
}

export async function createPreview(componentName: string, prompt: string): Promise<ComponentPreview> {
  const response = await fetch(`${API_BASE_URL}/api/component-preview`, {
    method: 'POST',
    headers: { ...authHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ componentName, prompt }),
  })
  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error || t('componentPreview.error.createFailed'))
  }
  return response.json()
}

export async function iteratePreview(id: string, message: string): Promise<ComponentPreview> {
  const response = await fetch(`${API_BASE_URL}/api/component-preview/${id}/iterate`, {
    method: 'POST',
    headers: { ...authHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ message }),
  })
  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error || t('componentPreview.error.iterateFailed'))
  }
  return response.json()
}

export async function exportPreview(id: string): Promise<ComponentPreview> {
  const response = await fetch(`${API_BASE_URL}/api/component-preview/${id}/export`, {
    method: 'POST',
    headers: authHeaders(),
  })
  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error || t('componentPreview.error.exportFailed'))
  }
  return response.json()
}

export async function deletePreview(id: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/component-preview/${id}`, {
    method: 'DELETE',
    headers: authHeaders(),
  })
  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error || t('componentPreview.error.deleteFailed'))
  }
}
