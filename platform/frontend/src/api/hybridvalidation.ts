import { authFetch } from './auth'

const API = import.meta.env.VITE_API_URL || ''

export interface HybridValidation {
  id: number
  projectName: string
  operationType: string
  aiOutput: string
  validationResult: string
  retryCount: number
  maxRetries: number
  usedFallback: boolean
  fallbackAction: string
  failureReason: string
  rulesApplied: string
  rulesPassedCount: number
  rulesFailedCount: number
  confidenceScore: number
  validationTimeMs: number
  status: string
  createdAt: string
}

export interface ValidateResponse {
  id: number
  projectName: string
  operationType: string
  validationResult: string
  retryCount: number
  usedFallback: boolean
  fallbackAction: string
  failureReason: string
  rulesPassedCount: number
  rulesFailedCount: number
  confidenceScore: number
  validationTimeMs: number
  rulesApplied: string[]
  passedRules: string[]
  failedRules: string[]
  recommendation: string
}

export interface OperationType {
  id: string
  name: string
  description: string
  severity: string
  rules: string[]
}

export interface ValidationStats {
  total: number
  byType: { type: string; count: number; avgConfidence: number }[]
}

export async function listValidations(): Promise<HybridValidation[]> {
  const res = await authFetch(`${API}/api/hybrid-validation`)
  if (!res.ok) return []
  return res.json()
}

export async function validateOperation(projectName: string, operationType: string, aiOutput: string): Promise<ValidateResponse> {
  const res = await authFetch(`${API}/api/hybrid-validation/validate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ projectName, operationType, aiOutput })
  })
  return res.json()
}

export async function deleteValidation(id: number): Promise<void> {
  await authFetch(`${API}/api/hybrid-validation/${id}`, { method: 'DELETE' })
}

export async function getValidationStats(): Promise<ValidationStats> {
  const res = await authFetch(`${API}/api/hybrid-validation/stats`)
  if (!res.ok) return { total: 0, byType: [] }
  return res.json()
}

export async function getOperationTypes(): Promise<OperationType[]> {
  const res = await fetch(`${API}/api/hybrid-validation/operations`)
  if (!res.ok) return []
  return res.json()
}
