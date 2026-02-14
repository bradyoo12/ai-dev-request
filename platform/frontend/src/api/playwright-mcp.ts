import i18n from '../i18n'
import { getAuthHeaders } from './auth'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

const t = (key: string) => i18n.t(key)

function authHeaders(): Record<string, string> {
  return getAuthHeaders()
}

// === TypeScript Interfaces ===

export interface PlaywrightMcpTestConfig {
  id: string
  userId: string
  projectId: string | null
  testScenario: string
  generatedTestCode: string | null
  healingHistoryJson: string | null
  status: string // pending, generating, completed, failed
  successRate: number
  createdAt: string
  updatedAt: string
}

export interface TestHealingRecord {
  id: string
  testConfigId: string
  originalLocator: string
  updatedLocator: string
  failureReason: string
  healingStrategy: string
  success: boolean
  createdAt: string
}

// === API Functions ===

export async function getTestConfigs(): Promise<PlaywrightMcpTestConfig[]> {
  const response = await fetch(`${API_BASE_URL}/api/playwright-mcp`, {
    headers: authHeaders(),
  })
  if (!response.ok) return []
  return response.json()
}

export async function generateTests(testScenario: string, projectId?: string): Promise<PlaywrightMcpTestConfig> {
  const response = await fetch(`${API_BASE_URL}/api/playwright-mcp/generate`, {
    method: 'POST',
    headers: { ...authHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ testScenario, projectId: projectId || null }),
  })
  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error || t('api.error.playwrightMcpGenerateFailed'))
  }
  return response.json()
}

export async function healFailedTest(testConfigId: string, failureReason: string): Promise<TestHealingRecord> {
  const response = await fetch(`${API_BASE_URL}/api/playwright-mcp/${testConfigId}/heal`, {
    method: 'POST',
    headers: { ...authHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ failureReason }),
  })
  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error || t('api.error.playwrightMcpHealFailed'))
  }
  return response.json()
}

export interface TestExecutionResult {
  testConfigId: string
  passed: boolean
  output: string
  executedAt: string
}

export async function runTest(testConfigId: string): Promise<TestExecutionResult> {
  const response = await fetch(`${API_BASE_URL}/api/playwright-mcp/${testConfigId}/run`, {
    method: 'POST',
    headers: authHeaders(),
  })
  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error || t('api.error.playwrightMcpRunFailed'))
  }
  return response.json()
}

export async function getHealingHistory(testConfigId: string): Promise<TestHealingRecord[]> {
  const response = await fetch(`${API_BASE_URL}/api/playwright-mcp/${testConfigId}/healing-history`, {
    headers: authHeaders(),
  })
  if (!response.ok) return []
  return response.json()
}
