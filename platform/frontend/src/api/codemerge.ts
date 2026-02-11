import i18n from '../i18n'
import { authFetch } from './auth'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'
const t = (key: string) => i18n.t(key)

export interface CodeSnapshot {
  id: string
  devRequestId: string
  filePath: string
  baselineContent: string
  userContent?: string
  isLocked: boolean
  version: number
  status: string
  hasUserChanges: boolean
  createdAt: string
  updatedAt: string
}

export interface MergeStats {
  totalFiles: number
  syncedFiles: number
  modifiedFiles: number
  conflictedFiles: number
  mergedFiles: number
  lockedFiles: number
}

export async function listSnapshots(devRequestId?: string): Promise<CodeSnapshot[]> {
  const params = devRequestId ? `?devRequestId=${devRequestId}` : ''
  const response = await authFetch(`${API_BASE_URL}/api/codemerge/snapshots${params}`)
  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error || t('api.error.codeMergeLoad'))
  }
  return response.json()
}

export async function getSnapshot(id: string): Promise<CodeSnapshot> {
  const response = await authFetch(`${API_BASE_URL}/api/codemerge/snapshots/${id}`)
  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error || t('api.error.codeMergeLoad'))
  }
  return response.json()
}

export async function updateUserContent(id: string, content: string | null): Promise<CodeSnapshot> {
  const response = await authFetch(`${API_BASE_URL}/api/codemerge/snapshots/${id}/user-content`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content }),
  })
  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error || t('api.error.codeMergeUpdate'))
  }
  return response.json()
}

export async function toggleLock(id: string, locked: boolean): Promise<CodeSnapshot> {
  const response = await authFetch(`${API_BASE_URL}/api/codemerge/snapshots/${id}/lock`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ locked }),
  })
  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error || t('api.error.codeMergeUpdate'))
  }
  return response.json()
}

export async function resolveConflict(id: string, resolution: string, mergedContent?: string): Promise<CodeSnapshot> {
  const response = await authFetch(`${API_BASE_URL}/api/codemerge/snapshots/${id}/resolve`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ resolution, mergedContent }),
  })
  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error || t('api.error.codeMergeResolve'))
  }
  return response.json()
}

export async function getMergeStats(devRequestId?: string): Promise<MergeStats> {
  const params = devRequestId ? `?devRequestId=${devRequestId}` : ''
  const response = await authFetch(`${API_BASE_URL}/api/codemerge/stats${params}`)
  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error || t('api.error.codeMergeLoad'))
  }
  return response.json()
}
