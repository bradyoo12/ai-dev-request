import { authFetch } from './auth'

const API = import.meta.env.VITE_API_URL || ''

export interface ReactUseHookDemo {
  id: string
  componentName: string
  dataSource: string
  pattern: string
  suspenseEnabled: boolean
  errorBoundaryEnabled: boolean
  requestDedup: boolean
  renderTimeMs: number
  dataFetchMs: number
  reRenderCount: number
  boilerplateLines: number
  performanceScore: number
  status: string
  createdAt: string
}

export interface BenchmarkResponse {
  component: string
  useHook: ReactUseHookDemo
  useEffect: {
    pattern: string
    suspenseEnabled: boolean
    errorBoundaryEnabled: boolean
    requestDedup: boolean
    renderTimeMs: number
    dataFetchMs: number
    reRenderCount: number
    boilerplateLines: number
    performanceScore: number
  }
  improvement: {
    renderTimeReduction: string
    fetchTimeReduction: string
    reRenderReduction: string
    boilerplateReduction: string
    scoreImprovement: string
  }
  codeComparison: { before: string; after: string }
}

export interface DataPattern {
  id: string
  name: string
  description: string
  recommended: boolean
  color: string
}

export interface UseHookStats {
  totalBenchmarks: number
  avgRenderTimeMs?: number
  avgDataFetchMs?: number
  avgPerformanceScore?: number
  avgBoilerplateLines?: number
  byDataSource?: { dataSource: string; count: number; avgPerformanceScore: number }[]
}

export async function listDemos(): Promise<ReactUseHookDemo[]> {
  const res = await authFetch(`${API}/api/react-use-hook`)
  if (!res.ok) return []
  return res.json()
}

export async function runBenchmark(componentName: string, dataSource: string): Promise<BenchmarkResponse> {
  const res = await authFetch(`${API}/api/react-use-hook/benchmark`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ componentName, dataSource })
  })
  return res.json()
}

export async function deleteDemo(id: string): Promise<void> {
  await authFetch(`${API}/api/react-use-hook/${id}`, { method: 'DELETE' })
}

export async function getUseHookStats(): Promise<UseHookStats> {
  const res = await authFetch(`${API}/api/react-use-hook/stats`)
  if (!res.ok) return { totalBenchmarks: 0 }
  return res.json()
}

export async function getPatterns(): Promise<DataPattern[]> {
  const res = await fetch(`${API}/api/react-use-hook/patterns`)
  if (!res.ok) return []
  return res.json()
}
