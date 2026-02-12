import i18n from '../i18n'
import { getAuthHeaders } from './auth'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

const t = (key: string) => i18n.t(key)

function authHeaders(): Record<string, string> {
  return getAuthHeaders()
}

// === TypeScript Interfaces ===

export interface HealedTestDetail {
  testName: string
  filePath: string
  originalCode: string
  fixedCode: string
  confidence: number
  reason: string
}

export interface FailedTestDetail {
  testName: string
  filePath: string
  errorMessage: string
  stackTrace: string
}

export interface SelfHealingTestResult {
  id: string
  devRequestId: string
  status: string // pending, analyzing, completed, failed
  totalTests: number
  failedTests: number
  healedTests: number
  skippedTests: number
  confidenceScore: number
  healedTestsJson?: string | null // JSON string of HealedTestDetail[]
  failedTestDetailsJson?: string | null // JSON string of FailedTestDetail[]
  analysisVersion: number
  createdAt: string
  updatedAt?: string | null
}

// === API Functions ===

export async function triggerSelfHealing(projectId: string): Promise<SelfHealingTestResult> {
  const response = await fetch(`${API_BASE_URL}/api/projects/${projectId}/tests/heal`, {
    method: 'POST',
    headers: authHeaders(),
  })
  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error || t('api.error.selfHealingFailed'))
  }
  return response.json()
}

export async function getSelfHealingResults(projectId: string): Promise<SelfHealingTestResult | null> {
  const response = await fetch(`${API_BASE_URL}/api/projects/${projectId}/tests/heal/results`, {
    headers: authHeaders(),
  })
  if (!response.ok) return null
  return response.json()
}

export async function getSelfHealingHistory(projectId: string): Promise<SelfHealingTestResult[]> {
  const response = await fetch(`${API_BASE_URL}/api/projects/${projectId}/tests/heal/history`, {
    headers: authHeaders(),
  })
  if (!response.ok) return []
  return response.json()
}
