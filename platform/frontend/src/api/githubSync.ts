import { authFetch } from './auth'

export interface GitHubSyncConfig {
  id: string
  userId: string
  gitHubConnected: boolean
  gitHubUsername: string
  defaultBranch: string
  autoSync: boolean
  syncOnPush: boolean
  syncOnPull: boolean
  conflictResolution: string
  webhookEnabled: boolean
  totalPushes: number
  totalPulls: number
  totalConflicts: number
  totalMerges: number
  syncHistoryJson: string
  connectedReposJson: string
  createdAt: string
  updatedAt: string
}

export interface ConnectedRepo {
  id: string
  name: string
  url: string
  lastSynced: string
  status: string
  branch: string
  commits: number
}

export interface SyncActionResult {
  success: boolean
  action: string
  repoName: string
  commitSha: string
  filesChanged: number
  branch: string
  hasConflict?: boolean
  message: string
  timestamp: string
}

export interface GitHubSyncStats {
  totalPushes: number
  totalPulls: number
  totalConflicts: number
  totalMerges: number
  recentActivity: SyncHistoryEntry[]
}

export interface SyncHistoryEntry {
  action: string
  repoName: string
  commitSha: string
  filesChanged: number
  status: string
  timestamp: string
}

export async function getGitHubSyncConfig(): Promise<GitHubSyncConfig> {
  const res = await authFetch('/api/github-sync/config')
  if (!res.ok) throw new Error('Failed to get GitHub sync config')
  return res.json()
}

export async function updateGitHubSyncConfig(data: Partial<GitHubSyncConfig>): Promise<GitHubSyncConfig> {
  const res = await authFetch('/api/github-sync/config', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error('Failed to update GitHub sync config')
  return res.json()
}

export async function listConnectedRepos(): Promise<ConnectedRepo[]> {
  const res = await authFetch('/api/github-sync/repos')
  if (!res.ok) throw new Error('Failed to list connected repos')
  return res.json()
}

export async function pushToGitHub(repoName?: string): Promise<SyncActionResult> {
  const res = await authFetch('/api/github-sync/push', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ repoName }),
  })
  if (!res.ok) throw new Error('Failed to push to GitHub')
  return res.json()
}

export async function pullFromGitHub(repoName?: string): Promise<SyncActionResult> {
  const res = await authFetch('/api/github-sync/pull', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ repoName }),
  })
  if (!res.ok) throw new Error('Failed to pull from GitHub')
  return res.json()
}

export async function getGitHubSyncStats(): Promise<GitHubSyncStats> {
  const res = await authFetch('/api/github-sync/stats')
  if (!res.ok) throw new Error('Failed to get GitHub sync stats')
  return res.json()
}
