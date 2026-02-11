import i18n from '../i18n'
import { authFetch } from './auth'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

const t = (key: string) => i18n.t(key)

export interface ApiKey {
  id: string
  name: string
  keyPrefix: string
  status: string
  requestCount: number
  createdAt: string
  lastUsedAt?: string | null
}

export interface GenerateKeyResponse {
  id: string
  name: string
  key: string
  keyPrefix: string
  createdAt: string
}

export async function listApiKeys(): Promise<ApiKey[]> {
  const response = await authFetch(`${API_BASE_URL}/api/apikeys`)
  if (!response.ok) throw new Error(t('api.error.apiKeysLoadFailed'))
  return response.json()
}

export async function generateApiKey(name: string): Promise<GenerateKeyResponse> {
  const response = await authFetch(`${API_BASE_URL}/api/apikeys`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  })
  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error || t('api.error.apiKeyGenerateFailed'))
  }
  return response.json()
}

export async function revokeApiKey(id: string): Promise<void> {
  const response = await authFetch(`${API_BASE_URL}/api/apikeys/${id}`, {
    method: 'DELETE',
  })
  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error || t('api.error.apiKeyRevokeFailed'))
  }
}
