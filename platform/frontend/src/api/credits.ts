import i18n from '../i18n'
import { getAuthHeaders } from './auth'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

const t = (key: string) => i18n.t(key)

function authHeaders(): Record<string, string> {
  return getAuthHeaders()
}

export interface CreditPackage {
  id: number
  name: string
  price: number
  credits: number
  isPopular: boolean
}

export interface CreditPackagesResponse {
  currency: string
  exchangeRate: number
  rateUpdatedAt: string
  packages: CreditPackage[]
}

export interface CreditBalance {
  balance: number
  totalEarned: number
  totalSpent: number
  valueUsd?: number
}

export interface CreditTransaction {
  id: number
  type: string
  amount: number
  action: string
  description: string
  balanceAfter: number
  createdAt: string
}

export interface ExchangeRate {
  currencyCode: string
  rateToUsd: number
  fetchedAt: string
}

export async function getCreditPackages(currency?: string): Promise<CreditPackagesResponse> {
  const params = currency ? `?currency=${encodeURIComponent(currency)}` : ''
  const response = await fetch(`${API_BASE_URL}/api/credits/packages${params}`, {
    headers: authHeaders(),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error || t('api.error.creditPackagesFailed'))
  }

  return response.json()
}

export async function getCreditBalance(): Promise<CreditBalance> {
  const response = await fetch(`${API_BASE_URL}/api/credits/balance`, {
    headers: authHeaders(),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error || t('api.error.creditBalanceFailed'))
  }

  return response.json()
}

export async function getCreditHistory(): Promise<CreditTransaction[]> {
  const response = await fetch(`${API_BASE_URL}/api/credits/history`, {
    headers: authHeaders(),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error || t('api.error.creditHistoryFailed'))
  }

  return response.json()
}

export async function getExchangeRates(): Promise<ExchangeRate[]> {
  const response = await fetch(`${API_BASE_URL}/api/credits/exchange-rates`, {
    headers: authHeaders(),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error || t('api.error.exchangeRatesFailed'))
  }

  return response.json()
}

export async function createCreditCheckout(
  packageId: number,
  currency: string
): Promise<{ checkoutUrl: string; isSimulation: boolean }> {
  const response = await fetch(`${API_BASE_URL}/api/credits/checkout`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ packageId, currency }),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error || t('api.error.creditCheckoutFailed'))
  }

  return response.json()
}
