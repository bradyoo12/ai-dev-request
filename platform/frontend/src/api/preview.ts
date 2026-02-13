import { getAuthHeaders } from './auth'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

function authHeaders(): Record<string, string> {
  return getAuthHeaders()
}

// Types

export interface PreviewDeployment {
  id: string
  devRequestId: string
  status: 'Pending' | 'Deploying' | 'Deployed' | 'Expired' | 'Failed' | 'BuildingImage' | 'PushingImage' | 'CreatingContainer'
  previewUrl?: string
  provider: string
  deployedAt?: string
  expiresAt?: string
  createdAt: string
  containerGroupName?: string
  containerName?: string
  region?: string
  resourceGroupName?: string
  port?: number
  imageUri?: string
  fqdn?: string
}

export interface PreviewUrl {
  previewUrl: string
}

// API Functions

export async function deployPreview(projectId: string): Promise<PreviewDeployment> {
  const response = await fetch(`${API_BASE_URL}/api/projects/${projectId}/preview/deploy`, {
    method: 'POST',
    headers: authHeaders(),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error || 'Preview deployment failed')
  }

  return response.json()
}

export async function getPreviewStatus(projectId: string): Promise<PreviewDeployment | null> {
  const response = await fetch(`${API_BASE_URL}/api/projects/${projectId}/preview/status`, {
    headers: authHeaders(),
  })

  if (!response.ok) return null
  return response.json()
}

export async function getPreviewUrl(projectId: string): Promise<string | null> {
  const response = await fetch(`${API_BASE_URL}/api/projects/${projectId}/preview/url`, {
    headers: authHeaders(),
  })

  if (!response.ok) return null
  const data: PreviewUrl = await response.json()
  return data.previewUrl
}

export async function expirePreview(projectId: string): Promise<PreviewDeployment> {
  const response = await fetch(`${API_BASE_URL}/api/projects/${projectId}/preview`, {
    method: 'DELETE',
    headers: authHeaders(),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error || 'Failed to expire preview')
  }

  return response.json()
}

export async function listPreviews(projectId: string): Promise<PreviewDeployment[]> {
  const response = await fetch(`${API_BASE_URL}/api/projects/${projectId}/previews`, {
    headers: authHeaders(),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error || 'Failed to list previews')
  }

  return response.json()
}

export async function getPreviewLogs(projectId: string): Promise<string> {
  const response = await fetch(`${API_BASE_URL}/api/projects/${projectId}/preview/logs`, {
    headers: authHeaders(),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error || 'Failed to fetch logs')
  }

  const data = await response.json()
  return data.logs || ''
}
