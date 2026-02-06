import i18n from '../i18n'
import { getUserId } from './settings'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

const t = (key: string) => i18n.t(key)

function authHeaders(): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    'X-User-Id': getUserId(),
  }
}

export interface SiteResponse {
  id: string
  devRequestId: string
  siteName: string
  resourceGroupName?: string
  status: string
  previewUrl?: string
  containerAppName?: string
  region: string
  projectType?: string
  createdAt: string
  deployedAt?: string
  updatedAt: string
}

export interface DeploymentLog {
  timestamp: string
  message: string
  level: string
}

export interface SiteDetailResponse extends SiteResponse {
  containerImageTag?: string
  logs: DeploymentLog[]
}

export async function getSites(): Promise<SiteResponse[]> {
  const response = await fetch(`${API_BASE_URL}/api/sites`, {
    headers: authHeaders(),
  })

  if (!response.ok) {
    throw new Error(t('api.error.siteListFailed'))
  }

  return response.json()
}

export async function getSiteDetail(id: string): Promise<SiteDetailResponse> {
  const response = await fetch(`${API_BASE_URL}/api/sites/${id}`, {
    headers: authHeaders(),
  })

  if (!response.ok) {
    throw new Error(t('api.error.siteLoadFailed'))
  }

  return response.json()
}

export async function createSite(devRequestId: string, siteName: string): Promise<SiteResponse> {
  const response = await fetch(`${API_BASE_URL}/api/sites`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ devRequestId, siteName }),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error || t('api.error.siteCreateFailed'))
  }

  return response.json()
}

export async function redeploySite(id: string): Promise<SiteResponse> {
  const response = await fetch(`${API_BASE_URL}/api/sites/${id}/redeploy`, {
    method: 'POST',
    headers: authHeaders(),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error || t('api.error.siteRedeployFailed'))
  }

  return response.json()
}

export async function deleteSite(id: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/sites/${id}`, {
    method: 'DELETE',
    headers: authHeaders(),
  })

  if (!response.ok) {
    throw new Error(t('api.error.siteDeleteFailed'))
  }
}

export async function getSiteLogs(id: string): Promise<DeploymentLog[]> {
  const response = await fetch(`${API_BASE_URL}/api/sites/${id}/logs`, {
    headers: authHeaders(),
  })

  if (!response.ok) {
    throw new Error(t('api.error.siteLogsFailed'))
  }

  return response.json()
}
