import i18n from '../i18n'
import { getAuthHeaders } from './auth'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

const t = (key: string) => i18n.t(key)

function authHeaders(): Record<string, string> {
  return getAuthHeaders()
}

// === TypeScript Interfaces ===

export interface GitHubSync {
  id: string
  projectId: number
  gitHubRepoOwner: string
  gitHubRepoName: string
  gitHubRepoUrl: string
  branch: string
  status: string // disconnected, connected, syncing, synced, conflict, error
  lastSyncCommitSha?: string | null
  conflictDetails?: string | null
  createdAt: string
  lastSyncedAt?: string | null
  lastPushAt?: string | null
  lastPullAt?: string | null
}

export interface ConnectRepoRequest {
  repoOwner: string
  repoName: string
}

export interface SyncHistory {
  action: string
  status: string
  commitSha?: string | null
  timestamp: string
  details?: string | null
}

// === API Functions ===

export async function connectRepo(projectId: number, request: ConnectRepoRequest): Promise<GitHubSync> {
  const response = await fetch(`${API_BASE_URL}/api/projects/${projectId}/github/connect`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(request),
  })
  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error || t('api.error.connectRepoFailed'))
  }
  return response.json()
}

export async function disconnectRepo(projectId: number): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/projects/${projectId}/github/disconnect`, {
    method: 'DELETE',
    headers: authHeaders(),
  })
  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error || t('api.error.disconnectRepoFailed'))
  }
}

export async function pushToRepo(projectId: number): Promise<GitHubSync> {
  const response = await fetch(`${API_BASE_URL}/api/projects/${projectId}/github/push`, {
    method: 'POST',
    headers: authHeaders(),
  })
  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error || t('api.error.pushFailed'))
  }
  return response.json()
}

export async function pullFromRepo(projectId: number): Promise<GitHubSync> {
  const response = await fetch(`${API_BASE_URL}/api/projects/${projectId}/github/pull`, {
    method: 'POST',
    headers: authHeaders(),
  })
  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error || t('api.error.pullFailed'))
  }
  return response.json()
}

export async function getSyncStatus(projectId: number): Promise<GitHubSync | null> {
  const response = await fetch(`${API_BASE_URL}/api/projects/${projectId}/github/status`, {
    headers: authHeaders(),
  })
  if (!response.ok) return null
  return response.json()
}

export async function resolveConflicts(projectId: number, resolution: string): Promise<GitHubSync> {
  const response = await fetch(`${API_BASE_URL}/api/projects/${projectId}/github/resolve`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ resolution }),
  })
  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error || t('api.error.resolveConflictsFailed'))
  }
  return response.json()
}

export async function getSyncHistory(projectId: number): Promise<SyncHistory[]> {
  const response = await fetch(`${API_BASE_URL}/api/projects/${projectId}/github/history`, {
    headers: authHeaders(),
  })
  if (!response.ok) return []
  return response.json()
}
