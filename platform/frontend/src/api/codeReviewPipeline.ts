import { authFetch } from './auth'

const API = import.meta.env.VITE_API_URL || ''

export interface PipelineFinding {
  category: string
  severity: string
  description: string
  autoFixAvailable: boolean
  fixed: boolean
}

export interface PipelineStepResult {
  name: string
  status: string
  durationMs: number
  findingsCount: number
}

export interface GeneratedTestFile {
  fileName: string
  description: string
  testCount: number
  linesOfCode: number
}

export interface CodeReviewPipelineConfig {
  id: string
  userId: string
  devRequestId: string | null
  projectName: string
  pipelineEnabled: boolean
  autoRunAfterGeneration: boolean
  autoFixEnabled: boolean
  astAnalysisEnabled: boolean
  sastScanEnabled: boolean
  aiReviewEnabled: boolean
  testGenerationEnabled: boolean
  qualityScore: number
  minQualityThreshold: number
  lastRunStatus: string
  lastRunAt: string | null
  totalRuns: number
  passedRuns: number
  failedRuns: number
  findingsJson: string
  generatedTestsJson: string
  pipelineStepsJson: string
  totalFindingsFound: number
  totalFindingsFixed: number
  totalTestsGenerated: number
  avgQualityScore: number
  tokensUsed: number
  estimatedCost: number
  createdAt: string
  updatedAt: string
}

export interface PipelineResults {
  id: string
  projectName: string
  qualityScore: number
  minQualityThreshold: number
  lastRunStatus: string
  lastRunAt: string | null
  passed: boolean
  findings: PipelineFinding[]
  generatedTests: GeneratedTestFile[]
  pipelineSteps: PipelineStepResult[]
  totalFindingsFound: number
  totalFindingsFixed: number
  totalTestsGenerated: number
  tokensUsed: number
  estimatedCost: number
}

export interface PipelineHistoryEntry {
  id: string
  projectName: string
  qualityScore: number
  lastRunStatus: string
  lastRunAt: string | null
  passed: boolean
  totalRuns: number
  passedRuns: number
  failedRuns: number
  totalFindingsFound: number
  totalFindingsFixed: number
  totalTestsGenerated: number
  tokensUsed: number
  estimatedCost: number
  updatedAt: string
}

export interface PipelineStats {
  totalPipelines: number
  totalRuns: number
  passedRuns: number
  failedRuns: number
  passRate: number
  avgQualityScore: number
  totalFindingsFound: number
  totalFindingsFixed: number
  totalTestsGenerated: number
  totalTokensUsed: number
  totalCost: number
}

export async function getPipelineConfig(projectId: string): Promise<CodeReviewPipelineConfig> {
  const res = await authFetch(`${API}/api/code-review-pipeline/config/${encodeURIComponent(projectId)}`)
  if (!res.ok) throw new Error('Failed to load pipeline config')
  return res.json()
}

export async function updatePipelineConfig(projectId: string, data: Partial<{
  pipelineEnabled: boolean
  autoRunAfterGeneration: boolean
  autoFixEnabled: boolean
  astAnalysisEnabled: boolean
  sastScanEnabled: boolean
  aiReviewEnabled: boolean
  testGenerationEnabled: boolean
  minQualityThreshold: number
}>): Promise<CodeReviewPipelineConfig> {
  const res = await authFetch(`${API}/api/code-review-pipeline/config/${encodeURIComponent(projectId)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error('Failed to update pipeline config')
  return res.json()
}

export async function runPipeline(data: { projectId: string; devRequestId?: string }): Promise<CodeReviewPipelineConfig> {
  const res = await authFetch(`${API}/api/code-review-pipeline/run`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error('Failed to run pipeline')
  return res.json()
}

export async function getPipelineResults(projectId: string): Promise<PipelineResults> {
  const res = await authFetch(`${API}/api/code-review-pipeline/results/${encodeURIComponent(projectId)}`)
  if (!res.ok) throw new Error('Failed to load pipeline results')
  return res.json()
}

export async function getPipelineHistory(projectId: string): Promise<PipelineHistoryEntry[]> {
  const res = await authFetch(`${API}/api/code-review-pipeline/history/${encodeURIComponent(projectId)}`)
  if (!res.ok) throw new Error('Failed to load pipeline history')
  return res.json()
}

export async function getPipelineStats(): Promise<PipelineStats> {
  const res = await authFetch(`${API}/api/code-review-pipeline/stats`)
  if (!res.ok) throw new Error('Failed to load pipeline stats')
  return res.json()
}
