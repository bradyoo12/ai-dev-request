import { getAuthHeaders } from './auth'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

function authHeaders(): Record<string, string> {
  return getAuthHeaders()
}

// Types

export interface SbomComponent {
  name: string
  version: string
  type: string
  ecosystem: string
  license?: string
  purl?: string
}

export interface SecurityScanResponse {
  sbomReportId: string
  dependencyCount: number
  vulnerabilityCount: number
  criticalCount: number
  highCount: number
  mediumCount: number
  lowCount: number
  generatedAt: string
}

export interface SbomReportResponse {
  id: string
  format: string
  componentsJson: string
  dependencyCount: number
  licensesSummaryJson?: string
  generatedAt: string
}

export interface VulnerabilityResponse {
  id: string
  packageName: string
  packageVersion: string
  ecosystem: string
  vulnerabilityId: string
  severity: string
  summary: string
  fixedVersion?: string
  scannedAt: string
}

export interface LicenseGroup {
  license: string
  count: number
  packages: string[]
  category: string
}

export interface LicenseAnalysis {
  totalPackages: number
  uniqueLicenses: number
  licenseGroups: LicenseGroup[]
  hasCopyleftLicenses: boolean
  compatibilityStatus: string
}

// API Functions

export async function triggerSecurityScan(requestId: string): Promise<SecurityScanResponse> {
  const response = await fetch(`${API_BASE_URL}/api/requests/${requestId}/security/scan`, {
    method: 'POST',
    headers: authHeaders(),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error || 'Security scan failed')
  }

  return response.json()
}

export async function getSbomReport(requestId: string): Promise<SbomReportResponse | null> {
  const response = await fetch(`${API_BASE_URL}/api/requests/${requestId}/security/sbom`, {
    headers: authHeaders(),
  })

  if (!response.ok) return null
  return response.json()
}

export async function getVulnerabilities(requestId: string): Promise<VulnerabilityResponse[]> {
  const response = await fetch(`${API_BASE_URL}/api/requests/${requestId}/security/vulnerabilities`, {
    headers: authHeaders(),
  })

  if (!response.ok) return []
  return response.json()
}

export async function getLicenseAnalysis(requestId: string): Promise<LicenseAnalysis | null> {
  const response = await fetch(`${API_BASE_URL}/api/requests/${requestId}/security/licenses`, {
    headers: authHeaders(),
  })

  if (!response.ok) return null
  return response.json()
}

export async function exportSbom(requestId: string, format: 'cyclonedx' | 'spdx'): Promise<Blob> {
  const response = await fetch(`${API_BASE_URL}/api/requests/${requestId}/security/sbom/export/${format}`, {
    headers: authHeaders(),
  })

  if (!response.ok) {
    throw new Error(`Export failed for format: ${format}`)
  }

  return response.blob()
}
