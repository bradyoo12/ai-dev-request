import i18n from '../i18n'
import { getAuthHeaders } from './auth'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

const t = (key: string) => i18n.t(key)

function authHeaders(): Record<string, string> {
  return getAuthHeaders()
}

// === TypeScript Interfaces ===

export interface TestFileInfo {
  path: string
  testCount: number
  type: string // unit, integration, e2e
  content?: string
}

export interface TestGenerationRecord {
  id: string
  projectId: number
  status: string // pending, generating, completed, failed
  testFilesGenerated: number
  totalTestCount: number
  coverageEstimate: number
  testFramework: string
  summary: string
  testFilesJson?: string | null // JSON string of TestFileInfo[]
  generationVersion: number
  createdAt: string
  completedAt?: string | null
}

// === API Functions ===

export async function triggerTestGeneration(projectId: number): Promise<TestGenerationRecord> {
  const response = await fetch(`${API_BASE_URL}/api/projects/${projectId}/tests/generate`, {
    method: 'POST',
    headers: authHeaders(),
  })
  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error || t('api.error.testGenerationFailed'))
  }
  return response.json()
}

export async function getTestResults(projectId: number): Promise<TestGenerationRecord | null> {
  const response = await fetch(`${API_BASE_URL}/api/projects/${projectId}/tests/results`, {
    headers: authHeaders(),
  })
  if (!response.ok) return null
  return response.json()
}

export async function getTestHistory(projectId: number): Promise<TestGenerationRecord[]> {
  const response = await fetch(`${API_BASE_URL}/api/projects/${projectId}/tests/history`, {
    headers: authHeaders(),
  })
  if (!response.ok) return []
  return response.json()
}
