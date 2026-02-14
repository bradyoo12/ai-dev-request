import i18n from '../i18n'
import { getAuthHeaders } from './auth'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

const t = (key: string) => i18n.t(key)

function authHeaders(): Record<string, string> {
  return getAuthHeaders()
}

// === TypeScript Interfaces ===

export interface TestFileInfo {
  path: string
  testCount: number
  type: string // unit, integration, e2e
  content?: string
}

export interface TestGenerationRecord {
  id: string
  projectId: number
  status: string // pending, generating, completed, failed
  testFilesGenerated: number
  totalTestCount: number
  coverageEstimate: number
  testFramework: string
  summary: string
  testFilesJson?: string | null // JSON string of TestFileInfo[]
  generationVersion: number
  createdAt: string
  completedAt?: string | null
}

export interface McpConnectionStatus {
  isConfigured: boolean
  status: string
  serverUrl?: string
  transport?: string
  autoHealEnabled: boolean
  healingConfidenceThreshold: number
  lastConnectedAt?: string | null
  errorMessage?: string | null
  capabilitiesJson?: string | null
}

export interface McpConfigResponse {
  id: string
  projectId: number
  serverUrl: string
  transport: string
  status: string
  autoHealEnabled: boolean
  healingConfidenceThreshold: number
  capabilitiesJson?: string | null
  lastConnectedAt?: string | null
}

export interface CoverageAnalysis {
  overallCoverage: number
  lineCoverage: number
  branchCoverage: number
  functionCoverage: number
  uncoveredAreas: UncoveredArea[]
  recommendations: string[]
  summary: string
}

export interface UncoveredArea {
  filePath: string
  functionName: string
  reason: string
  priority: number
}

// === API Functions ===

export async function triggerTestGeneration(projectId: number): Promise<TestGenerationRecord> {
  const response = await fetch(`${API_BASE_URL}/api/projects/${projectId}/tests/generate`, {
    method: 'POST',
    headers: authHeaders(),
  })
  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error || t('api.error.testGenerationFailed'))
  }
  return response.json()
}

export async function getTestResults(projectId: number): Promise<TestGenerationRecord | null> {
  const response = await fetch(`${API_BASE_URL}/api/projects/${projectId}/tests/results`, {
    headers: authHeaders(),
  })
  if (!response.ok) return null
  return response.json()
}

export async function getTestHistory(projectId: number): Promise<TestGenerationRecord[]> {
  const response = await fetch(`${API_BASE_URL}/api/projects/${projectId}/tests/history`, {
    headers: authHeaders(),
  })
  if (!response.ok) return []
  return response.json()
}

export async function generateFromNaturalLanguage(
  projectId: number,
  scenario: string,
  testType: string = 'e2e'
): Promise<TestGenerationRecord> {
  const response = await fetch(`${API_BASE_URL}/api/projects/${projectId}/tests/generate-from-nl`, {
    method: 'POST',
    headers: { ...authHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ scenario, testType }),
  })
  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error || t('api.error.testGenerationFailed'))
  }
  return response.json()
}

export async function getMcpStatus(projectId: number): Promise<McpConnectionStatus> {
  const response = await fetch(`${API_BASE_URL}/api/projects/${projectId}/tests/mcp-status`, {
    headers: authHeaders(),
  })
  if (!response.ok) {
    return { isConfigured: false, status: 'not_configured', autoHealEnabled: false, healingConfidenceThreshold: 70 }
  }
  return response.json()
}

export async function configureMcp(
  projectId: number,
  serverUrl: string,
  transport: string = 'sse',
  authType?: string,
  authToken?: string
): Promise<McpConfigResponse> {
  const response = await fetch(`${API_BASE_URL}/api/projects/${projectId}/tests/configure-mcp`, {
    method: 'POST',
    headers: { ...authHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ serverUrl, transport, authType, authToken }),
  })
  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error || t('api.error.mcpConfigFailed'))
  }
  return response.json()
}

export async function analyzeCoverage(projectId: number): Promise<CoverageAnalysis> {
  const response = await fetch(`${API_BASE_URL}/api/projects/${projectId}/tests/coverage-analysis`, {
    method: 'POST',
    headers: authHeaders(),
  })
  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error || t('api.error.coverageAnalysisFailed'))
  }
  return response.json()
}
