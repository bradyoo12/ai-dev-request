import i18n from '../i18n'
import { authFetch } from './auth'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'
const t = (key: string) => i18n.t(key)

export interface VoiceConfig {
  id: string
  language: string
  continuousMode: boolean
  autoPunctuate: boolean
  ttsEnabled: boolean
  ttsVoice?: string
  ttsRate: number
  sessionCount: number
  totalDurationSeconds: number
  createdAt: string
  updatedAt: string
}

export interface VoiceStats {
  sessionCount: number
  totalDurationSeconds: number
  averageDurationSeconds: number
  language: string
  continuousMode: boolean
  ttsEnabled: boolean
}

export interface VoiceLanguage {
  code: string
  name: string
  flag: string
}

export interface TranscriptionResult {
  sessionCount: number
  totalDurationSeconds: number
  text: string
  language: string
  durationSeconds: number
}

export async function getVoiceConfig(): Promise<VoiceConfig> {
  const response = await authFetch(`${API_BASE_URL}/api/voice/config`)
  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error || t('api.error.voiceConfigLoad'))
  }
  return response.json()
}

export async function updateVoiceConfig(data: Partial<VoiceConfig>): Promise<VoiceConfig> {
  const response = await authFetch(`${API_BASE_URL}/api/voice/config`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error || t('api.error.voiceConfigUpdate'))
  }
  return response.json()
}

export async function logTranscription(text: string, durationSeconds: number, language?: string): Promise<TranscriptionResult> {
  const response = await authFetch(`${API_BASE_URL}/api/voice/transcription`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, durationSeconds, language }),
  })
  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error || t('api.error.voiceTranscription'))
  }
  return response.json()
}

export async function getVoiceStats(): Promise<VoiceStats> {
  const response = await authFetch(`${API_BASE_URL}/api/voice/stats`)
  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error || t('api.error.voiceStatsLoad'))
  }
  return response.json()
}

export async function getVoiceLanguages(): Promise<VoiceLanguage[]> {
  const response = await authFetch(`${API_BASE_URL}/api/voice/languages`)
  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error || t('api.error.voiceLanguagesLoad'))
  }
  return response.json()
}
