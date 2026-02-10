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

// === Usage-Based Billing Interfaces ===

export interface BillingAccount {
  id: string
  plan: string // free, pro, team
  status: string // active, past_due, cancelled, trialing
  stripeCustomerId?: string | null
  stripeSubscriptionId?: string | null
  requestsThisPeriod: number
  requestsLimit: number
  tokensUsedThisPeriod: number
  overageCharges: number
  monthlyRate: number
  perRequestOverageRate: number
  periodStart: string
  periodEnd: string
  createdAt: string
  updatedAt?: string | null
}

export interface PricingPlan {
  id: string
  name: string
  monthlyRate: number
  requestsLimit: number
  perRequestOverageRate: number
  features: string[]
}

export interface UsageSummary {
  plan: string
  status: string
  requestsUsed: number
  requestsLimit: number
  tokensUsed: number
  overageCharges: number
  monthlyRate: number
  totalEstimated: number
  periodStart: string
  periodEnd: string
  daysRemaining: number
}

export interface Invoice {
  id: string
  date: string
  amount: number
  status: string // paid, pending, cancelled
  description: string
  planName: string
  downloadUrl?: string | null
}

export interface PortalSessionResponse {
  url: string
  expiresAt: string
}

// === Usage-Based Billing API Functions ===

export async function getBillingAccount(): Promise<BillingAccount> {
  const response = await fetch(`${API_BASE_URL}/api/billing/account`, {
    headers: authHeaders(),
  })
  if (!response.ok) throw new Error(t('api.error.billingFailed'))
  return response.json()
}

export async function subscribeToPlan(plan: string): Promise<BillingAccount> {
  const response = await fetch(`${API_BASE_URL}/api/billing/subscribe`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ plan }),
  })
  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error || t('api.error.subscribeFailed'))
  }
  return response.json()
}

export async function cancelSubscription(): Promise<BillingAccount> {
  const response = await fetch(`${API_BASE_URL}/api/billing/cancel`, {
    method: 'POST',
    headers: authHeaders(),
  })
  if (!response.ok) throw new Error(t('api.error.cancelSubscriptionFailed'))
  return response.json()
}

export async function getUsageSummary(): Promise<UsageSummary> {
  const response = await fetch(`${API_BASE_URL}/api/billing/usage`, {
    headers: authHeaders(),
  })
  if (!response.ok) throw new Error(t('api.error.usageFailed'))
  return response.json()
}

export async function getInvoices(): Promise<Invoice[]> {
  const response = await fetch(`${API_BASE_URL}/api/billing/invoices`, {
    headers: authHeaders(),
  })
  if (!response.ok) return []
  return response.json()
}

export async function getPricingPlans(): Promise<PricingPlan[]> {
  const response = await fetch(`${API_BASE_URL}/api/billing/plans`, {
    headers: authHeaders(),
  })
  if (!response.ok) return []
  return response.json()
}

export async function createPortalSession(): Promise<PortalSessionResponse> {
  const response = await fetch(`${API_BASE_URL}/api/billing/portal`, {
    method: 'POST',
    headers: authHeaders(),
  })
  if (!response.ok) throw new Error(t('api.error.portalFailed'))
  return response.json()
}
