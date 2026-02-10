import { getAuthHeaders } from './auth'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

function authHeaders(): Record<string, string> {
  return getAuthHeaders()
}

// Types

export interface InfrastructureConfig {
  id: string
  devRequestId: string
  selectedServices: string[]
  tier: string
  estimatedMonthlyCostUsd: number
  generatedBicepMain?: string
  generatedBicepParameters?: string
  analysisSummary?: string
  createdAt: string
  updatedAt: string
}

export interface CostLineItem {
  service: string
  displayName: string
  monthlyCostUsd: number
  tier: string
}

export interface CostEstimation {
  lineItems: CostLineItem[]
  totalMonthlyCostUsd: number
  tier: string
  currency: string
}

// API Functions

export async function analyzeInfrastructure(projectId: string): Promise<InfrastructureConfig> {
  const response = await fetch(`${API_BASE_URL}/api/projects/${projectId}/infrastructure/analyze`, {
    method: 'POST',
    headers: authHeaders(),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error || 'Infrastructure analysis failed')
  }

  return response.json()
}

export async function getInfrastructureConfig(projectId: string): Promise<InfrastructureConfig | null> {
  const response = await fetch(`${API_BASE_URL}/api/projects/${projectId}/infrastructure/config`, {
    headers: authHeaders(),
  })

  if (!response.ok) return null
  return response.json()
}

export async function updateInfrastructureConfig(
  projectId: string,
  selectedServices: string[],
  tier: string
): Promise<InfrastructureConfig> {
  const response = await fetch(`${API_BASE_URL}/api/projects/${projectId}/infrastructure/config`, {
    method: 'PUT',
    headers: { ...authHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ selectedServices, tier }),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error || 'Failed to update configuration')
  }

  return response.json()
}

export async function generateBicep(projectId: string): Promise<InfrastructureConfig> {
  const response = await fetch(`${API_BASE_URL}/api/projects/${projectId}/infrastructure/generate`, {
    method: 'POST',
    headers: authHeaders(),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error || 'Bicep generation failed')
  }

  return response.json()
}

export async function getCostEstimation(projectId: string): Promise<CostEstimation> {
  const response = await fetch(`${API_BASE_URL}/api/projects/${projectId}/infrastructure/cost`, {
    headers: authHeaders(),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error || 'Cost estimation failed')
  }

  return response.json()
}

export async function downloadTemplates(projectId: string): Promise<Blob> {
  const response = await fetch(`${API_BASE_URL}/api/projects/${projectId}/infrastructure/templates`, {
    headers: authHeaders(),
  })

  if (!response.ok) {
    throw new Error('Template download failed')
  }

  return response.blob()
}
