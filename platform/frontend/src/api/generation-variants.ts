import i18n from '../i18n'
import { getAuthHeaders } from './auth'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'
const t = (key: string) => i18n.t(key)

export interface GeneratedFile {
  path: string
  content: string
}

export interface GenerationVariant {
  id: string
  devRequestId: string
  variantNumber: number
  approach: string
  description: string
  filesJson: string
  fileCount: number
  linesOfCode: number
  dependencyCount: number
  estimatedBundleSizeKb: number
  modelTier: string
  tokensUsed: number
  rating: number
  isSelected: boolean
  status: string
  createdAt: string
}

function authHeaders(): Record<string, string> {
  return getAuthHeaders()
}

export async function generateVariants(requestId: string, description: string): Promise<GenerationVariant[]> {
  const response = await fetch(`${API_BASE_URL}/api/requests/${requestId}/variants/generate`, {
    method: 'POST',
    headers: { ...authHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ description }),
  })
  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error || t('variantComparison.error.generateFailed'))
  }
  return response.json()
}

export async function getVariants(requestId: string): Promise<GenerationVariant[]> {
  const response = await fetch(`${API_BASE_URL}/api/requests/${requestId}/variants`, {
    headers: authHeaders(),
  })
  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error || t('variantComparison.error.loadFailed'))
  }
  return response.json()
}

export async function selectVariant(requestId: string, variantId: string): Promise<GenerationVariant> {
  const response = await fetch(`${API_BASE_URL}/api/requests/${requestId}/variants/${variantId}/select`, {
    method: 'POST',
    headers: authHeaders(),
  })
  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error || t('variantComparison.error.selectFailed'))
  }
  return response.json()
}

export async function rateVariant(requestId: string, variantId: string, rating: number): Promise<GenerationVariant> {
  const response = await fetch(`${API_BASE_URL}/api/requests/${requestId}/variants/${variantId}/rate`, {
    method: 'POST',
    headers: { ...authHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ rating }),
  })
  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error || t('variantComparison.error.rateFailed'))
  }
  return response.json()
}

export async function deleteVariants(requestId: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/requests/${requestId}/variants`, {
    method: 'DELETE',
    headers: authHeaders(),
  })
  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error || t('variantComparison.error.deleteFailed'))
  }
}
