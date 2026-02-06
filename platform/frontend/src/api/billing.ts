import i18n from '../i18n'
import { getAuthHeaders } from './auth'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

const t = (key: string) => i18n.t(key)

function authHeaders(): Record<string, string> {
  return getAuthHeaders()
}

export interface PaymentMethod {
  id: string
  brand: string
  last4: string
  expMonth: number
  expYear: number
  isDefault: boolean
}

export interface AutoTopUpConfig {
  isEnabled: boolean
  threshold: number
  tokenPackageId: number
  monthlyLimitUsd: number | null
  monthlySpentUsd: number
  lastTriggeredAt: string | null
  lastFailedAt: string | null
  failureReason: string | null
}

export interface BillingOverview {
  paymentMethods: PaymentMethod[]
  autoTopUp: AutoTopUpConfig
  isSimulation: boolean
}

export interface UpdateAutoTopUpDto {
  isEnabled: boolean
  threshold: number
  tokenPackageId: number
  monthlyLimitUsd: number | null
}

export async function getBillingOverview(): Promise<BillingOverview> {
  const response = await fetch(`${API_BASE_URL}/api/settings/billing`, {
    headers: authHeaders(),
  })
  if (!response.ok) throw new Error(t('api.error.billingFailed'))
  return response.json()
}

export async function updateAutoTopUp(config: UpdateAutoTopUpDto): Promise<AutoTopUpConfig> {
  const response = await fetch(`${API_BASE_URL}/api/settings/billing/auto-topup`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify(config),
  })
  if (!response.ok) throw new Error(t('api.error.autoTopUpFailed'))
  return response.json()
}
