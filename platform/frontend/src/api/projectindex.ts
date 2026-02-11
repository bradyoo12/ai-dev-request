import i18n from '../i18n'
import { authFetch } from './auth'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'
const t = (key: string) => i18n.t(key)

export interface ProjectIndexSummary {
  projectId: string
  totalFiles: number
  indexedFiles: number
  staleFiles: number
  userModifiedFiles: number
  totalSizeBytes: number
  languages: string[]
  lastIndexedAt: string | null
}

export interface ProjectIndexFile {
  id: string
  filePath: string
  language: string
  fileSize: number
  contentHash: string
  summary: string | null
  exportedSymbols: string | null
  isIndexed: boolean
  isUserModified: boolean
  needsReindex: boolean
  dependencyCount: number
  dependentCount: number
  indexedAt: string
}

export interface DependencyEdge {
  from: string
  to: string
}

export async function getProjectIndexSummary(projectId: string): Promise<ProjectIndexSummary> {
  const response = await authFetch(`${API_BASE_URL}/api/project-index/summary/${projectId}`)
  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error || t('api.error.projectIndexSummaryLoad'))
  }
  return response.json()
}

export async function getProjectIndexFiles(projectId: string): Promise<ProjectIndexFile[]> {
  const response = await authFetch(`${API_BASE_URL}/api/project-index/files/${projectId}`)
  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error || t('api.error.projectIndexFilesLoad'))
  }
  return response.json()
}

export async function retrieveContext(projectId: string, query: string, topK: number = 10): Promise<ProjectIndexFile[]> {
  const response = await authFetch(`${API_BASE_URL}/api/project-index/retrieve`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ projectId, query, topK }),
  })
  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error || t('api.error.projectIndexRetrieve'))
  }
  return response.json()
}

export async function getDependencyGraph(projectId: string): Promise<DependencyEdge[]> {
  const response = await authFetch(`${API_BASE_URL}/api/project-index/dependencies/${projectId}`)
  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error || t('api.error.projectIndexDeps'))
  }
  return response.json()
}

export async function markFilesStale(projectId: string, filePaths: string[]): Promise<{ updated: number }> {
  const response = await authFetch(`${API_BASE_URL}/api/project-index/mark-stale`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ projectId, filePaths }),
  })
  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error || t('api.error.projectIndexMarkStale'))
  }
  return response.json()
}
