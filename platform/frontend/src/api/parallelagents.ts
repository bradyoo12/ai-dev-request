import { authFetch } from './auth'

const API = import.meta.env.VITE_API_URL || ''

export interface ParallelAgentRun {
  id: string
  projectName: string
  taskDescription: string
  agentCount: number
  subtasksTotal: number
  subtasksCompleted: number
  mergeConflicts: number
  autoResolved: number
  filesModified: number
  linesChanged: number
  durationMs: number
  speedupFactor: number
  isolationMode: string
  status: string
  createdAt: string
}

export interface AgentDetail {
  name: string
  worktree: string
  status: string
  tasksCompleted: number
  filesModified: number
  linesChanged: number
  durationMs: number
  branch: string
}

export interface SubtaskDetail {
  id: number
  description: string
  assignedTo: string
  status: string
  filesChanged: number
  durationMs: number
}

export interface MergePhase {
  phase: string
  durationMs: number
  status: string
}

export interface ExecuteResponse {
  run: ParallelAgentRun
  agentDetails: AgentDetail[]
  subtaskDetails: SubtaskDetail[]
  mergeTimeline: MergePhase[]
  comparison: {
    sequential: { durationMs: number; agents: number }
    parallel: { durationMs: number; agents: number }
    speedup: number
  }
}

export interface IsolationMode {
  id: string
  name: string
  description: string
  recommended: boolean
  color: string
}

export interface AgentStats {
  totalRuns: number
  avgAgents?: number
  avgSpeedup?: number
  totalSubtasks?: number
  totalConflicts?: number
  totalAutoResolved?: number
  totalFilesModified?: number
  totalLinesChanged?: number
  byIsolation?: { mode: string; count: number; avgSpeedup: number }[]
}

export async function listRuns(): Promise<ParallelAgentRun[]> {
  const res = await authFetch(`${API}/api/parallel-agents`)
  if (!res.ok) return []
  return res.json()
}

export async function execute(projectName: string, taskDescription: string, agentCount: number, isolationMode: string): Promise<ExecuteResponse> {
  const res = await authFetch(`${API}/api/parallel-agents/execute`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ projectName, taskDescription, agentCount, isolationMode })
  })
  return res.json()
}

export async function deleteRun(id: string): Promise<void> {
  await authFetch(`${API}/api/parallel-agents/${id}`, { method: 'DELETE' })
}

export async function getAgentStats(): Promise<AgentStats> {
  const res = await authFetch(`${API}/api/parallel-agents/stats`)
  if (!res.ok) return { totalRuns: 0 }
  return res.json()
}

export async function getModes(): Promise<IsolationMode[]> {
  const res = await fetch(`${API}/api/parallel-agents/modes`)
  if (!res.ok) return []
  return res.json()
}
