import i18n from '../i18n'
import { authFetch } from './auth'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'
const t = (key: string) => i18n.t(key)

export interface DevRequestBranch {
  id: string
  devRequestId: string
  branchName: string
  baseBranch: string
  status: string
  lastSyncedCommitSha?: string
  lastLocalCommitSha?: string
  totalCommits: number
  totalSyncs: number
  hasPullRequest: boolean
  pullRequestUrl?: string
  pullRequestNumber?: number
  previewUrl?: string
  lastPushedAt?: string
  lastPulledAt?: string
  lastSyncedAt?: string
  mergedAt?: string
  createdAt: string
  updatedAt: string
}

export interface CreateBranchRequest {
  devRequestId: string
  branchName?: string
}

export interface AutoCommitRequest {
  branchId: string
  commitMessage: string
  changedFiles: string[]
}

export interface CommitResult {
  success: boolean
  commitSha: string
  message: string
  filesChanged: number
}

export interface SyncRequest {
  branchId: string
}

export interface SyncResult {
  success: boolean
  direction: string
  changedFiles: string[]
  commitSha?: string
}

export interface CreatePullRequestRequest {
  branchId: string
  title: string
  description?: string
}

export interface PullRequestResult {
  success: boolean
  pullRequestUrl: string
  pullRequestNumber: number
  alreadyExists: boolean
}

export interface CommitHistoryEntry {
  sha: string
  message: string
  timestamp: string
  author: string
  filesChanged: string[]
}

export async function getOrCreateBranch(devRequestId: string): Promise<DevRequestBranch> {
  const response = await authFetch(`${API_BASE_URL}/api/git-branch/${devRequestId}`)
  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error || t('api.error.branchLoad'))
  }
  return response.json()
}

export async function createBranch(data: CreateBranchRequest): Promise<DevRequestBranch> {
  const response = await authFetch(`${API_BASE_URL}/api/git-branch/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error || t('api.error.branchCreate'))
  }
  return response.json()
}

export async function autoCommit(data: AutoCommitRequest): Promise<CommitResult> {
  const response = await authFetch(`${API_BASE_URL}/api/git-branch/commit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error || t('api.error.branchCommit'))
  }
  return response.json()
}

export async function syncFromRemote(branchId: string): Promise<SyncResult> {
  const response = await authFetch(`${API_BASE_URL}/api/git-branch/sync/pull`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ branchId }),
  })
  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error || t('api.error.branchSyncPull'))
  }
  return response.json()
}

export async function syncToRemote(branchId: string): Promise<SyncResult> {
  const response = await authFetch(`${API_BASE_URL}/api/git-branch/sync/push`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ branchId }),
  })
  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error || t('api.error.branchSyncPush'))
  }
  return response.json()
}

export async function createPullRequest(data: CreatePullRequestRequest): Promise<PullRequestResult> {
  const response = await authFetch(`${API_BASE_URL}/api/git-branch/pull-request`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error || t('api.error.branchPullRequest'))
  }
  return response.json()
}

export async function getCommitHistory(branchId: string): Promise<CommitHistoryEntry[]> {
  const response = await authFetch(`${API_BASE_URL}/api/git-branch/${branchId}/commits`)
  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error || t('api.error.branchCommitHistory'))
  }
  return response.json()
}

export async function markBranchAsMerged(branchId: string): Promise<void> {
  const response = await authFetch(`${API_BASE_URL}/api/git-branch/${branchId}/merge`, {
    method: 'POST',
  })
  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error || t('api.error.branchMarkMerged'))
  }
}
