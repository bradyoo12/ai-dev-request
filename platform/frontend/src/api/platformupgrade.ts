import { authFetch } from './auth'

const API = import.meta.env.VITE_API_URL || ''

export interface PlatformStatus {
  currentDotNetVersion: string
  currentEfCoreVersion: string
  currentCSharpVersion: string
  vectorSearchEnabled: boolean
  nativeJsonColumnsEnabled: boolean
  leftJoinLinqEnabled: boolean
  performanceProfilingEnabled: boolean
  upgradeStatus: string
}

export interface PerformanceMetrics {
  avgQueryTimeMs: number
  p95QueryTimeMs: number
  p99QueryTimeMs: number
  totalQueriesExecuted: number
  cacheHitRate: number
  memoryUsageMb: number
  cpuUsagePercent: number
  throughputRequestsPerSec: number
  lastProfiledAt: string | null
}

export interface VectorSearchStats {
  vectorIndexCount: number
  vectorDimensions: number
  vectorSearchAvgMs: number
  enabled: boolean
}

export interface DotNetFeature {
  name: string
  category: string
  description: string
  status: string
}

export interface BenchmarkResults {
  queryBenchmark: { net9Ms: number; net10Ms: number; improvement: string }
  serializationBenchmark: { net9Ms: number; net10Ms: number; improvement: string }
  startupBenchmark: { net9Ms: number; net10Ms: number; improvement: string }
  memoryBenchmark: { net9Mb: number; net10Mb: number; improvement: string }
  vectorSearchBenchmark: { avgMs: number; p95Ms: number; throughput: string }
}

export async function getUpgradeStatus(): Promise<PlatformStatus> {
  const res = await authFetch(`${API}/api/platform-upgrade/status`)
  if (!res.ok) throw new Error('Failed to load platform status')
  return res.json()
}

export async function updateSettings(data: {
  vectorSearchEnabled?: boolean
  nativeJsonColumnsEnabled?: boolean
  leftJoinLinqEnabled?: boolean
  performanceProfilingEnabled?: boolean
}): Promise<{ success: boolean }> {
  const res = await authFetch(`${API}/api/platform-upgrade/settings`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error('Failed to update settings')
  return res.json()
}

export async function getPerformanceMetrics(): Promise<PerformanceMetrics> {
  const res = await authFetch(`${API}/api/platform-upgrade/performance`)
  if (!res.ok) throw new Error('Failed to load performance metrics')
  return res.json()
}

export async function getVectorSearchStats(): Promise<VectorSearchStats> {
  const res = await authFetch(`${API}/api/platform-upgrade/vector-search`)
  if (!res.ok) throw new Error('Failed to load vector search stats')
  return res.json()
}

export async function getDotNetFeatures(): Promise<DotNetFeature[]> {
  const res = await authFetch(`${API}/api/platform-upgrade/features`)
  if (!res.ok) throw new Error('Failed to load features')
  return res.json()
}

export async function runBenchmark(): Promise<BenchmarkResults> {
  const res = await authFetch(`${API}/api/platform-upgrade/run-benchmark`, { method: 'POST' })
  if (!res.ok) throw new Error('Failed to run benchmark')
  return res.json()
}
