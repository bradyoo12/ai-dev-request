import i18n from '../i18n'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

const t = (key: string) => i18n.t(key)

export function getUserId(): string {
  let userId = localStorage.getItem('ai-dev-user-id')
  if (!userId) {
    userId = crypto.randomUUID()
    localStorage.setItem('ai-dev-user-id', userId)
  }
  return userId
}

function authHeaders(): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    'X-User-Id': getUserId(),
  }
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
  const response = await fetch(`${API_BASE_URL}/api/settings/tokens`, {
    headers: authHeaders(),
  })

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

  const response = await fetch(url, {
    headers: authHeaders(),
  })

  if (!response.ok) {
    throw new Error(t('api.error.tokenHistoryFailed'))
  }

  return response.json()
}

export async function getTokenPackages(): Promise<TokenPackage[]> {
  const response = await fetch(`${API_BASE_URL}/api/settings/tokens/packages`, {
    headers: authHeaders(),
  })

  if (!response.ok) {
    throw new Error(t('api.error.tokenPackagesFailed'))
  }

  return response.json()
}

export async function purchaseTokens(packageId: number): Promise<TokenPurchaseResult> {
  const response = await fetch(`${API_BASE_URL}/api/settings/tokens/purchase`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ packageId }),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error || t('api.error.tokenPurchaseFailed'))
  }

  return response.json()
}

export async function checkTokens(actionType: string): Promise<TokenCheck> {
  const response = await fetch(
    `${API_BASE_URL}/api/settings/tokens/check/${encodeURIComponent(actionType)}`,
    { headers: authHeaders() }
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
  const response = await fetch(`${API_BASE_URL}/api/settings/tokens/deduct`, {
    method: 'POST',
    headers: authHeaders(),
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
