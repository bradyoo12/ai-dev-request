import { getAuthHeaders } from './auth'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

function authHeaders(): Record<string, string> {
  return getAuthHeaders()
}

// Types

export interface SecretFinding {
  patternId: string
  patternName: string
  severity: string
  description: string
  location: string
  matchPreview: string
}

export interface SecretScanResponse {
  scanResultId: string
  findingCount: number
  criticalCount: number
  highCount: number
  mediumCount: number
  lowCount: number
  status: string
  scannedAt: string
}

export interface SecretScanDetailResponse {
  id: string
  devRequestId: string
  findings: SecretFinding[]
  findingCount: number
  status: string
  scannedAt: string
}

export interface SecretPattern {
  id: string
  name: string
  severity: string
  description: string
}

export interface SecureConfigResponse {
  id: string
  envTemplate: string
  gitignore: string
  configModule: string
  keyVaultConfig: string
  language: string
}

// API Functions

export async function triggerSecretScan(requestId: string): Promise<SecretScanResponse> {
  const response = await fetch(`${API_BASE_URL}/api/projects/${requestId}/secrets/scan`, {
    method: 'POST',
    headers: authHeaders(),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error || 'Secret scan failed')
  }

  return response.json()
}

export async function getSecretScanResults(requestId: string): Promise<SecretScanDetailResponse | null> {
  const response = await fetch(`${API_BASE_URL}/api/projects/${requestId}/secrets/results`, {
    headers: authHeaders(),
  })

  if (!response.ok) return null
  return response.json()
}

export async function getSecretPatterns(): Promise<SecretPattern[]> {
  const response = await fetch(`${API_BASE_URL}/api/secrets/patterns`, {
    headers: authHeaders(),
  })

  if (!response.ok) return []
  return response.json()
}

export async function generateSecureConfig(
  requestId: string,
  language: string = 'typescript'
): Promise<SecureConfigResponse> {
  const response = await fetch(
    `${API_BASE_URL}/api/projects/${requestId}/secrets/config/generate?language=${encodeURIComponent(language)}`,
    {
      method: 'POST',
      headers: authHeaders(),
    }
  )

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error || 'Config generation failed')
  }

  return response.json()
}

export async function getSecureConfig(requestId: string): Promise<SecureConfigResponse | null> {
  const response = await fetch(`${API_BASE_URL}/api/projects/${requestId}/secrets/config`, {
    headers: authHeaders(),
  })

  if (!response.ok) return null
  return response.json()
}
