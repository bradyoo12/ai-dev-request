import i18n from '../i18n'
import { getAuthHeaders } from './auth'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

const t = (key: string) => i18n.t(key)

function authHeaders(): Record<string, string> {
  return getAuthHeaders()
}

// === TypeScript Interfaces ===

export interface DatabaseBranch {
  id: string
  devRequestId: string
  branchName: string
  sourceBranch: string
  status: string // active, merged, discarded
  schemaVersion: string
  tablesJson?: string | null // JSON string of string[]
  migrationsJson?: string | null // JSON string of string[]
  createdAt: string
  mergedAt?: string | null
  discardedAt?: string | null
}

export interface ModifiedTable {
  tableName: string
  changeDescription: string
}

export interface SchemaDiff {
  branchId: string
  branchName: string
  sourceBranch: string
  schemaVersion: string
  addedTables: string[]
  removedTables: string[]
  modifiedTables: ModifiedTable[]
  unchangedTables: string[]
  pendingMigrations: string[]
}

// === API Functions ===

export async function createDatabaseBranch(projectId: string, branchName: string): Promise<DatabaseBranch> {
  const response = await fetch(`${API_BASE_URL}/api/projects/${projectId}/db/branches`, {
    method: 'POST',
    headers: { ...authHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ branchName }),
  })
  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error || t('api.error.dbBranchCreateFailed'))
  }
  return response.json()
}

export async function listDatabaseBranches(projectId: string): Promise<DatabaseBranch[]> {
  const response = await fetch(`${API_BASE_URL}/api/projects/${projectId}/db/branches`, {
    headers: authHeaders(),
  })
  if (!response.ok) return []
  return response.json()
}

export async function getDatabaseBranch(projectId: string, branchId: string): Promise<DatabaseBranch | null> {
  const response = await fetch(`${API_BASE_URL}/api/projects/${projectId}/db/branches/${branchId}`, {
    headers: authHeaders(),
  })
  if (!response.ok) return null
  return response.json()
}

export async function mergeDatabaseBranch(projectId: string, branchId: string): Promise<DatabaseBranch> {
  const response = await fetch(`${API_BASE_URL}/api/projects/${projectId}/db/branches/${branchId}/merge`, {
    method: 'POST',
    headers: authHeaders(),
  })
  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error || t('api.error.dbBranchMergeFailed'))
  }
  return response.json()
}

export async function discardDatabaseBranch(projectId: string, branchId: string): Promise<DatabaseBranch> {
  const response = await fetch(`${API_BASE_URL}/api/projects/${projectId}/db/branches/${branchId}`, {
    method: 'DELETE',
    headers: authHeaders(),
  })
  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error || t('api.error.dbBranchDiscardFailed'))
  }
  return response.json()
}

export async function getDatabaseBranchDiff(projectId: string, branchId: string): Promise<SchemaDiff | null> {
  const response = await fetch(`${API_BASE_URL}/api/projects/${projectId}/db/branches/${branchId}/diff`, {
    headers: authHeaders(),
  })
  if (!response.ok) return null
  return response.json()
}
