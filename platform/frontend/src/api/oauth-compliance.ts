import { getAuthHeaders } from './auth'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

function authHeaders(): Record<string, string> {
  return getAuthHeaders()
}

// Types

export interface OAuthAnalysisResponse {
  reportId: string
  totalScopesDetected: number
  overPermissionedCount: number
  status: string
  createdAt: string
}

export interface DetectedOAuthScope {
  provider: string
  scope: string
  detectedInFile: string
  isOverPermissioned: boolean
}

export interface OAuthScopeRecommendation {
  provider: string
  currentScope: string
  recommendedScope?: string
  reason: string
  severity: string
}

export interface OAuthScopeDetail {
  provider: string
  scope: string
  description: string
  justification: string
  isOverPermissioned: boolean
  detectedInFile: string
  minimalAlternative?: string
}

export interface ComplianceDocumentation {
  privacyPolicy: string
  dataUsageDisclosure: string
  scopeJustifications: string
  providerCompliance: string
  generatedAt: string
}

export interface OAuthComplianceReportResponse {
  id: string
  totalScopesDetected: number
  overPermissionedCount: number
  scopesAnalyzedJson: string
  recommendationsJson: string
  complianceDocsJson?: string
  status: string
  createdAt: string
  updatedAt: string
}

// API Functions

export async function analyzeOAuthScopes(requestId: string): Promise<OAuthAnalysisResponse> {
  const response = await fetch(`${API_BASE_URL}/api/projects/${requestId}/oauth/analyze`, {
    method: 'POST',
    headers: authHeaders(),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error || 'OAuth scope analysis failed')
  }

  return response.json()
}

export async function getOAuthReport(requestId: string): Promise<OAuthComplianceReportResponse | null> {
  const response = await fetch(`${API_BASE_URL}/api/projects/${requestId}/oauth/report`, {
    headers: authHeaders(),
  })

  if (!response.ok) return null
  return response.json()
}

export async function generateComplianceDocs(requestId: string): Promise<OAuthComplianceReportResponse> {
  const response = await fetch(`${API_BASE_URL}/api/projects/${requestId}/oauth/compliance-docs`, {
    method: 'POST',
    headers: authHeaders(),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error || 'Compliance doc generation failed')
  }

  return response.json()
}

export async function getComplianceDocs(requestId: string): Promise<ComplianceDocumentation | null> {
  const response = await fetch(`${API_BASE_URL}/api/projects/${requestId}/oauth/compliance-docs`, {
    headers: authHeaders(),
  })

  if (!response.ok) return null
  return response.json()
}

export async function getOAuthScopes(requestId: string): Promise<OAuthScopeDetail[]> {
  const response = await fetch(`${API_BASE_URL}/api/projects/${requestId}/oauth/scopes`, {
    headers: authHeaders(),
  })

  if (!response.ok) return []
  return response.json()
}
