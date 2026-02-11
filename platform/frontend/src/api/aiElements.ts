import i18n from '../i18n'
import { authFetch } from './auth'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'
const t = (key: string) => i18n.t(key)

export interface AiElementsConfig {
  id: string
  streamingEnabled: boolean
  reasoningPanelEnabled: boolean
  livePreviewEnabled: boolean
  responseActionsEnabled: boolean
  themeMode: string
  activeModel: string
  totalStreams: number
  totalTokensStreamed: number
  totalComponentPreviews: number
  createdAt: string
  updatedAt: string
}

export interface AiElementComponent {
  id: string
  name: string
  description: string
  category: string
  icon: string
  status: string
}

export interface StreamSession {
  streamId: string
  status: string
  model: string
  estimatedTokens: number
  language: string
  prompt: string
  streamingEnabled: boolean
  reasoningPanelEnabled: boolean
  livePreviewEnabled: boolean
  startedAt: string
}

export interface StreamStatus {
  streamId: string
  status: string
  progress: number
  tokensStreamed: number
  completedAt?: string
}

export interface AiElementsStats {
  totalStreams: number
  totalTokensStreamed: number
  totalComponentPreviews: number
  averageStreamTokens: number
  activeModel: string
  themeMode: string
  recentStreams: PreviewHistoryEntry[]
}

export interface PreviewHistoryEntry {
  streamId: string
  prompt: string
  language: string
  tokenCount: number
  startedAt: string
}

export async function getAiElementsConfig(): Promise<AiElementsConfig> {
  const response = await authFetch(`${API_BASE_URL}/api/ai-elements/config`)
  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error || t('api.error.aiElementsConfigLoad'))
  }
  return response.json()
}

export async function updateAiElementsConfig(data: Partial<AiElementsConfig>): Promise<AiElementsConfig> {
  const response = await authFetch(`${API_BASE_URL}/api/ai-elements/config`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error || t('api.error.aiElementsConfigUpdate'))
  }
  return response.json()
}

export async function getAiElementComponents(): Promise<AiElementComponent[]> {
  const response = await authFetch(`${API_BASE_URL}/api/ai-elements/components`)
  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error || t('api.error.aiElementsComponentsLoad'))
  }
  return response.json()
}

export async function startStream(prompt: string, language?: string): Promise<StreamSession> {
  const response = await authFetch(`${API_BASE_URL}/api/ai-elements/stream/start`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, language }),
  })
  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error || t('api.error.aiElementsStreamStart'))
  }
  return response.json()
}

export async function getStreamStatus(streamId: string): Promise<StreamStatus> {
  const response = await authFetch(`${API_BASE_URL}/api/ai-elements/stream/${streamId}/status`)
  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error || t('api.error.aiElementsStreamStatus'))
  }
  return response.json()
}

export async function getAiElementsStats(): Promise<AiElementsStats> {
  const response = await authFetch(`${API_BASE_URL}/api/ai-elements/stats`)
  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error || t('api.error.aiElementsStatsLoad'))
  }
  return response.json()
}
