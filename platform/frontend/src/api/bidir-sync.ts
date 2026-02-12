import i18n from '../i18n'
import { authFetch } from './auth'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'
const t = (key: string) => i18n.t(key)

export interface BidirectionalGitSyncConfig {
  id: string
  userId: string
  devRequestId: number
  projectName: string
  repoOwner: string
  repoName: string
  defaultBranch: string
  aiBranch: string
  syncEnabled: boolean
  autoPushEnabled: boolean
  autoPullEnabled: boolean
  webhookEnabled: boolean
  status: string
  lastPushAt?: string
  lastPullAt?: string
  lastSyncAt?: string
  totalPushes: number
  totalPulls: number
  totalConflicts: number
  conflictsResolved: number
  aheadCount: number
  behindCount: number
  changedFilesCount: number
  conflictFiles: string[]
  webhookUrl?: string
  createdAt: string
  updatedAt: string
}

export interface UpdateBidirSyncConfig {
  repoOwner?: string
  repoName?: string
  defaultBranch?: string
  aiBranch?: string
  syncEnabled?: boolean
  autoPushEnabled?: boolean
  autoPullEnabled?: boolean
  webhookEnabled?: boolean
}

export interface PushResult {
  commitSha: string
  repoUrl: string
  filesCount: number
  branch: string
  pushedAt: string
}

export interface PullResult {
  changedFiles: string[]
  conflictFiles: string[]
  hasConflicts: boolean
  pulledAt: string
}

export interface SyncHistoryEntry {
  operation: string
  timestamp: string
  files: number
  status: string
  commitSha: string
}

export interface BidirSyncStats {
  totalSyncs: number
  totalPushes: number
  totalPulls: number
  totalConflicts: number
  conflictsResolved: number
  connectedRepos: number
  status: string
}

export async function getBidirSyncConfig(projectId: number): Promise<BidirectionalGitSyncConfig> {
  const response = await authFetch(`${API_BASE_URL}/api/bidir-sync/config/${projectId}`)
  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error || t('api.error.bidirSyncConfigLoad'))
  }
  return response.json()
}

export async function updateBidirSyncConfig(projectId: number, data: UpdateBidirSyncConfig): Promise<BidirectionalGitSyncConfig> {
  const response = await authFetch(`${API_BASE_URL}/api/bidir-sync/config/${projectId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error || t('api.error.bidirSyncConfigUpdate'))
  }
  return response.json()
}

export async function pushToGitHub(projectId: number): Promise<PushResult> {
  const response = await authFetch(`${API_BASE_URL}/api/bidir-sync/push`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ projectId }),
  })
  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error || t('api.error.bidirSyncPush'))
  }
  return response.json()
}

export async function pullFromGitHub(projectId: number): Promise<PullResult> {
  const response = await authFetch(`${API_BASE_URL}/api/bidir-sync/pull`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ projectId }),
  })
  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error || t('api.error.bidirSyncPull'))
  }
  return response.json()
}

export async function getBidirSyncStatus(projectId: number): Promise<BidirectionalGitSyncConfig> {
  const response = await authFetch(`${API_BASE_URL}/api/bidir-sync/status/${projectId}`)
  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error || t('api.error.bidirSyncStatus'))
  }
  return response.json()
}

export async function getBidirSyncHistory(projectId: number): Promise<SyncHistoryEntry[]> {
  const response = await authFetch(`${API_BASE_URL}/api/bidir-sync/history/${projectId}`)
  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error || t('api.error.bidirSyncHistory'))
  }
  return response.json()
}

export async function getBidirSyncStats(): Promise<BidirSyncStats> {
  const response = await authFetch(`${API_BASE_URL}/api/bidir-sync/stats`)
  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error || t('api.error.bidirSyncStats'))
  }
  return response.json()
}
