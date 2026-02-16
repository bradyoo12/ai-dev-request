import { authFetch } from './auth'

const API = import.meta.env.VITE_API_URL || ''

export interface ReactPerformanceConfig {
  id: string
  codeSplittingEnabled: boolean
  lazyLoadingEnabled: boolean
  suspenseBoundariesEnabled: boolean
  useTransitionEnabled: boolean
  totalLazyRoutes: number
  totalSuspenseBoundaries: number
  estimatedBundleReductionPercent: number
  reactVersion: string
  buildTool: string
  createdAt: string
  updatedAt: string
}

export interface ReactPerformanceStats {
  initialBundleSizeKb: number
  optimizedBundleSizeKb: number
  reductionPercent: number
  lazyChunksCount: number
  avgChunkSizeKb: number
  largestChunkKb: string
  codePointsCount: number
}

export async function getReactPerformanceConfig(): Promise<ReactPerformanceConfig> {
  const res = await authFetch(`${API}/api/react-performance/config`)
  if (!res.ok) {
    return {
      id: 'default',
      codeSplittingEnabled: true,
      lazyLoadingEnabled: true,
      suspenseBoundariesEnabled: true,
      useTransitionEnabled: true,
      totalLazyRoutes: 0,
      totalSuspenseBoundaries: 0,
      estimatedBundleReductionPercent: 0,
      reactVersion: '19.0.0',
      buildTool: 'Vite 7',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
  }
  return res.json()
}

export async function getReactPerformanceStats(): Promise<ReactPerformanceStats> {
  const res = await authFetch(`${API}/api/react-performance/stats`)
  if (!res.ok) {
    return {
      initialBundleSizeKb: 0,
      optimizedBundleSizeKb: 0,
      reductionPercent: 0,
      lazyChunksCount: 0,
      avgChunkSizeKb: 0,
      largestChunkKb: '—',
      codePointsCount: 0,
    }
  }
  return res.json()
}

export async function updateReactPerformanceConfig(
  updates: Partial<ReactPerformanceConfig>
): Promise<ReactPerformanceConfig> {
  const res = await authFetch(`${API}/api/react-performance/config`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  })
  return res.json()
}
