import i18n from '../i18n'
import { authFetch } from './auth'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'
const t = (key: string) => i18n.t(key)

export interface ApiEndpoint {
  name: string
  path: string
  method: string
  summary?: string
  tag?: string
  requestBody?: string
  responseType?: string
}

export interface ApiDocConfig {
  id: string
  projectName: string
  description?: string
  endpoints: ApiEndpoint[]
  hasOpenApiSpec: boolean
  openApiSpecJson?: string
  sdkLanguages: string[]
  status: string
  devRequestId?: string
  createdAt: string
  updatedAt: string
}

export interface SdkLanguage {
  id: string
  name: string
  fileExtension: string
  packageManager: string
}

export async function listApiDocs(): Promise<ApiDocConfig[]> {
  const response = await authFetch(`${API_BASE_URL}/api/apidocs`)
  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error || t('api.error.apiDocsLoad'))
  }
  return response.json()
}

export async function getApiDoc(id: string): Promise<ApiDocConfig> {
  const response = await authFetch(`${API_BASE_URL}/api/apidocs/${id}`)
  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error || t('api.error.apiDocsLoad'))
  }
  return response.json()
}

export async function createApiDoc(data: {
  projectName: string
  description?: string
  endpoints: ApiEndpoint[]
  sdkLanguages?: string[]
  devRequestId?: string
}): Promise<ApiDocConfig> {
  const response = await authFetch(`${API_BASE_URL}/api/apidocs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error || t('api.error.apiDocsCreate'))
  }
  return response.json()
}

export async function updateApiDoc(
  id: string,
  data: { projectName?: string; description?: string; endpoints?: ApiEndpoint[]; sdkLanguages?: string[] }
): Promise<ApiDocConfig> {
  const response = await authFetch(`${API_BASE_URL}/api/apidocs/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error || t('api.error.apiDocsUpdate'))
  }
  return response.json()
}

export async function deleteApiDoc(id: string): Promise<void> {
  const response = await authFetch(`${API_BASE_URL}/api/apidocs/${id}`, {
    method: 'DELETE',
  })
  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error || t('api.error.apiDocsDelete'))
  }
}

export async function generateSpec(id: string): Promise<ApiDocConfig> {
  const response = await authFetch(`${API_BASE_URL}/api/apidocs/${id}/generate`, {
    method: 'POST',
  })
  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error || t('api.error.apiDocsGenerate'))
  }
  return response.json()
}

export async function getSdkLanguages(): Promise<SdkLanguage[]> {
  const response = await authFetch(`${API_BASE_URL}/api/apidocs/sdk-languages`)
  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error || t('api.error.apiDocsLoad'))
  }
  return response.json()
}
