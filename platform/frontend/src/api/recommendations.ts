import i18n from '../i18n'
import { getAuthHeaders } from './auth'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

const t = (key: string) => i18n.t(key)

function authHeaders(): Record<string, string> {
  return getAuthHeaders()
}

export interface AppRecommendation {
  id: number
  title: string
  description: string
  reason: string
  promptTemplate: string
  matchPercent: number
  interestCategory: string
  isDismissed: boolean
  createdAt: string
}

export interface UserInterest {
  id: number
  category: string
  confidence: number
  source: string
  detectedAt: string
}

export async function getRecommendations(): Promise<AppRecommendation[]> {
  const response = await fetch(`${API_BASE_URL}/api/recommendations`, {
    headers: authHeaders(),
  })
  if (!response.ok) {
    throw new Error(t('api.error.recommendationsFailed'))
  }
  return response.json()
}

export async function refreshRecommendations(): Promise<AppRecommendation[]> {
  const response = await fetch(`${API_BASE_URL}/api/recommendations/refresh`, {
    method: 'POST',
    headers: authHeaders(),
  })
  if (!response.ok) {
    throw new Error(t('api.error.recommendationsRefreshFailed'))
  }
  return response.json()
}

export async function dismissRecommendation(id: number): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/recommendations/${id}/dismiss`, {
    method: 'POST',
    headers: authHeaders(),
  })
  if (!response.ok) {
    throw new Error(t('api.error.recommendationDismissFailed'))
  }
}

export async function getInterests(): Promise<UserInterest[]> {
  const response = await fetch(`${API_BASE_URL}/api/recommendations/interests`, {
    headers: authHeaders(),
  })
  if (!response.ok) {
    throw new Error(t('api.error.interestsFailed'))
  }
  return response.json()
}

export async function addInterest(data: { category: string }): Promise<UserInterest> {
  const response = await fetch(`${API_BASE_URL}/api/recommendations/interests`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(data),
  })
  if (!response.ok) {
    throw new Error(t('api.error.interestAddFailed'))
  }
  return response.json()
}

export async function deleteInterest(id: number): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/recommendations/interests/${id}`, {
    method: 'DELETE',
    headers: authHeaders(),
  })
  if (!response.ok) {
    throw new Error(t('api.error.interestDeleteFailed'))
  }
}
