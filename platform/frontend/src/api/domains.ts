import i18n from '../i18n'
import { getAuthHeaders } from './auth'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

const t = (key: string) => i18n.t(key)

function authHeaders(): Record<string, string> {
  return getAuthHeaders()
}

export interface DomainSearchResult {
  domainName: string
  tld: string
  available: boolean
  priceUsd: number | null
}

export interface DomainResponse {
  id: string
  deploymentId: string
  domainName: string
  tld: string
  status: string
  sslStatus: string
  dnsStatus: string
  registeredAt?: string
  expiresAt?: string
  autoRenew: boolean
  annualCostUsd: number
  createdAt: string
  updatedAt: string
}

export async function searchDomains(query: string, tlds?: string[]): Promise<DomainSearchResult[]> {
  const params = new URLSearchParams({ query })
  if (tlds?.length) params.set('tlds', tlds.join(','))

  const response = await fetch(`${API_BASE_URL}/api/domains/search?${params}`, {
    headers: authHeaders(),
  })

  if (!response.ok) {
    throw new Error(t('api.error.domainSearchFailed'))
  }

  return response.json()
}

export async function purchaseDomain(
  siteId: string,
  domainName: string,
  tld: string,
  priceUsd: number,
  paymentMethod: 'Tokens' | 'Card' = 'Card'
): Promise<DomainResponse> {
  const response = await fetch(`${API_BASE_URL}/api/domains/sites/${siteId}/domain`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ domainName, tld, priceUsd, paymentMethod }),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error || t('api.error.domainPurchaseFailed'))
  }

  return response.json()
}

export async function getSiteDomain(siteId: string): Promise<DomainResponse | null> {
  const response = await fetch(`${API_BASE_URL}/api/domains/sites/${siteId}/domain`, {
    headers: authHeaders(),
  })

  if (response.status === 404) return null

  if (!response.ok) {
    throw new Error(t('api.error.domainLoadFailed'))
  }

  return response.json()
}

export async function getUserDomains(): Promise<DomainResponse[]> {
  const response = await fetch(`${API_BASE_URL}/api/domains`, {
    headers: authHeaders(),
  })

  if (!response.ok) {
    throw new Error(t('api.error.domainListFailed'))
  }

  return response.json()
}

export async function removeSiteDomain(siteId: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/domains/sites/${siteId}/domain`, {
    method: 'DELETE',
    headers: authHeaders(),
  })

  if (!response.ok) {
    throw new Error(t('api.error.domainRemoveFailed'))
  }
}
