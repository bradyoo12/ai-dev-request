import i18n from '../i18n'
import { getAuthHeaders } from './auth'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

const t = (key: string) => i18n.t(key)

function authHeaders(): Record<string, string> {
  return getAuthHeaders()
}

export interface Referral {
  id: string
  referralCode: string
  status: string
  referredUserId: string | null
  signupCreditAmount: number
  paymentBonusPercent: number
  totalCreditsEarned: number
  createdAt: string
  signedUpAt: string | null
  convertedAt: string | null
}

export interface ReferralStats {
  totalInvited: number
  totalSignedUp: number
  totalConverted: number
  totalCreditsEarned: number
}

export interface ReferralValidation {
  valid: boolean
  code: string
}

export async function getReferrals(): Promise<Referral[]> {
  const response = await fetch(`${API_BASE_URL}/api/referrals`, {
    headers: authHeaders(),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error || t('api.error.referralsFailed'))
  }

  return response.json()
}

export async function generateReferralCode(): Promise<Referral> {
  const response = await fetch(`${API_BASE_URL}/api/referrals/generate`, {
    method: 'POST',
    headers: authHeaders(),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error || t('api.error.referralGenerateFailed'))
  }

  return response.json()
}

export async function validateReferralCode(code: string): Promise<ReferralValidation> {
  const response = await fetch(`${API_BASE_URL}/api/referrals/code/${encodeURIComponent(code)}`, {
    headers: { 'Content-Type': 'application/json' },
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error || t('api.error.referralValidateFailed'))
  }

  return response.json()
}

export async function getReferralStats(): Promise<ReferralStats> {
  const response = await fetch(`${API_BASE_URL}/api/referrals/stats`, {
    headers: authHeaders(),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error || t('api.error.referralStatsFailed'))
  }

  return response.json()
}
