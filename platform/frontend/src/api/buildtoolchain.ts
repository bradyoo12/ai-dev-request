import { authFetch } from './auth'

const API = import.meta.env.VITE_API_URL || ''

export interface BuildToolchainResult {
  id: string
  projectName: string
  bundler: string
  totalModules: number
  devStartupMs: number
  hmrLatencyMs: number
  buildDurationMs: number
  bundleSizeKb: number
  chunksGenerated: number
  treeShakingPercent: number
  codeSplitSavingsPercent: number
  speedupFactor: number
  fullBundleMode: boolean
  status: string
  createdAt: string
}

export interface BuildComparison {
  rolldown: { devMs: number; hmrMs: number; buildMs: number; bundleKb: number }
  esbuildRollup: { devMs: number; hmrMs: number; buildMs: number; bundleKb: number }
}

export interface BuildDetail {
  metric: string
  rolldown: string
  esbuild: string
  speedup: string
}

export interface BenchmarkResponse {
  result: BuildToolchainResult
  comparison: BuildComparison
  details: BuildDetail[]
}

export interface BundlerInfo {
  id: string
  name: string
  description: string
  speed: string
  language: string
  color: string
}

export interface BuildStats {
  totalBenchmarks: number
  avgSpeedup?: number
  avgBuildMs?: number
  avgBundleKb?: number
  avgTreeShaking?: number
  byBundler?: { bundler: string; count: number; avgBuildMs: number }[]
  byStatus?: { status: string; count: number }[]
}

export async function listBenchmarks(): Promise<BuildToolchainResult[]> {
  const res = await authFetch(`${API}/api/build-toolchain`)
  if (!res.ok) return []
  return res.json()
}

export async function runBenchmark(projectName: string, bundler: string, fullBundleMode: boolean): Promise<BenchmarkResponse> {
  const res = await authFetch(`${API}/api/build-toolchain/benchmark`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ projectName, bundler, fullBundleMode })
  })
  return res.json()
}

export async function deleteBenchmark(id: string): Promise<void> {
  await authFetch(`${API}/api/build-toolchain/${id}`, { method: 'DELETE' })
}

export async function getBuildStats(): Promise<BuildStats> {
  const res = await authFetch(`${API}/api/build-toolchain/stats`)
  if (!res.ok) return { totalBenchmarks: 0 }
  return res.json()
}

export async function getBundlers(): Promise<BundlerInfo[]> {
  const res = await fetch(`${API}/api/build-toolchain/bundlers`)
  if (!res.ok) return []
  return res.json()
}
