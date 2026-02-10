import { getAuthHeaders } from './auth'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

function authHeaders(): Record<string, string> {
  return getAuthHeaders()
}

// Types

export interface FileSpec {
  path: string
  content?: string
  description?: string
}

export interface ManifestFile {
  path: string
  language: string
  size: number
  description: string
  exports: string[]
  imports: string[]
}

export interface CrossReference {
  sourceFile: string
  targetFile: string
  referenceType: string
  symbol: string
}

export interface ValidationIssue {
  rule: string
  status: string
  message: string
  affectedFiles: string[]
  suggestion?: string
}

export interface ManifestResponse {
  id: string
  devRequestId: string
  filesJson: string
  crossReferencesJson: string
  validationResultsJson: string
  validationStatus: string
  fileCount: number
  crossReferenceCount: number
  issueCount: number
  createdAt: string
  updatedAt: string
}

export interface GeneratedFileInfo {
  path: string
  language: string
  size: number
  description: string
  exportCount: number
  importCount: number
  dependencyCount: number
  dependentCount: number
}

// API Functions

export async function createManifest(projectId: string, files: FileSpec[]): Promise<ManifestResponse> {
  const response = await fetch(`${API_BASE_URL}/api/projects/${projectId}/generation/manifest`, {
    method: 'POST',
    headers: { ...authHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ files }),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error || 'Failed to create manifest')
  }

  return response.json()
}

export async function getManifest(projectId: string): Promise<ManifestResponse | null> {
  const response = await fetch(`${API_BASE_URL}/api/projects/${projectId}/generation/manifest`, {
    headers: authHeaders(),
  })

  if (!response.ok) return null
  return response.json()
}

export async function validateConsistency(projectId: string): Promise<ManifestResponse> {
  const response = await fetch(`${API_BASE_URL}/api/projects/${projectId}/generation/validate`, {
    method: 'POST',
    headers: authHeaders(),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error || 'Validation failed')
  }

  return response.json()
}

export async function resolveConflicts(projectId: string): Promise<ManifestResponse> {
  const response = await fetch(`${API_BASE_URL}/api/projects/${projectId}/generation/resolve`, {
    method: 'POST',
    headers: authHeaders(),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error || 'Conflict resolution failed')
  }

  return response.json()
}

export async function getGeneratedFiles(projectId: string): Promise<GeneratedFileInfo[]> {
  const response = await fetch(`${API_BASE_URL}/api/projects/${projectId}/generation/files`, {
    headers: authHeaders(),
  })

  if (!response.ok) return []
  return response.json()
}
