import i18n from '../i18n'
import { getAuthHeaders } from './auth'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

const t = (key: string) => i18n.t(key)

function authHeaders(): Record<string, string> {
  return getAuthHeaders()
}

// === TypeScript Interfaces ===

export interface LiveStreamEvent {
  type: string
  data: string // JSON string
}

export interface FileCreatedData {
  filename: string
  fileIndex: number
  totalFiles: number
  timestamp: string
}

export interface FileUpdatedData {
  filename: string
  content: string
  tokens: number
  progress: number
  timestamp: string
}

export interface BuildProgressData {
  progress: number
  streamedTokens: number
  totalTokens: number
  currentFile: string
  completedFiles: number
  totalFiles: number
  timestamp: string
}

export interface PreviewReadyData {
  streamId: string
  files: string[]
  totalTokens: number
  totalFiles: number
  durationMs: number
  timestamp: string
}

export interface LiveStreamStartData {
  streamId: string
  totalFiles: number
  totalTokens: number
  timestamp: string
}

export interface LiveStreamCompleteData {
  streamId: string
  totalTokens: number
  totalFiles: number
  durationMs: number
  timestamp: string
}

export interface GenerationStreamStatus {
  id: string
  devRequestId: number
  status: string
  currentFile?: string | null
  totalFiles: number
  completedFiles: number
  totalTokens: number
  streamedTokens: number
  progressPercent: number
  generatedFiles?: string | null
  errorMessage?: string | null
  createdAt: string
  startedAt?: string | null
  completedAt?: string | null
}

// === API Functions ===

export async function startLiveGeneration(devRequestId: number): Promise<GenerationStreamStatus> {
  const response = await fetch(`${API_BASE_URL}/api/requests/${devRequestId}/generate/start`, {
    method: 'POST',
    headers: authHeaders(),
  })
  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error || t('liveGeneration.error.startFailed'))
  }
  return response.json()
}

export async function cancelLiveGeneration(devRequestId: number): Promise<GenerationStreamStatus> {
  const response = await fetch(`${API_BASE_URL}/api/requests/${devRequestId}/generate/cancel`, {
    method: 'POST',
    headers: authHeaders(),
  })
  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error || t('liveGeneration.error.cancelFailed'))
  }
  return response.json()
}

export async function getLiveStreamStatus(devRequestId: number): Promise<GenerationStreamStatus | null> {
  const response = await fetch(`${API_BASE_URL}/api/requests/${devRequestId}/generate/status`, {
    headers: authHeaders(),
  })
  if (!response.ok) return null
  return response.json()
}

/**
 * Connect to the live stream SSE endpoint.
 * Listens for: stream_start, file_created, file_updated, build_progress, preview_ready, stream_complete, error
 */
export function connectToLiveStream(
  devRequestId: number,
  onEvent: (event: LiveStreamEvent) => void,
  onError?: (error: Event) => void,
): EventSource {
  const token = authHeaders().Authorization?.replace('Bearer ', '') || ''
  const url = `${API_BASE_URL}/api/requests/${devRequestId}/generate/live-stream?access_token=${token}`
  const eventSource = new EventSource(url)

  const eventTypes = [
    'stream_start',
    'file_created',
    'file_updated',
    'build_progress',
    'preview_ready',
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
