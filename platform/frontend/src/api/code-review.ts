import i18n from '../i18n'
import { getAuthHeaders } from './auth'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

const t = (key: string) => i18n.t(key)

function authHeaders(): Record<string, string> {
  return getAuthHeaders()
}

// === TypeScript Interfaces ===

export interface ReviewFinding {
  id: string
  dimension: string // architecture, security, performance, accessibility, maintainability
  severity: string // critical, warning, info
  title: string
  description: string
  file?: string | null
  line?: number | null
  suggestedFix?: string | null
  fixConfidence?: number | null
  originalCode?: string | null
}

export interface CodeQualityReview {
  id: string
  projectId: number
  status: string // pending, reviewing, completed, failed
  architectureScore: number
  securityScore: number
  performanceScore: number
  accessibilityScore: number
  maintainabilityScore: number
  overallScore: number
  findings?: string | null // JSON string of ReviewFinding[]
  criticalCount: number
  warningCount: number
  infoCount: number
  appliedFixes?: string | null // JSON string of string[]
  fixesApplied: number
  reviewVersion: number
  createdAt: string
  completedAt?: string | null
}

export interface ApplyAllFixesRequest {
  severity: string
}

// === API Functions ===

export async function triggerReview(projectId: number): Promise<CodeQualityReview> {
  const response = await fetch(`${API_BASE_URL}/api/projects/${projectId}/review`, {
    method: 'POST',
    headers: authHeaders(),
  })
  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error || t('api.error.triggerReviewFailed'))
  }
  return response.json()
}

export async function getReviewResults(projectId: number): Promise<CodeQualityReview | null> {
  const response = await fetch(`${API_BASE_URL}/api/projects/${projectId}/review/results`, {
    headers: authHeaders(),
  })
  if (!response.ok) return null
  return response.json()
}

export async function getReviewHistory(projectId: number): Promise<CodeQualityReview[]> {
  const response = await fetch(`${API_BASE_URL}/api/projects/${projectId}/review/history`, {
    headers: authHeaders(),
  })
  if (!response.ok) return []
  return response.json()
}

export async function applyFix(projectId: number, findingId: string): Promise<CodeQualityReview> {
  const response = await fetch(`${API_BASE_URL}/api/projects/${projectId}/review/fix/${findingId}`, {
    method: 'POST',
    headers: authHeaders(),
  })
  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error || t('api.error.applyFixFailed'))
  }
  return response.json()
}

export async function applyAllFixes(projectId: number, severity: string): Promise<CodeQualityReview> {
  const response = await fetch(`${API_BASE_URL}/api/projects/${projectId}/review/fix-all`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ severity }),
  })
  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error || t('api.error.applyAllFixesFailed'))
  }
  return response.json()
}
