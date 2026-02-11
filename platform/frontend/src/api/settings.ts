import i18n from '../i18n'
import { authFetch } from './auth'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

/** Conversion rate: 1 token = $0.01 USD. Must match backend TokenPricing.TokenToUsdRate. */
export const TOKEN_TO_USD_RATE = 0.01

const t = (key: string) => i18n.t(key)

export function getUserId(): string {
  let userId = localStorage.getItem('ai-dev-user-id')
  if (!userId) {
    userId = crypto.randomUUID()
    localStorage.setItem('ai-dev-user-id', userId)
  }
  return userId
}

// Types
export interface TokenOverview {
  balance: number
  totalEarned: number
  totalSpent: number
  balanceValueUsd: number
  pricing: TokenCost[]
}

export interface TokenCost {
  actionType: string
  tokenCost: number
  description: string
  approxUsd: number
}

export interface TokenTransaction {
  id: number
  type: string
  amount: number
  action: string
  description: string
  balanceAfter: number
  createdAt: string
}

export interface TokenPackage {
  id: number
  name: string
  tokenAmount: number
  priceUsd: number
  discountPercent: number
}

export interface TokenPurchaseResult {
  success: boolean
  tokensAdded: number
  newBalance: number
}

export interface TokenCheck {
  actionType: string
  tokenCost: number
  currentBalance: number
  hasEnough: boolean
  shortfall: number
}

export interface TokenDeductResult {
  success: boolean
  tokensDeducted: number
  newBalance: number
}

// API Functions
export async function getTokenOverview(): Promise<TokenOverview> {
  const response = await authFetch(`${API_BASE_URL}/api/settings/tokens`)

  if (!response.ok) {
    throw new Error(t('api.error.tokenLoadFailed'))
  }

  return response.json()
}

export async function getTokenHistory(
  page = 1,
  pageSize = 20,
  actionFilter?: string
): Promise<TokenTransaction[]> {
  let url = `${API_BASE_URL}/api/settings/tokens/history?page=${page}&pageSize=${pageSize}`
  if (actionFilter) {
    url += `&actionFilter=${encodeURIComponent(actionFilter)}`
  }

  const response = await authFetch(url)

  if (!response.ok) {
    throw new Error(t('api.error.tokenHistoryFailed'))
  }

  return response.json()
}

export async function getTokenPackages(): Promise<TokenPackage[]> {
  const response = await authFetch(`${API_BASE_URL}/api/settings/tokens/packages`)

  if (!response.ok) {
    throw new Error(t('api.error.tokenPackagesFailed'))
  }

  return response.json()
}

export async function purchaseTokens(packageId: number): Promise<TokenPurchaseResult> {
  const response = await authFetch(`${API_BASE_URL}/api/settings/tokens/purchase`, {
    method: 'POST',
    body: JSON.stringify({ packageId }),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error || t('api.error.tokenPurchaseFailed'))
  }

  return response.json()
}

export async function checkTokens(actionType: string): Promise<TokenCheck> {
  const response = await authFetch(
    `${API_BASE_URL}/api/settings/tokens/check/${encodeURIComponent(actionType)}`
  )

  if (!response.ok) {
    throw new Error(t('api.error.tokenCheckFailed'))
  }

  return response.json()
}

export async function deductTokens(
  actionType: string,
  referenceId?: string
): Promise<TokenDeductResult> {
  const response = await authFetch(`${API_BASE_URL}/api/settings/tokens/deduct`, {
    method: 'POST',
    body: JSON.stringify({ actionType, referenceId }),
  })

  if (!response.ok) {
    if (response.status === 402) {
      const error = await response.json().catch(() => ({}))
      throw new Error(
        t('settings.tokens.insufficientError')
          .replace('{{required}}', error.required)
          .replace('{{balance}}', error.balance)
      )
    }
    throw new Error(t('api.error.tokenDeductFailed'))
  }

  return response.json()
}

// Pricing Plan Types
export interface PricingPlanData {
  id: string
  name: string
  nameKorean: string
  priceMonthly: number
  priceYearly: number
  currency: string
  projectLimit: number
  features: string[]
  isPopular: boolean
}

export async function getPricingPlans(): Promise<PricingPlanData[]> {
  const response = await fetch(`${API_BASE_URL}/api/pricing/plans`)
  if (!response.ok) return []
  return response.json()
}

// Usage Types
export interface UsageSummary {
  balance: number
  balanceValueUsd: number
  usedThisMonth: number
  addedThisMonth: number
  projectsThisMonth: number
}

export interface UsageTransaction {
  id: number
  type: string
  amount: number
  action: string
  referenceId?: string
  description: string
  balanceAfter: number
  createdAt: string
}

export interface UsageTransactionsResult {
  transactions: UsageTransaction[]
  totalCount: number
  page: number
  pageSize: number
}

export interface ProjectUsage {
  projectId: string
  analysis: number
  proposal: number
  build: number
  total: number
}

// Usage API Functions
export async function getUsageSummary(): Promise<UsageSummary> {
  const response = await authFetch(`${API_BASE_URL}/api/settings/usage/summary`)
  if (!response.ok) throw new Error(t('api.error.usageFailed'))
  return response.json()
}

export async function getUsageTransactions(params: {
  page?: number
  pageSize?: number
  type?: string
  action?: string
  projectId?: string
  from?: string
  to?: string
}): Promise<UsageTransactionsResult> {
  const searchParams = new URLSearchParams()
  if (params.page) searchParams.set('page', String(params.page))
  if (params.pageSize) searchParams.set('pageSize', String(params.pageSize))
  if (params.type) searchParams.set('type', params.type)
  if (params.action) searchParams.set('action', params.action)
  if (params.projectId) searchParams.set('projectId', params.projectId)
  if (params.from) searchParams.set('from', params.from)
  if (params.to) searchParams.set('to', params.to)

  const response = await authFetch(
    `${API_BASE_URL}/api/settings/usage/transactions?${searchParams.toString()}`
  )
  if (!response.ok) throw new Error(t('api.error.usageFailed'))
  return response.json()
}

export async function getUsageByProject(): Promise<ProjectUsage[]> {
  const response = await authFetch(`${API_BASE_URL}/api/settings/usage/by-project`)
  if (!response.ok) throw new Error(t('api.error.usageFailed'))
  return response.json()
}

export function getUsageExportUrl(from?: string, to?: string): string {
  const params = new URLSearchParams()
  if (from) params.set('from', from)
  if (to) params.set('to', to)
  const query = params.toString()
  return `${API_BASE_URL}/api/settings/usage/export${query ? `?${query}` : ''}`
}
