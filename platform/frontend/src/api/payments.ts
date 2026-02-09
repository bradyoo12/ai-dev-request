import i18n from '../i18n'
import { getAuthHeaders } from './auth'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

const t = (key: string) => i18n.t(key)

function authHeaders(): Record<string, string> {
  return getAuthHeaders()
}

export interface PaymentRecord {
  id: number
  type: string
  provider: string
  amountUsd: number
  currency: string
  status: string
  description?: string
  tokensAwarded?: number
  cryptoCurrency?: string
  cryptoTransactionHash?: string
  createdAt: string
}

export interface PaymentHistoryResult {
  payments: PaymentRecord[]
  totalCount: number
  page: number
  pageSize: number
}

export interface CheckoutResult {
  checkoutUrl: string
  isSimulation: boolean
}

export async function createCheckout(
  packageId: number,
  successUrl?: string,
  cancelUrl?: string,
  paymentMethod: 'stripe' | 'crypto' = 'stripe'
): Promise<CheckoutResult> {
  const response = await fetch(`${API_BASE_URL}/api/payments/checkout`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ packageId, successUrl, cancelUrl, paymentMethod }),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error || t('api.error.checkoutFailed'))
  }

  return response.json()
}

export async function getPaymentHistory(
  page = 1,
  pageSize = 20
): Promise<PaymentHistoryResult> {
  const response = await fetch(
    `${API_BASE_URL}/api/payments/history?page=${page}&pageSize=${pageSize}`,
    { headers: authHeaders() }
  )

  if (!response.ok) {
    throw new Error(t('api.error.paymentHistoryFailed'))
  }

  return response.json()
}
