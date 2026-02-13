import { authFetch } from './auth'

const API = import.meta.env.VITE_API_URL || ''

export interface DotnetUpgradeResult {
  id: string
  projectName: string
  currentVersion: string
  targetVersion: string
  packagesUpgraded: number
  breakingChanges: number
  deprecationWarnings: number
  cSharp14Adoptions: number
  startupTimeReduction: number
  memoryReduction: number
  throughputIncrease: number
  vectorSearchEnabled: boolean
  nativeAotEnabled: boolean
  mcpSupportEnabled: boolean
  analysisDurationMs: number
  status: string
  createdAt: string
}

export interface PackageUpgrade {
  name: string
  from: string
  to: string
  hasBreaking: boolean
}

export interface CSharp14Feature {
  feature: string
  description: string
  adoptions: number
  effort: string
}

export interface PerfComparison {
  metric: string
  net9: string
  net10: string
  improvement: string
}

export interface AnalyzeResponse {
  result: DotnetUpgradeResult
  packageUpgrades: PackageUpgrade[]
  csharp14Features: CSharp14Feature[]
  performanceComparison: PerfComparison[]
}

export interface DotnetFeature {
  id: string
  name: string
  description: string
  category: string
  color: string
}

export interface UpgradeStats {
  totalAnalyses: number
  avgStartupReduction?: number
  avgMemoryReduction?: number
  avgThroughputIncrease?: number
  totalPackagesUpgraded?: number
  totalBreakingChanges?: number
  totalCSharp14Adoptions?: number
  vectorSearchEnabled?: number
  byVersion?: { version: string; count: number; avgImprovement: number }[]
}

export async function listUpgrades(): Promise<DotnetUpgradeResult[]> {
  const res = await authFetch(`${API}/api/dotnet-upgrade`)
  if (!res.ok) return []
  return res.json()
}

export async function analyzeUpgrade(projectName: string, currentVersion: string, enableVectorSearch: boolean, enableNativeAot: boolean, enableMcpSupport: boolean): Promise<AnalyzeResponse> {
  const res = await authFetch(`${API}/api/dotnet-upgrade/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ projectName, currentVersion, enableVectorSearch, enableNativeAot, enableMcpSupport })
  })
  return res.json()
}

export async function deleteUpgrade(id: string): Promise<void> {
  await authFetch(`${API}/api/dotnet-upgrade/${id}`, { method: 'DELETE' })
}

export async function getUpgradeStats(): Promise<UpgradeStats> {
  const res = await authFetch(`${API}/api/dotnet-upgrade/stats`)
  if (!res.ok) return { totalAnalyses: 0 }
  return res.json()
}

export async function getFeatures(): Promise<DotnetFeature[]> {
  const res = await fetch(`${API}/api/dotnet-upgrade/features`)
  if (!res.ok) return []
  return res.json()
}
