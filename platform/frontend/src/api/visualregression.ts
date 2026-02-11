import { authFetch } from './auth'

const API = import.meta.env.VITE_API_URL || ''

export interface VisualRegressionResult {
  id: string
  projectName: string
  pageUrl: string
  viewportSize: string
  baselineImageUrl: string
  comparisonImageUrl: string
  diffImageUrl: string
  mismatchPercentage: number
  threshold: number
  status: string
  passed: boolean
  pixelsDifferent: number
  totalPixels: number
  ignoreRegionsJson: string
  metadataJson: string
  captureTimeMs: number
  compareTimeMs: number
  createdAt: string
  updatedAt: string
}

export interface Viewport {
  id: string
  name: string
  width: number
  height: number
}

export interface VisualRegressionStats {
  totalTests: number
  passedTests: number
  failedTests: number
  passRate: number
  avgMismatch: number
  totalPixelsAnalyzed: number
  recentResults: { projectName: string; pageUrl: string; mismatchPercentage: number; passed: boolean; status: string; createdAt: string }[]
}

export async function listResults(): Promise<VisualRegressionResult[]> {
  const res = await authFetch(`${API}/api/visual-regression/results`)
  if (!res.ok) throw new Error('Failed to load results')
  return res.json()
}

export async function captureBaseline(projectName: string, pageUrl: string, viewportSize?: string, threshold?: number): Promise<VisualRegressionResult> {
  const res = await authFetch(`${API}/api/visual-regression/capture`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ projectName, pageUrl, viewportSize, threshold }),
  })
  if (!res.ok) throw new Error('Failed to capture baseline')
  return res.json()
}

export async function runComparison(projectName: string, pageUrl?: string, viewportSize?: string, threshold?: number): Promise<VisualRegressionResult> {
  const res = await authFetch(`${API}/api/visual-regression/compare`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ projectName, pageUrl, viewportSize, threshold }),
  })
  if (!res.ok) throw new Error('Failed to run comparison')
  return res.json()
}

export async function getViewports(): Promise<Viewport[]> {
  const res = await authFetch(`${API}/api/visual-regression/viewports`)
  if (!res.ok) throw new Error('Failed to load viewports')
  return res.json()
}

export async function getVisualRegressionStats(): Promise<VisualRegressionStats> {
  const res = await authFetch(`${API}/api/visual-regression/stats`)
  if (!res.ok) throw new Error('Failed to load stats')
  return res.json()
}
