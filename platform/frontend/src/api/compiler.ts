import i18n from '../i18n'
import { getAuthHeaders } from './auth'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

const t = (key: string) => i18n.t(key)

function authHeaders(): Record<string, string> {
  return getAuthHeaders()
}

export interface CompilerError {
  file?: string
  line?: number
  message: string
}

export interface CompilationOutput {
  resultId: string
  success: boolean
  errors: CompilerError[]
  warnings: CompilerError[]
  rawOutput: string
  retryCount: number
}

export interface CompilationResultResponse {
  id: string
  devRequestId: string
  language: string
  success: boolean
  errorsJson: string
  warningsJson: string
  retryCount: number
  compiledAt: string
}

export interface SupportedLanguage {
  id: string
  name: string
  command: string
  extensions: string[]
}

export async function triggerCompilation(requestId: string, language: string): Promise<CompilationOutput> {
  const response = await fetch(
    `${API_BASE_URL}/api/projects/${requestId}/compiler/validate?language=${encodeURIComponent(language)}`,
    { method: 'POST', headers: authHeaders() }
  )
  if (!response.ok) {
    const body = await response.json().catch(() => ({}))
    throw new Error(body.error || t('api.error.compilationFailed'))
  }
  return response.json()
}

export async function getCompilationResult(requestId: string): Promise<CompilationResultResponse | null> {
  const response = await fetch(
    `${API_BASE_URL}/api/projects/${requestId}/compiler/result`,
    { headers: authHeaders() }
  )
  if (!response.ok) return null
  return response.json()
}

export async function triggerAutoFix(requestId: string): Promise<CompilationOutput> {
  const response = await fetch(
    `${API_BASE_URL}/api/projects/${requestId}/compiler/fix`,
    { method: 'POST', headers: authHeaders() }
  )
  if (!response.ok) {
    const body = await response.json().catch(() => ({}))
    throw new Error(body.error || t('api.error.autoFixFailed'))
  }
  return response.json()
}

export async function getSupportedLanguages(): Promise<SupportedLanguage[]> {
  const response = await fetch(`${API_BASE_URL}/api/compiler/languages`, {
    headers: authHeaders(),
  })
  if (!response.ok) return []
  return response.json()
}
