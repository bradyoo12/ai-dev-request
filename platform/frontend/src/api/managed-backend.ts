import { getAuthHeaders } from './auth'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

function authHeaders(): Record<string, string> {
  return getAuthHeaders()
}

// === TypeScript Interfaces ===

export interface ManagedBackend {
  id: string
  projectId: string
  userId: string
  databaseType: string
  databaseConnectionString: string
  authProvider: string
  authConfigJson?: string | null
  storageProvider: string
  storageBucket: string
  storageConnectionString: string
  hostingProvider: string
  containerAppId: string
  containerAppUrl: string
  previewUrl: string
  customDomain?: string | null
  status: string // Provisioning, Active, Suspended, Deprovisioning, Deleted
  region: string
  tier: string // Free, Basic, Pro
  cpuCores: number
  memoryGb: number
  storageLimitGb: number
  monthlyBudget: number
  currentMonthCost: number
  provisionedAt?: string | null
  lastHealthCheck?: string | null
  createdAt: string
  updatedAt: string
}

export interface ManagedBackendStats {
  total: number
  active: number
  provisioning: number
  suspended: number
  deprovisioning: number
  deleted: number
  freeTier: number
  basicTier: number
  proTier: number
  totalMonthlyCost: number
}

// === API Functions ===

export async function getManagedBackends(): Promise<ManagedBackend[]> {
  const response = await fetch(`${API_BASE_URL}/api/managed-backend`, {
    headers: authHeaders(),
  })
  if (!response.ok) return []
  return response.json()
}

export async function getManagedBackendById(id: string): Promise<ManagedBackend | null> {
  const response = await fetch(`${API_BASE_URL}/api/managed-backend/${id}`, {
    headers: authHeaders(),
  })
  if (!response.ok) return null
  return response.json()
}

export async function getManagedBackendByProject(projectId: string): Promise<ManagedBackend | null> {
  const response = await fetch(`${API_BASE_URL}/api/managed-backend/project/${projectId}`, {
    headers: authHeaders(),
  })
  if (!response.ok) return null
  return response.json()
}

export async function provisionManagedBackend(projectId: string, tier: string): Promise<ManagedBackend> {
  const response = await fetch(`${API_BASE_URL}/api/managed-backend/provision`, {
    method: 'POST',
    headers: { ...authHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ projectId, tier }),
  })
  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error || 'Failed to provision managed backend')
  }
  return response.json()
}

export async function deprovisionManagedBackend(id: string): Promise<ManagedBackend> {
  const response = await fetch(`${API_BASE_URL}/api/managed-backend/${id}/deprovision`, {
    method: 'POST',
    headers: authHeaders(),
  })
  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error || 'Failed to deprovision managed backend')
  }
  return response.json()
}

export async function getManagedBackendStats(): Promise<ManagedBackendStats> {
  const response = await fetch(`${API_BASE_URL}/api/managed-backend/stats`, {
    headers: authHeaders(),
  })
  if (!response.ok) return { total: 0, active: 0, provisioning: 0, suspended: 0, deprovisioning: 0, deleted: 0, freeTier: 0, basicTier: 0, proTier: 0, totalMonthlyCost: 0 }
  return response.json()
}

export async function healthCheckManagedBackend(id: string): Promise<ManagedBackend> {
  const response = await fetch(`${API_BASE_URL}/api/managed-backend/${id}/health-check`, {
    method: 'POST',
    headers: authHeaders(),
  })
  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error || 'Health check failed')
  }
  return response.json()
}

export async function updateManagedBackendTier(id: string, tier: string): Promise<ManagedBackend> {
  const response = await fetch(`${API_BASE_URL}/api/managed-backend/${id}/tier`, {
    method: 'PUT',
    headers: { ...authHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ tier }),
  })
  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error || 'Failed to update tier')
  }
  return response.json()
}
