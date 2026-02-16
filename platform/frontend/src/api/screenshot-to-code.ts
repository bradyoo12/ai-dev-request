import { authFetch } from './auth'

export interface ScreenshotConversion {
  id: string
  userId: string
  designName: string
  imageFileName: string
  imageContentType: string
  imageSizeBytes: number
  analysisJson: string
  generatedCodeJson: string
  componentTreeJson: string
  status: string
  framework: string
  stylingLib: string
  componentCount: number
  processingTimeMs: number
  errorMessage: string
  createdAt: string
  updatedAt: string
}

export interface ScreenshotToCodeStats {
  totalConversions: number
  completedConversions: number
  failedConversions: number
  totalComponents: number
  avgProcessingTime: number
  recentConversions: {
    designName: string
    componentCount: number
    status: string
    framework: string
    processingTimeMs: number
    createdAt: string
  }[]
}

export async function convertScreenshot(data: {
  imageBase64: string
  designName?: string
  framework?: string
  stylingLib?: string
}): Promise<ScreenshotConversion> {
  const res = await authFetch('/api/screenshot-to-code/convert', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error('Failed to convert screenshot')
  return res.json()
}

export async function listConversions(): Promise<ScreenshotConversion[]> {
  const res = await authFetch('/api/screenshot-to-code/conversions')
  if (!res.ok) throw new Error('Failed to list conversions')
  return res.json()
}

export async function getConversionCode(id: string): Promise<{ code: string; framework: string; styling: string }> {
  const res = await authFetch(`/api/screenshot-to-code/conversions/${id}/code`)
  if (!res.ok) throw new Error('Failed to get code')
  return res.json()
}

export async function deleteConversion(id: string): Promise<void> {
  const res = await authFetch(`/api/screenshot-to-code/conversions/${id}`, { method: 'DELETE' })
  if (!res.ok) throw new Error('Failed to delete conversion')
}

export async function getScreenshotToCodeStats(): Promise<ScreenshotToCodeStats> {
  const res = await authFetch('/api/screenshot-to-code/stats')
  if (!res.ok) throw new Error('Failed to get stats')
  return res.json()
}
