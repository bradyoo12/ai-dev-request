import { authFetch } from './auth'

export interface FigmaImport {
  id: string
  userId: string
  figmaFileKey: string
  figmaNodeId: string
  sourceType: string
  sourceUrl: string
  designName: string
  designTokensJson: string
  componentTreeJson: string
  generatedCodeJson: string
  status: string
  framework: string
  stylingLib: string
  componentCount: number
  tokenCount: number
  processingTimeMs: number
  errorMessage: string
  createdAt: string
  updatedAt: string
}

export interface FigmaImportStats {
  totalImports: number
  completedImports: number
  totalComponents: number
  totalTokens: number
  avgProcessingTime: number
  recentImports: { designName: string; sourceType: string; componentCount: number; status: string; createdAt: string }[]
}

export async function listImports(): Promise<FigmaImport[]> {
  const res = await authFetch('/api/figma-import/imports')
  if (!res.ok) throw new Error('Failed to list imports')
  return res.json()
}

export async function importFromUrl(data: {
  figmaUrl: string
  nodeId?: string
  designName?: string
  framework?: string
  stylingLib?: string
}): Promise<FigmaImport> {
  const res = await authFetch('/api/figma-import/import-url', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error('Failed to import from URL')
  return res.json()
}

export async function importFromScreenshot(data: {
  screenshotBase64?: string
  designName?: string
  framework?: string
  stylingLib?: string
}): Promise<FigmaImport> {
  const res = await authFetch('/api/figma-import/import-screenshot', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error('Failed to import from screenshot')
  return res.json()
}

export async function getImportTokens(id: string): Promise<{ tokens: string; components: string }> {
  const res = await authFetch(`/api/figma-import/imports/${id}/tokens`)
  if (!res.ok) throw new Error('Failed to get tokens')
  return res.json()
}

export async function getImportCode(id: string): Promise<{ code: string; framework: string; styling: string }> {
  const res = await authFetch(`/api/figma-import/imports/${id}/code`)
  if (!res.ok) throw new Error('Failed to get code')
  return res.json()
}

export async function deleteImport(id: string): Promise<void> {
  const res = await authFetch(`/api/figma-import/imports/${id}`, { method: 'DELETE' })
  if (!res.ok) throw new Error('Failed to delete import')
}

export async function getFigmaImportStats(): Promise<FigmaImportStats> {
  const res = await authFetch('/api/figma-import/stats')
  if (!res.ok) throw new Error('Failed to get stats')
  return res.json()
}
