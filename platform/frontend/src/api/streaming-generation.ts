import i18n from '../i18n'
import { getAuthHeaders } from './auth'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

const t = (key: string) => i18n.t(key)

function authHeaders(): Record<string, string> {
  return getAuthHeaders()
}

// === TypeScript Interfaces ===

export interface FileProgress {
  path: string
  status: string // pending, streaming, completed
  tokenCount: number
}

export interface GenerationStream {
  id: string
  devRequestId: number
  status: string // idle, streaming, paused, completed, cancelled, error
  currentFile?: string | null
  totalFiles: number
  completedFiles: number
  totalTokens: number
  streamedTokens: number
  progressPercent: number
  generatedFiles?: string | null // JSON string of FileProgress[]
  errorMessage?: string | null
  createdAt: string
  startedAt?: string | null
  completedAt?: string | null
}

export interface StreamEvent {
  type: string // stream_start, file_start, code_chunk, file_complete, progress_update, stream_complete, error
  data: string // JSON string
}

export interface StreamStartData {
  streamId: string
  totalFiles: number
  totalTokens: number
}

export interface FileStartData {
  file: string
  fileIndex: number
  totalFiles: number
}

export interface CodeChunkData {
  file: string
  chunk: string
  tokens: number
}

export interface FileCompleteData {
  file: string
  tokenCount: number
  completedFiles: number
  totalFiles: number
}

export interface ProgressUpdateData {
  streamedTokens: number
  totalTokens: number
  progressPercent: number
  currentFile: string
}

export interface StreamCompleteData {
  streamId: string
  totalTokens: number
  totalFiles: number
  durationMs: number
}

// === API Functions ===

export async function startGeneration(devRequestId: number): Promise<GenerationStream> {
  const response = await fetch(`${API_BASE_URL}/api/requests/${devRequestId}/generate/start`, {
    method: 'POST',
    headers: authHeaders(),
  })
  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error || t('api.error.startGenerationFailed'))
  }
  return response.json()
}

export async function cancelGeneration(devRequestId: number): Promise<GenerationStream> {
  const response = await fetch(`${API_BASE_URL}/api/requests/${devRequestId}/generate/cancel`, {
    method: 'POST',
    headers: authHeaders(),
  })
  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error || t('api.error.cancelGenerationFailed'))
  }
  return response.json()
}

export async function getStreamStatus(devRequestId: number): Promise<GenerationStream | null> {
  const response = await fetch(`${API_BASE_URL}/api/requests/${devRequestId}/generate/status`, {
    headers: authHeaders(),
  })
  if (!response.ok) return null
  return response.json()
}

export async function getStreamHistory(devRequestId: number): Promise<GenerationStream[]> {
  const response = await fetch(`${API_BASE_URL}/api/requests/${devRequestId}/generate/history`, {
    headers: authHeaders(),
  })
  if (!response.ok) return []
  return response.json()
}

export function connectToStream(
  devRequestId: number,
  onEvent: (event: StreamEvent) => void,
  onError?: (error: Event) => void,
): EventSource {
  const token = authHeaders().Authorization?.replace('Bearer ', '') || ''
  const url = `${API_BASE_URL}/api/requests/${devRequestId}/generate/stream?access_token=${token}`
  const eventSource = new EventSource(url)

  const eventTypes = [
    'stream_start',
    'file_start',
    'code_chunk',
    'file_complete',
    'progress_update',
    'stream_complete',
    'error',
  ]

  eventTypes.forEach((type) => {
    eventSource.addEventListener(type, (event: MessageEvent) => {
      onEvent({ type, data: event.data })
    })
  })

  if (onError) {
    eventSource.onerror = onError
  }

  return eventSource
}
