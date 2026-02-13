import { authFetch } from './auth'

const API = import.meta.env.VITE_API_URL || ''

export interface CodeLintResult {
  id: string
  userId: string
  projectName: string
  language: string
  severity: string
  category: string
  ruleId: string
  message: string
  filePath: string
  lineNumber: number
  snippet: string
  suggestedFix: string
  autofixStatus: string
  pullRequestUrl: string
  isResolved: boolean
  createdAt: string
  updatedAt: string
}

export interface LintRule {
  id: string
  name: string
  description: string
  color: string
  icon: string
}

export interface LintStats {
  totalIssues: number
  resolved: number
  autofixed: number
  critical: number
  bySeverity: { severity: string; count: number; resolved: number }[]
  byCategory: { category: string; count: number }[]
  byLanguage: { language: string; count: number }[]
}

export async function listResults(severity?: string, category?: string, language?: string): Promise<CodeLintResult[]> {
  const params = new URLSearchParams()
  if (severity) params.set('severity', severity)
  if (category) params.set('category', category)
  if (language) params.set('language', language)
  const qs = params.toString() ? `?${params}` : ''
  const res = await authFetch(`${API}/api/code-lint${qs}`)
  if (!res.ok) throw new Error('Failed to list results')
  return res.json()
}

export async function runAnalysis(projectName: string, language?: string): Promise<CodeLintResult[]> {
  const res = await authFetch(`${API}/api/code-lint/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ projectName, language }),
  })
  if (!res.ok) throw new Error('Failed to run analysis')
  return res.json()
}

export async function applyAutofix(id: string): Promise<CodeLintResult> {
  const res = await authFetch(`${API}/api/code-lint/${id}/autofix`, { method: 'POST' })
  if (!res.ok) throw new Error('Failed to apply autofix')
  return res.json()
}

export async function dismissIssue(id: string): Promise<CodeLintResult> {
  const res = await authFetch(`${API}/api/code-lint/${id}/dismiss`, { method: 'POST' })
  if (!res.ok) throw new Error('Failed to dismiss issue')
  return res.json()
}

export async function deleteResult(id: string): Promise<void> {
  const res = await authFetch(`${API}/api/code-lint/${id}`, { method: 'DELETE' })
  if (!res.ok) throw new Error('Failed to delete result')
}

export async function getLintStats(): Promise<LintStats> {
  const res = await authFetch(`${API}/api/code-lint/stats`)
  if (!res.ok) throw new Error('Failed to get stats')
  return res.json()
}

export async function getLintRules(): Promise<LintRule[]> {
  const res = await fetch(`${API}/api/code-lint/rules`)
  if (!res.ok) throw new Error('Failed to get rules')
  return res.json()
}
