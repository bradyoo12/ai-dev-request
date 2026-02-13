import { authFetch } from './auth'

const API = import.meta.env.VITE_API_URL || ''

export interface CodebaseGraph {
  id: string
  projectName: string
  totalNodes: number
  totalEdges: number
  components: number
  pages: number
  services: number
  utilities: number
  maxDepth: number
  avgConnections: number
  circularDeps: number
  couplingScore: number
  cohesionScore: number
  complexityScore: number
  analysisMode: string
  status: string
  createdAt: string
}

export interface NodeType {
  type: string
  count: number
  color: string
}

export interface ImpactFile {
  file: string
  impact: string
  connections: number
  ripple: number
}

export interface HealthMetric {
  metric: string
  value: string
  rating: string
  color: string
}

export interface AnalyzeResponse {
  graph: CodebaseGraph
  nodeTypes: NodeType[]
  impactFiles: ImpactFile[]
  healthMetrics: HealthMetric[]
}

export interface AffectedFile {
  file: string
  type: string
  impact: string
  severity: string
  reason: string
}

export interface ImpactResponse {
  targetFile: string
  directImpact: number
  indirectImpact: number
  totalAffected: number
  riskLevel: string
  affectedFiles: AffectedFile[]
  suggestion: string
}

export interface AnalysisMode {
  id: string
  name: string
  description: string
  icon: string
  color: string
}

export interface GraphStats {
  totalAnalyses: number
  avgNodes?: number
  avgEdges?: number
  avgCoupling?: number
  avgCohesion?: number
  avgComplexity?: number
  totalCircularDeps?: number
  byMode?: { mode: string; count: number; avgNodes: number }[]
  byStatus?: { status: string; count: number }[]
}

export async function listGraphs(): Promise<CodebaseGraph[]> {
  const res = await authFetch(`${API}/api/codebase-graph`)
  if (!res.ok) return []
  return res.json()
}

export async function analyzeCodebase(projectName: string, mode: string): Promise<AnalyzeResponse> {
  const res = await authFetch(`${API}/api/codebase-graph/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ projectName, mode })
  })
  return res.json()
}

export async function analyzeImpact(filePath: string, changeType: string): Promise<ImpactResponse> {
  const res = await authFetch(`${API}/api/codebase-graph/impact`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ filePath, changeType })
  })
  return res.json()
}

export async function deleteGraph(id: string): Promise<void> {
  await authFetch(`${API}/api/codebase-graph/${id}`, { method: 'DELETE' })
}

export async function getGraphStats(): Promise<GraphStats> {
  const res = await authFetch(`${API}/api/codebase-graph/stats`)
  if (!res.ok) return { totalAnalyses: 0 }
  return res.json()
}

export async function getModes(): Promise<AnalysisMode[]> {
  const res = await fetch(`${API}/api/codebase-graph/modes`)
  if (!res.ok) return []
  return res.json()
}
