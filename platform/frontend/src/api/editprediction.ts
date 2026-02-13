import { authFetch } from './auth'

const API = import.meta.env.VITE_API_URL || ''

export interface EditPrediction {
  id: string
  projectName: string
  sourceFile: string
  changeType: string
  changeDescription: string
  affectedFiles: number
  predictedEdits: number
  acceptedEdits: number
  confidence: number
  rippleDepth: number
  dependencyNodes: number
  importReferences: number
  typeReferences: number
  testFilesAffected: number
  analysisTimeMs: number
  status: string
  createdAt: string
}

export interface PredictionItem {
  file: string
  editType: string
  confidence: number
  description: string
  lineRange: { start: number; end: number }
}

export interface AnalyzeResponse {
  prediction: EditPrediction
  predictions: PredictionItem[]
  dependencyGraph: { nodes: number; edges: number; maxDepth: number; hotspots: number }
}

export interface ChangeType {
  id: string
  name: string
  description: string
  impact: string
}

export interface EditPredictionStats {
  totalAnalyses: number
  avgAffectedFiles?: number
  avgConfidence?: number
  avgRippleDepth?: number
  avgAnalysisTimeMs?: number
  totalPredictedEdits?: number
  byChangeType?: { changeType: string; count: number; avgConfidence: number }[]
}

export async function listPredictions(): Promise<EditPrediction[]> {
  const res = await authFetch(`${API}/api/edit-prediction`)
  if (!res.ok) return []
  return res.json()
}

export async function analyze(projectName: string, sourceFile: string, changeType: string, changeDescription: string): Promise<AnalyzeResponse> {
  const res = await authFetch(`${API}/api/edit-prediction/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ projectName, sourceFile, changeType, changeDescription })
  })
  return res.json()
}

export async function deletePrediction(id: string): Promise<void> {
  await authFetch(`${API}/api/edit-prediction/${id}`, { method: 'DELETE' })
}

export async function getPredictionStats(): Promise<EditPredictionStats> {
  const res = await authFetch(`${API}/api/edit-prediction/stats`)
  if (!res.ok) return { totalAnalyses: 0 }
  return res.json()
}

export async function getChangeTypes(): Promise<ChangeType[]> {
  const res = await fetch(`${API}/api/edit-prediction/change-types`)
  if (!res.ok) return []
  return res.json()
}
