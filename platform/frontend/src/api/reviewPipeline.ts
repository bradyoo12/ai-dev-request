import i18n from '../i18n'
import { authFetch } from './auth'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'
const t = (key: string) => i18n.t(key)

// === TypeScript Interfaces ===

export interface ReviewPipelineConfig {
  id: string
  autoReviewEnabled: boolean
  securityCheckEnabled: boolean
  performanceCheckEnabled: boolean
  accessibilityCheckEnabled: boolean
  architectureCheckEnabled: boolean
  maintainabilityCheckEnabled: boolean
  autoFixEnabled: boolean
  testGenerationEnabled: boolean
  qualityThreshold: number
  totalReviews: number
  totalAutoFixes: number
  totalTestsGenerated: number
  avgQualityScore: number
  createdAt: string
  updatedAt: string
}

export interface ReviewFinding {
  id: string
  dimension: string
  severity: string
  title: string
  description: string
  file?: string | null
  line: number
  suggestedFix?: string | null
  autoFixApplied: boolean
}

export interface ReviewResult {
  reviewId: string
  projectName: string
  status: string
  securityScore: number
  performanceScore: number
  accessibilityScore: number
  architectureScore: number
  maintainabilityScore: number
  overallScore: number
  findings: ReviewFinding[]
  autoFixCount: number
  testsGenerated: number
  passesThreshold: boolean
  qualityThreshold: number
  reviewedAt: string
}

export interface ReviewDimension {
  id: string
  name: string
  description: string
  icon: string
}

export interface ReviewHistoryEntry {
  reviewId: string
  projectName: string
  overallScore: number
  findingsCount: number
  autoFixCount: number
  testsGenerated: number
  passedThreshold: boolean
  reviewedAt: string
}

export interface ReviewPipelineStats {
  totalReviews: number
  totalAutoFixes: number
  totalTestsGenerated: number
  avgQualityScore: number
  qualityThreshold: number
  passRate: number
  recentReviews: ReviewHistoryEntry[]
}

// === API Functions ===

export async function getReviewPipelineConfig(): Promise<ReviewPipelineConfig> {
  const response = await authFetch(`${API_BASE_URL}/api/review-pipeline/config`)
  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error || t('api.error.reviewPipelineConfigLoad'))
  }
  return response.json()
}

export async function updateReviewPipelineConfig(data: Partial<ReviewPipelineConfig>): Promise<ReviewPipelineConfig> {
  const response = await authFetch(`${API_BASE_URL}/api/review-pipeline/config`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error || t('api.error.reviewPipelineConfigUpdate'))
  }
  return response.json()
}

export async function triggerPipelineReview(projectName: string): Promise<ReviewResult> {
  const response = await authFetch(`${API_BASE_URL}/api/review-pipeline/review`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ projectName }),
  })
  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error || t('api.error.reviewPipelineReviewFailed'))
  }
  return response.json()
}

export async function getReviewResults(reviewId: string): Promise<ReviewHistoryEntry | null> {
  const response = await authFetch(`${API_BASE_URL}/api/review-pipeline/results/${reviewId}`)
  if (!response.ok) return null
  return response.json()
}

export async function getReviewDimensions(): Promise<ReviewDimension[]> {
  const response = await authFetch(`${API_BASE_URL}/api/review-pipeline/dimensions`)
  if (!response.ok) return []
  return response.json()
}

export async function getReviewPipelineStats(): Promise<ReviewPipelineStats> {
  const response = await authFetch(`${API_BASE_URL}/api/review-pipeline/stats`)
  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error || t('api.error.reviewPipelineStatsLoad'))
  }
  return response.json()
}
