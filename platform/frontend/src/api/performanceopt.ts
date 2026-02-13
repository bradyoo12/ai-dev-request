import { authFetch } from './auth'

const API = import.meta.env.VITE_API_URL || ''

export interface PerformanceOptimization {
  id: string
  userId: string
  projectName: string
  category: string
  enabled: boolean
  baselineLatencyMs: number
  optimizedLatencyMs: number
  improvementPercent: number
  memoryBeforeMb: number
  memoryAfterMb: number
  memorySavedPercent: number
  benchmarkRuns: number
  throughputRps: number
  status: string
  notes: string
  createdAt: string
  updatedAt: string
}

export interface BenchmarkDetail {
  metric: string
  before: string
  after: string
  improvement: string
}

export interface BenchmarkResponse {
  optimization: PerformanceOptimization
  benchmarkDetails: BenchmarkDetail[]
}

export interface OptCategory {
  id: string
  name: string
  description: string
  color: string
  improvement: string
}

export interface OptStats {
  totalOptimizations: number
  avgImprovement: number
  avgMemorySaved: number
  totalBenchmarks: number
  avgThroughput: number
  byCategory: { category: string; count: number; avgImprovement: number }[]
  byStatus: { status: string; count: number }[]
}

export async function listOptimizations(): Promise<PerformanceOptimization[]> {
  const res = await authFetch(`${API}/api/performance-opt`)
  if (!res.ok) return []
  return res.json()
}

export async function runBenchmark(projectName: string, category?: string): Promise<BenchmarkResponse> {
  const res = await authFetch(`${API}/api/performance-opt/benchmark`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ projectName, category }),
  })
  return res.json()
}

export async function deleteOptimization(id: string): Promise<void> {
  await authFetch(`${API}/api/performance-opt/${id}`, { method: 'DELETE' })
}

export async function getOptStats(): Promise<OptStats> {
  const res = await authFetch(`${API}/api/performance-opt/stats`)
  if (!res.ok) return { totalOptimizations: 0, avgImprovement: 0, avgMemorySaved: 0, totalBenchmarks: 0, avgThroughput: 0, byCategory: [], byStatus: [] }
  return res.json()
}

export async function getCategories(): Promise<OptCategory[]> {
  const res = await fetch(`${API}/api/performance-opt/categories`)
  if (!res.ok) return []
  return res.json()
}
