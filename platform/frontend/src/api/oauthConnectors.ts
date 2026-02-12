import { authFetch } from './auth'

const API = import.meta.env.VITE_API_URL || ''

export interface OAuthConnector {
  id: string
  userId: string
  provider: string
  displayName: string
  status: string
  scopes: string
  accessTokenHash: string
  refreshTokenHash: string
  tokenExpiresAt: string | null
  connectedAt: string | null
  lastUsedAt: string | null
  totalApiCalls: number
  failedApiCalls: number
  iconUrl: string
  category: string
  createdAt: string
  updatedAt: string
}

export interface ProviderMetadata {
  name: string
  displayName: string
  description: string
  category: string
  iconUrl: string
  scopes: string[]
}

export interface OAuthConnectorStats {
  totalConnected: number
  totalApiCalls: number
  failedApiCalls: number
  byCategory: { category: string; count: number }[]
  connectors: {
    provider: string
    displayName: string
    status: string
    category: string
    totalApiCalls: number
    failedApiCalls: number
    connectedAt: string | null
    lastUsedAt: string | null
  }[]
}

export async function listConnectors(): Promise<OAuthConnector[]> {
  const res = await authFetch(`${API}/api/oauth-connectors`)
  if (!res.ok) throw new Error('Failed to load connectors')
  return res.json()
}

export async function connectProvider(provider: string): Promise<OAuthConnector> {
  const res = await authFetch(`${API}/api/oauth-connectors/connect`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ provider })
  })
  if (!res.ok) throw new Error('Failed to connect provider')
  return res.json()
}

export async function disconnectConnector(id: string): Promise<void> {
  const res = await authFetch(`${API}/api/oauth-connectors/${id}`, {
    method: 'DELETE'
  })
  if (!res.ok) throw new Error('Failed to disconnect connector')
}

export async function listProviders(): Promise<ProviderMetadata[]> {
  const res = await authFetch(`${API}/api/oauth-connectors/providers`)
  if (!res.ok) throw new Error('Failed to load providers')
  return res.json()
}

export async function refreshConnector(id: string): Promise<OAuthConnector> {
  const res = await authFetch(`${API}/api/oauth-connectors/${id}/refresh`, {
    method: 'POST'
  })
  if (!res.ok) throw new Error('Failed to refresh connector')
  return res.json()
}

export async function getConnectorStats(): Promise<OAuthConnectorStats> {
  const res = await authFetch(`${API}/api/oauth-connectors/stats`)
  if (!res.ok) throw new Error('Failed to load stats')
  return res.json()
}
