import { getAuthHeaders } from './auth'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

function authHeaders(): Record<string, string> {
  return getAuthHeaders()
}

// === Interfaces ===

export interface PatentInnovation {
  id: string
  title: string
  category: string // "Tier 1", "Tier 2", "Tier 3"
  patentAngle: string
  innovation: string
  uniqueness: string
  priorArt: string
  relatedFiles: string // comma-separated
  status: string // Identified, Drafted, Filed, Granted
  noveltyScore: number
  nonObviousnessScore: number
  utilityScore: number
  commercialValueScore: number
  createdAt: string
  updatedAt: string
}

export interface PatentStats {
  total: number
  byTier: { tier: string; count: number; avgScore: number }[]
  byStatus: { status: string; count: number }[]
}

export interface PatentDraftResponse {
  draft: string
}

// === API Functions ===

export async function getInnovations(): Promise<PatentInnovation[]> {
  const response = await fetch(`${API_BASE_URL}/api/patent-agent`, { headers: authHeaders() })
  if (!response.ok) throw new Error('Failed to load innovations')
  return response.json()
}

export async function getInnovationById(id: string): Promise<PatentInnovation> {
  const response = await fetch(`${API_BASE_URL}/api/patent-agent/${id}`, { headers: authHeaders() })
  if (!response.ok) throw new Error('Failed to load innovation')
  return response.json()
}

export async function analyzeCodebase(): Promise<PatentInnovation[]> {
  const response = await fetch(`${API_BASE_URL}/api/patent-agent/analyze`, {
    method: 'POST',
    headers: authHeaders(),
  })
  if (!response.ok) throw new Error('Failed to analyze codebase')
  return response.json()
}

export async function generatePatentDraft(id: string): Promise<PatentDraftResponse> {
  const response = await fetch(`${API_BASE_URL}/api/patent-agent/${id}/draft`, {
    method: 'POST',
    headers: authHeaders(),
  })
  if (!response.ok) { const error = await response.json().catch(() => ({})); throw new Error(error.error || 'Failed to generate patent draft') }
  return response.json()
}

export async function getPatentStats(): Promise<PatentStats> {
  const response = await fetch(`${API_BASE_URL}/api/patent-agent/stats`, { headers: authHeaders() })
  if (!response.ok) throw new Error('Failed to load patent stats')
  return response.json()
}
