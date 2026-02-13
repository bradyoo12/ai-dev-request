import { authFetch } from './auth'

const API = import.meta.env.VITE_API_URL || ''

export interface AgentTrace {
  id: number
  projectName: string
  fileName: string
  authorType: string
  startLine: number
  endLine: number
  totalLines: number
  aiGeneratedLines: number
  humanEditedLines: number
  aiPercentage: number
  modelUsed: string
  conversationId: string
  promptSummary: string
  traceFormat: string
  complianceStatus: string
  createdAt: string
}

export interface FileTrace {
  fileName: string
  totalLines: number
  aiGeneratedLines: number
  humanEditedLines: number
  aiPercentage: number
  authorType: string
}

export interface AnalyzeResponse {
  id: number
  projectName: string
  fileName: string
  authorType: string
  totalLines: number
  aiGeneratedLines: number
  humanEditedLines: number
  aiPercentage: number
  modelUsed: string
  conversationId: string
  traceFormat: string
  complianceStatus: string
  files: FileTrace[]
  summary: {
    totalFiles: number
    avgAiPercentage: number
    complianceStatus: string
    recommendation: string
  }
}

export interface TraceFormat {
  id: string
  name: string
  description: string
  spec: string
  supporters: string[]
  fields: string[]
}

export interface TraceStats {
  total: number
  byAuthor: { authorType: string; count: number; avgAiPercentage: number }[]
}

export async function listTraces(): Promise<AgentTrace[]> {
  const res = await authFetch(`${API}/api/agent-trace`)
  if (!res.ok) return []
  return res.json()
}

export async function analyzeProject(projectName: string, fileName: string, modelUsed: string = 'claude-opus-4-6'): Promise<AnalyzeResponse> {
  const res = await authFetch(`${API}/api/agent-trace/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ projectName, fileName, modelUsed })
  })
  return res.json()
}

export async function deleteTrace(id: number): Promise<void> {
  await authFetch(`${API}/api/agent-trace/${id}`, { method: 'DELETE' })
}

export async function getTraceStats(): Promise<TraceStats> {
  const res = await authFetch(`${API}/api/agent-trace/stats`)
  if (!res.ok) return { total: 0, byAuthor: [] }
  return res.json()
}

export async function getTraceFormats(): Promise<TraceFormat[]> {
  const res = await fetch(`${API}/api/agent-trace/formats`)
  if (!res.ok) return []
  return res.json()
}
