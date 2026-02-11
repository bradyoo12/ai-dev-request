import { authFetch } from './auth'

const API = import.meta.env.VITE_API_URL || ''

export interface NlSchema {
  id: string
  schemaName: string
  naturalLanguageInput: string
  generatedSql: string
  tablesJson: string
  relationshipsJson: string
  indexesJson: string
  rlsPoliciesJson: string
  seedDataJson: string
  conversationJson: string
  exportFormat: string
  databaseType: string
  tableCount: number
  columnCount: number
  relationshipCount: number
  refinementCount: number
  tokensUsed: number
  estimatedCost: number
  generationTimeMs: number
  isPublic: boolean
  viewCount: number
  forkCount: number
  createdAt: string
  updatedAt: string
}

export interface SchemaTable {
  name: string
  columns: { name: string; type: string; primaryKey: boolean; nullable: boolean }[]
}

export interface SchemaRelationship {
  from: string
  to: string
  type: string
  onDelete: string
}

export interface ExportFormat {
  id: string
  name: string
  description: string
  extension: string
}

export interface NlSchemaStats {
  totalSchemas: number
  totalTables: number
  totalRelationships: number
  totalRefinements: number
  totalTokensUsed: number
  favoriteDatabase: string
  recentSchemas: { schemaName: string; databaseType: string; tableCount: number; createdAt: string }[]
}

export async function listSchemas(dbType?: string): Promise<NlSchema[]> {
  const params = dbType ? `?dbType=${dbType}` : ''
  const res = await authFetch(`${API}/api/nl-schema/schemas${params}`)
  if (!res.ok) throw new Error('Failed to load schemas')
  return res.json()
}

export async function getSchema(id: string): Promise<NlSchema> {
  const res = await authFetch(`${API}/api/nl-schema/schemas/${id}`)
  if (!res.ok) throw new Error('Failed to load schema')
  return res.json()
}

export async function generateSchema(description: string, schemaName?: string, databaseType?: string): Promise<NlSchema> {
  const res = await authFetch(`${API}/api/nl-schema/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ description, schemaName, databaseType }),
  })
  if (!res.ok) throw new Error('Failed to generate schema')
  return res.json()
}

export async function refineSchema(id: string, message: string): Promise<NlSchema> {
  const res = await authFetch(`${API}/api/nl-schema/schemas/${id}/refine`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message }),
  })
  if (!res.ok) throw new Error('Failed to refine schema')
  return res.json()
}

export async function getExportFormats(): Promise<ExportFormat[]> {
  const res = await authFetch(`${API}/api/nl-schema/export-formats`)
  if (!res.ok) throw new Error('Failed to load formats')
  return res.json()
}

export async function getSchemaGallery(): Promise<NlSchema[]> {
  const res = await authFetch(`${API}/api/nl-schema/gallery`)
  if (!res.ok) throw new Error('Failed to load gallery')
  return res.json()
}

export async function getNlSchemaStats(): Promise<NlSchemaStats> {
  const res = await authFetch(`${API}/api/nl-schema/stats`)
  if (!res.ok) throw new Error('Failed to load stats')
  return res.json()
}
