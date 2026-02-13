import { getAuthHeaders } from './auth'

const API = import.meta.env.VITE_API_URL || ''

export interface ProductionSandbox {
  id: string
  userId: string
  sandboxName: string
  provider: string
  status: string
  envVarsJson: string
  envVarCount: number
  servicesJson: string
  serviceCount: number
  region: string
  oauthConnected: boolean
  uptimeMinutes: number
  costUsd: number
  devRequestId: number | null
  createdAt: string
  updatedAt: string
}

export interface ProviderInfo {
  id: string
  name: string
  description: string
  color: string
}

export interface SandboxStats {
  totalSandboxes: number
  activeSandboxes: number
  totalEnvVars: number
  totalServices: number
  totalUptimeMinutes: number
  totalCostUsd: number
  byProvider: { provider: string; count: number; envVars: number; services: number }[]
  byStatus: { status: string; count: number }[]
}

export async function listSandboxes(provider?: string): Promise<ProductionSandbox[]> {
  const params = new URLSearchParams()
  if (provider) params.set('provider', provider)
  const res = await fetch(`${API}/api/production-sandboxes?${params}`, { headers: getAuthHeaders() })
  if (!res.ok) return []
  return res.json()
}

export async function createSandbox(req: {
  sandboxName?: string
  provider?: string
  region?: string
  devRequestId?: number
}): Promise<ProductionSandbox> {
  const res = await fetch(`${API}/api/production-sandboxes`, {
    method: 'POST',
    headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify(req),
  })
  return res.json()
}

export async function stopSandbox(id: string): Promise<ProductionSandbox> {
  const res = await fetch(`${API}/api/production-sandboxes/${id}/stop`, {
    method: 'POST',
    headers: getAuthHeaders(),
  })
  return res.json()
}

export async function deleteSandbox(id: string): Promise<void> {
  await fetch(`${API}/api/production-sandboxes/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  })
}

export async function getSandboxStats(): Promise<SandboxStats> {
  const res = await fetch(`${API}/api/production-sandboxes/stats`, { headers: getAuthHeaders() })
  return res.json()
}

export async function getProviders(): Promise<ProviderInfo[]> {
  const res = await fetch(`${API}/api/production-sandboxes/providers`)
  if (!res.ok) return []
  return res.json()
}
