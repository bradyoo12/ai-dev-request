import i18n from '../i18n'
import { getAuthHeaders } from './auth'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

const t = (key: string) => i18n.t(key)

function authHeaders(): Record<string, string> {
  return getAuthHeaders()
}

export interface PreferenceRecord {
  id: number
  category: string
  key: string
  value: string
  confidence: number
  source: string
  detectedAt: string
  updatedAt: string
}

export interface PreferenceListResult {
  preferences: PreferenceRecord[]
  totalCount: number
}

export interface PreferenceSummary {
  summaryText: string
  lastUpdatedAt: string
}

export async function getPreferences(category?: string): Promise<PreferenceListResult> {
  const params = category ? `?category=${encodeURIComponent(category)}` : ''
  const response = await fetch(`${API_BASE_URL}/api/preferences${params}`, {
    headers: authHeaders(),
  })
  if (!response.ok) {
    throw new Error(t('api.error.preferencesFailed'))
  }
  return response.json()
}

export async function setPreference(data: {
  category: string
  key: string
  value: string
  confidence?: number
}): Promise<PreferenceRecord> {
  const response = await fetch(`${API_BASE_URL}/api/preferences`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(data),
  })
  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error || t('api.error.preferenceSetFailed'))
  }
  return response.json()
}

export async function deletePreference(preferenceId: number): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/preferences/${preferenceId}`, {
    method: 'DELETE',
    headers: authHeaders(),
  })
  if (!response.ok) {
    throw new Error(t('api.error.preferenceDeleteFailed'))
  }
}

export async function deleteAllPreferences(): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/preferences`, {
    method: 'DELETE',
    headers: authHeaders(),
  })
  if (!response.ok) {
    throw new Error(t('api.error.preferenceDeleteAllFailed'))
  }
}

export async function getPreferenceSummary(): Promise<PreferenceSummary> {
  const response = await fetch(`${API_BASE_URL}/api/preferences/summary`, {
    headers: authHeaders(),
  })
  if (!response.ok) {
    throw new Error(t('api.error.preferenceSummaryFailed'))
  }
  return response.json()
}

export async function regenerateSummary(): Promise<PreferenceSummary> {
  const response = await fetch(`${API_BASE_URL}/api/preferences/summary/regenerate`, {
    method: 'POST',
    headers: authHeaders(),
  })
  if (!response.ok) {
    throw new Error(t('api.error.preferenceSummaryFailed'))
  }
  return response.json()
}
