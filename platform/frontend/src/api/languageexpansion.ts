import { authFetch } from './auth'

const API = import.meta.env.VITE_API_URL || ''

export interface LanguageExpansion {
  id: string
  projectName: string
  sourceLanguage: string
  targetLanguage: string
  keysTranslated: number
  totalKeys: number
  coveragePercent: number
  qualityScore: number
  machineTranslated: boolean
  humanReviewed: boolean
  missingKeys: number
  pluralizationRules: number
  rtlSupport: boolean
  translationTimeMs: number
  status: string
  createdAt: string
}

export interface TranslateResponse {
  record: LanguageExpansion
  sampleTranslations: { key: string; source: string; translated: string }[]
  recommendations: string[]
}

export interface SupportedLanguage {
  code: string; name: string; native: string; region: string; rtl: boolean
}

export interface LangStats {
  totalTranslations: number
  avgCoveragePercent: number
  avgQualityScore: number
  totalKeysTranslated: number
  humanReviewedPercent: number
  byLanguage: { language: string; count: number; avgCoverage: number; avgQuality: number }[]
}

export async function listExpansions(): Promise<LanguageExpansion[]> {
  const res = await authFetch(`${API}/api/language-expansion`)
  if (!res.ok) throw new Error('Failed to list')
  return res.json()
}

export async function translateProject(projectName: string, targetLanguage: string, sourceLanguage: string): Promise<TranslateResponse> {
  const res = await authFetch(`${API}/api/language-expansion/translate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ projectName, targetLanguage, sourceLanguage }),
  })
  if (!res.ok) throw new Error('Failed to translate')
  return res.json()
}

export async function deleteExpansion(id: string): Promise<void> {
  const res = await authFetch(`${API}/api/language-expansion/${id}`, { method: 'DELETE' })
  if (!res.ok) throw new Error('Failed to delete')
}

export async function getLangStats(): Promise<LangStats> {
  const res = await authFetch(`${API}/api/language-expansion/stats`)
  if (!res.ok) throw new Error('Failed to get stats')
  return res.json()
}

export async function getLanguages(): Promise<SupportedLanguage[]> {
  const res = await fetch(`${API}/api/language-expansion/languages`)
  if (!res.ok) throw new Error('Failed to get languages')
  return res.json()
}
