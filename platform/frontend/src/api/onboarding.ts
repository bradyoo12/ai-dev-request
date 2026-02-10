import i18n from '../i18n'
import { getAuthHeaders } from './auth'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'
const t = (key: string) => i18n.t(key)

export interface OnboardingProgress {
  id: number
  userId: string
  currentStep: number
  completedSteps: string[]
  status: string
  startedAt: string
  completedAt: string | null
  updatedAt: string
}

function authHeaders(): Record<string, string> {
  return getAuthHeaders()
}

export async function getProgress(): Promise<OnboardingProgress> {
  const response = await fetch(`${API_BASE_URL}/api/onboarding/progress`, {
    headers: authHeaders(),
  })
  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error || t('onboarding.error.loadFailed'))
  }
  return response.json()
}

export async function completeStep(step: string): Promise<OnboardingProgress> {
  const response = await fetch(`${API_BASE_URL}/api/onboarding/step/${step}`, {
    method: 'POST',
    headers: authHeaders(),
  })
  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error || t('onboarding.error.stepFailed'))
  }
  return response.json()
}

export async function skipOnboarding(): Promise<OnboardingProgress> {
  const response = await fetch(`${API_BASE_URL}/api/onboarding/skip`, {
    method: 'POST',
    headers: authHeaders(),
  })
  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error || t('onboarding.error.skipFailed'))
  }
  return response.json()
}

export async function resetOnboarding(): Promise<OnboardingProgress> {
  const response = await fetch(`${API_BASE_URL}/api/onboarding/reset`, {
    method: 'POST',
    headers: authHeaders(),
  })
  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error || t('onboarding.error.resetFailed'))
  }
  return response.json()
}
