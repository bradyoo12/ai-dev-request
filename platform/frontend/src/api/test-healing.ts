import i18n from '../i18n'
import { getAuthHeaders } from './auth'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

const t = (key: string) => i18n.t(key)

function authHeaders(): Record<string, string> {
  return getAuthHeaders()
}

// === TypeScript Interfaces ===

export interface TestHealingRecord {
  id: string
  projectId: number
  status: string // pending, analyzing, healed, failed, needs_review
  testFilePath: string
  originalSelector: string
  healedSelector: string
  failureReason: string
  healingSummary: string
  confidenceScore: number // 0-100
  locatorStrategy: string // css, xpath, text, role, testid, intent
  diffJson?: string | null
  suggestedFixJson?: string | null
  isApproved: boolean
  isRejected: boolean
  healingVersion: number
  createdAt: string
  healedAt?: string | null
  reviewedAt?: string | null
}

export interface TestHealingRequest {
  testFilePath: string
  originalSelector: string
  failureReason: string
  locatorStrategy?: string
  componentName?: string
  pageContext?: string
  componentDiff?: string
}

export interface TestHealingSettings {
  autoHealEnabled: boolean
  confidenceThreshold: number
  autoApproveHighConfidence: boolean
  notifyOnLowConfidence: boolean
  preferredLocatorStrategy: string
  maxHealingAttempts: number
}

export interface TestHealingStats {
  totalAnalyzed: number
  autoHealed: number
  needsReview: number
  failed: number
  averageConfidence: number
  healingRate: number
}

export interface SuggestedFix {
  selector: string
  assertion: string
  explanation: string
}

export interface DiffInfo {
  before: string
  after: string
  componentName: string
}

// === API Functions ===

export async function analyzeTestFailure(projectId: number, request: TestHealingRequest): Promise<TestHealingRecord> {
  const response = await fetch(`${API_BASE_URL}/api/projects/${projectId}/test-healing/analyze`, {
    method: 'POST',
    headers: { ...authHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  })
  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error || t('api.error.testHealingFailed'))
  }
  return response.json()
}

export async function getHealingHistory(projectId: number): Promise<TestHealingRecord[]> {
  const response = await fetch(`${API_BASE_URL}/api/projects/${projectId}/test-healing/history`, {
    headers: authHeaders(),
  })
  if (!response.ok) return []
  return response.json()
}

export async function getHealingRecord(projectId: number, id: string): Promise<TestHealingRecord | null> {
  const response = await fetch(`${API_BASE_URL}/api/projects/${projectId}/test-healing/${id}`, {
    headers: authHeaders(),
  })
  if (!response.ok) return null
  return response.json()
}

export async function getReviewQueue(projectId: number): Promise<TestHealingRecord[]> {
  const response = await fetch(`${API_BASE_URL}/api/projects/${projectId}/test-healing/review-queue`, {
    headers: authHeaders(),
  })
  if (!response.ok) return []
  return response.json()
}

export async function approveHealing(projectId: number, id: string): Promise<TestHealingRecord | null> {
  const response = await fetch(`${API_BASE_URL}/api/projects/${projectId}/test-healing/${id}/approve`, {
    method: 'POST',
    headers: authHeaders(),
  })
  if (!response.ok) return null
  return response.json()
}

export async function rejectHealing(projectId: number, id: string): Promise<TestHealingRecord | null> {
  const response = await fetch(`${API_BASE_URL}/api/projects/${projectId}/test-healing/${id}/reject`, {
    method: 'POST',
    headers: authHeaders(),
  })
  if (!response.ok) return null
  return response.json()
}

export async function getHealingSettings(projectId: number): Promise<TestHealingSettings> {
  const response = await fetch(`${API_BASE_URL}/api/projects/${projectId}/test-healing/settings`, {
    headers: authHeaders(),
  })
  if (!response.ok) {
    return {
      autoHealEnabled: true,
      confidenceThreshold: 80,
      autoApproveHighConfidence: true,
      notifyOnLowConfidence: true,
      preferredLocatorStrategy: 'intent',
      maxHealingAttempts: 3,
    }
  }
  return response.json()
}

export async function updateHealingSettings(projectId: number, settings: TestHealingSettings): Promise<TestHealingSettings> {
  const response = await fetch(`${API_BASE_URL}/api/projects/${projectId}/test-healing/settings`, {
    method: 'PUT',
    headers: { ...authHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify(settings),
  })
  if (!response.ok) {
    throw new Error(t('api.error.updateSettingsFailed'))
  }
  return response.json()
}

export async function getHealingStats(projectId: number): Promise<TestHealingStats> {
  const response = await fetch(`${API_BASE_URL}/api/projects/${projectId}/test-healing/stats`, {
    headers: authHeaders(),
  })
  if (!response.ok) {
    return { totalAnalyzed: 0, autoHealed: 0, needsReview: 0, failed: 0, averageConfidence: 0, healingRate: 0 }
  }
  return response.json()
}
