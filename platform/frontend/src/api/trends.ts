import i18n from '../i18n'
import { getAuthHeaders } from './auth'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

const t = (key: string) => i18n.t(key)

function authHeaders(): Record<string, string> {
  return getAuthHeaders()
}

export interface TrendReport {
  id: number
  analyzedAt: string
  category: string
  summaryJson: string
  trendCount: number
}

export interface TrendItem {
  Title: string
  Description: string
  Impact: string
  Link: string
}

export interface ProjectReview {
  id: number
  devRequestId: number
  projectName: string
  reviewedAt: string
  healthScore: number
  findingsJson?: string
  criticalCount: number
  highCount: number
  mediumCount: number
  lowCount: number
}

export interface UpdateRecommendationItem {
  id: number
  category: string
  severity: string
  title: string
  description: string
  currentVersion: string | null
  recommendedVersion: string | null
  effortEstimate: string
  status: string
  createdAt: string
}

export async function getTrendReports(category?: string): Promise<TrendReport[]> {
  const params = category ? `?category=${encodeURIComponent(category)}` : ''
  const response = await fetch(`${API_BASE_URL}/api/trends/reports${params}`, {
    headers: authHeaders(),
  })
  if (!response.ok) throw new Error(t('api.error.trendsFailed'))
  return response.json()
}

export async function generateTrendReport(category: string): Promise<TrendReport> {
  const response = await fetch(`${API_BASE_URL}/api/trends/reports/generate`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ category }),
  })
  if (!response.ok) throw new Error(t('api.error.trendsGenerateFailed'))
  return response.json()
}

export async function getUserReviews(): Promise<ProjectReview[]> {
  const response = await fetch(`${API_BASE_URL}/api/trends/reviews`, {
    headers: authHeaders(),
  })
  if (!response.ok) throw new Error(t('api.error.reviewsFailed'))
  return response.json()
}

export async function reviewProject(devRequestId: number): Promise<ProjectReview> {
  const response = await fetch(`${API_BASE_URL}/api/trends/reviews/${devRequestId}`, {
    method: 'POST',
    headers: authHeaders(),
  })
  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error || t('api.error.reviewFailed'))
  }
  return response.json()
}

export async function getRecommendations(reviewId: number): Promise<UpdateRecommendationItem[]> {
  const response = await fetch(`${API_BASE_URL}/api/trends/reviews/${reviewId}/recommendations`, {
    headers: authHeaders(),
  })
  if (!response.ok) throw new Error(t('api.error.recsFailed'))
  return response.json()
}

export async function updateRecommendationStatus(id: number, status: string): Promise<UpdateRecommendationItem> {
  const response = await fetch(`${API_BASE_URL}/api/trends/recommendations/${id}/status`, {
    method: 'PATCH',
    headers: authHeaders(),
    body: JSON.stringify({ status }),
  })
  if (!response.ok) throw new Error(t('api.error.recsUpdateFailed'))
  return response.json()
}
