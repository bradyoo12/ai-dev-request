import { authFetch } from './auth'

const API = import.meta.env.VITE_API_URL || ''

export interface VisionToCodeResult {
  id: string
  imageName: string
  imageType: string
  componentsGenerated: number
  linesOfCode: number
  framework: string
  stylingEngine: string
  styleMatchScore: number
  layoutAccuracy: number
  colorAccuracy: number
  typographyAccuracy: number
  processingMs: number
  refinements: number
  status: string
  createdAt: string
}

export interface GeneratedComponent {
  name: string
  type: string
  lines: number
  confidence: number
}

export interface StyleAnalysis {
  primaryColor: string
  secondaryColor: string
  backgroundColor: string
  fontFamily: string
  fontSize: string
  borderRadius: string
  spacing: string
}

export interface AccuracyItem {
  metric: string
  score: number
  rating: string
}

export interface GenerateResponse {
  result: VisionToCodeResult
  generatedComponents: GeneratedComponent[]
  styleAnalysis: StyleAnalysis
  accuracyBreakdown: AccuracyItem[]
}

export interface ImageTypeInfo {
  id: string
  name: string
  description: string
  icon: string
  color: string
}

export interface VisionStats {
  totalGenerations: number
  totalComponents?: number
  totalLines?: number
  avgStyleMatch?: number
  avgLayoutAccuracy?: number
  avgColorAccuracy?: number
  avgProcessingMs?: number
  byImageType?: { imageType: string; count: number; avgMatch: number }[]
  byFramework?: { framework: string; count: number; avgLines: number }[]
}

export async function listGenerations(): Promise<VisionToCodeResult[]> {
  const res = await authFetch(`${API}/api/vision-to-code`)
  if (!res.ok) return []
  return res.json()
}

export async function generate(imageName: string, imageType: string, framework: string, stylingEngine: string): Promise<GenerateResponse> {
  const res = await authFetch(`${API}/api/vision-to-code/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ imageName, imageType, framework, stylingEngine })
  })
  return res.json()
}

export async function deleteGeneration(id: string): Promise<void> {
  await authFetch(`${API}/api/vision-to-code/${id}`, { method: 'DELETE' })
}

export async function getVisionStats(): Promise<VisionStats> {
  const res = await authFetch(`${API}/api/vision-to-code/stats`)
  if (!res.ok) return { totalGenerations: 0 }
  return res.json()
}

export async function getImageTypes(): Promise<ImageTypeInfo[]> {
  const res = await fetch(`${API}/api/vision-to-code/image-types`)
  if (!res.ok) return []
  return res.json()
}
