import { authFetch } from './auth'

const API = import.meta.env.VITE_API_URL || ''

export interface TursoDatabase {
  id: string
  projectName: string
  databaseName: string
  region: string
  replicaCount: number
  replicaRegions: string[]
  sizeBytes: number
  tableCount: number
  vectorSearchEnabled: boolean
  vectorDimensions: number
  schemaBranchingEnabled: boolean
  activeBranches: number
  embeddedReplicaEnabled: boolean
  readLatencyMs: number
  writeLatencyMs: number
  totalReads: number
  totalWrites: number
  syncMode: string
  status: string
  createdAt: string
}

export interface ProvisionResponse {
  database: TursoDatabase
  connectionUrl: string
  features: {
    vectorSearch: { enabled: boolean; dimensions: number; similarity: string } | null
    schemaBranching: { enabled: boolean; activeBranches: number; mainBranch: string } | null
    embeddedReplica: { enabled: boolean; syncInterval: string; offlineCapable: boolean } | null
    globalReplication: { enabled: boolean; primary: string; replicas: string[] } | null
  }
  provisionTimeMs: number
}

export interface TursoRegion {
  id: string
  name: string
  latency: string
}

export interface TursoStats {
  totalDatabases: number
  totalReplicas?: number
  vectorEnabled?: number
  branchingEnabled?: number
  avgReadLatencyMs?: number
  avgWriteLatencyMs?: number
  totalSizeBytes?: number
  byRegion?: { region: string; count: number; avgReadLatencyMs: number }[]
}

export async function listDatabases(): Promise<TursoDatabase[]> {
  const res = await authFetch(`${API}/api/turso-database`)
  if (!res.ok) return []
  return res.json()
}

export async function provisionDatabase(
  projectName: string,
  region: string | null,
  enableVectorSearch: boolean,
  vectorDimensions: number,
  enableSchemaBranching: boolean,
  enableEmbeddedReplica: boolean,
  enableGlobalReplication: boolean,
  syncMode: string
): Promise<ProvisionResponse> {
  const res = await authFetch(`${API}/api/turso-database/provision`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ projectName, region, enableVectorSearch, vectorDimensions, enableSchemaBranching, enableEmbeddedReplica, enableGlobalReplication, syncMode })
  })
  return res.json()
}

export async function deleteDatabase(id: string): Promise<void> {
  await authFetch(`${API}/api/turso-database/${id}`, { method: 'DELETE' })
}

export async function getTursoStats(): Promise<TursoStats> {
  const res = await authFetch(`${API}/api/turso-database/stats`)
  if (!res.ok) return { totalDatabases: 0 }
  return res.json()
}

export async function getRegions(): Promise<TursoRegion[]> {
  const res = await fetch(`${API}/api/turso-database/regions`)
  if (!res.ok) return []
  return res.json()
}
