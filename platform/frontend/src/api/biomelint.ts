import { authFetch } from './auth'

const API = import.meta.env.VITE_API_URL || ''

export interface BiomeLintResult {
  id: string
  projectName: string
  toolchain: string
  totalFiles: number
  filesLinted: number
  errors: number
  warnings: number
  autoFixed: number
  lintDurationMs: number
  formatDurationMs: number
  totalDurationMs: number
  speedupFactor: number
  typeAwareEnabled: boolean
  typeAwareIssues: number
  configPreset: string
  status: string
  notes: string
  createdAt: string
}

export interface LintComparison {
  biome: { lintMs: number; formatMs: number; totalMs: number }
  eslintPrettier: { lintMs: number; formatMs: number; totalMs: number }
}

export interface LintDetail {
  metric: string
  biome: string
  eslint: string
  speedup: string
}

export interface LintRunResponse {
  result: BiomeLintResult
  comparison: LintComparison
  details: LintDetail[]
}

export interface LintPreset {
  id: string
  name: string
  description: string
  rules: number
  color: string
}

export interface LintStats {
  totalRuns: number
  avgSpeedup?: number
  totalErrors?: number
  totalAutoFixed?: number
  avgLintMs?: number
  avgFormatMs?: number
  byToolchain?: { toolchain: string; count: number; avgDuration: number }[]
  byPreset?: { preset: string; count: number; avgErrors: number }[]
}

export async function listLintResults(): Promise<BiomeLintResult[]> {
  const res = await authFetch(`${API}/api/biome-lint`)
  if (!res.ok) return []
  return res.json()
}

export async function runLint(projectName: string, toolchain: string, preset: string, typeAware: boolean): Promise<LintRunResponse> {
  const res = await authFetch(`${API}/api/biome-lint/run`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ projectName, toolchain, preset, typeAware })
  })
  return res.json()
}

export async function deleteLintResult(id: string): Promise<void> {
  await authFetch(`${API}/api/biome-lint/${id}`, { method: 'DELETE' })
}

export async function getLintStats(): Promise<LintStats> {
  const res = await authFetch(`${API}/api/biome-lint/stats`)
  if (!res.ok) return { totalRuns: 0 }
  return res.json()
}

export async function getPresets(): Promise<LintPreset[]> {
  const res = await fetch(`${API}/api/biome-lint/presets`)
  if (!res.ok) return []
  return res.json()
}
