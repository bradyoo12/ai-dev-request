import i18n from '../i18n'
import { getAuthHeaders } from './auth'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'
const t = (key: string) => i18n.t(key)

export interface ProjectVersion {
  id: string
  projectId: string
  versionNumber: number
  label: string
  source: string
  fileCount: number
  changedFiles: string[]
  createdAt: string
}

export interface VersionDiff {
  fromVersionId: string
  toVersionId: string
  fromVersionNumber: number
  toVersionNumber: number
  addedFiles: string[]
  removedFiles: string[]
  modifiedFiles: string[]
  totalChanges: number
}

function authHeaders(): Record<string, string> {
  return getAuthHeaders()
}

export async function getVersions(projectId: string): Promise<ProjectVersion[]> {
  const response = await fetch(`${API_BASE_URL}/api/projects/${projectId}/versions`, {
    headers: authHeaders(),
  })
  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error || t('versionHistory.error.loadFailed'))
  }
  return response.json()
}

export async function getVersion(projectId: string, versionId: string): Promise<ProjectVersion> {
  const response = await fetch(`${API_BASE_URL}/api/projects/${projectId}/versions/${versionId}`, {
    headers: authHeaders(),
  })
  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error || t('versionHistory.error.loadFailed'))
  }
  return response.json()
}

export async function getLatestVersion(projectId: string): Promise<ProjectVersion | null> {
  const response = await fetch(`${API_BASE_URL}/api/projects/${projectId}/versions/latest`, {
    headers: authHeaders(),
  })
  if (response.status === 404) return null
  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error || t('versionHistory.error.loadFailed'))
  }
  return response.json()
}

export async function getDiff(projectId: string, fromId: string, toId: string): Promise<VersionDiff> {
  const response = await fetch(`${API_BASE_URL}/api/projects/${projectId}/versions/${fromId}/diff/${toId}`, {
    headers: authHeaders(),
  })
  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error || t('versionHistory.error.diffFailed'))
  }
  return response.json()
}

export async function rollbackToVersion(projectId: string, versionId: string): Promise<ProjectVersion> {
  const response = await fetch(`${API_BASE_URL}/api/projects/${projectId}/versions/${versionId}/rollback`, {
    method: 'POST',
    headers: authHeaders(),
  })
  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error || t('versionHistory.error.rollbackFailed'))
  }
  return response.json()
}
