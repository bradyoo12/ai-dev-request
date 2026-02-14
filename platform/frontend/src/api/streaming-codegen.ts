import i18n from '../i18n'
import { getAuthHeaders } from './auth'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

const t = (key: string) => i18n.t(key)

function authHeaders(): Record<string, string> {
  return getAuthHeaders()
}

// === TypeScript Interfaces ===

export interface StreamingCodeGenSession {
  id: string
  userId: string
  devRequestId?: number | null
  prompt?: string | null
  status: string // idle, streaming, building, preview_ready, completed, cancelled, error
  currentFile?: string | null
  totalFiles: number
  completedFiles: number
  totalTokens: number
  streamedTokens: number
  progressPercent: number
  generatedFilesJson?: string | null
  buildProgressJson?: string | null
  previewUrl?: string | null
  errorMessage?: string | null
  createdAt: string
  startedAt?: string | null
  completedAt?: string | null
}

export interface CodeGenFileProgress {
  path: string
  language: string
  status: string // pending, streaming, completed
  tokenCount: number
}

export interface CodeGenStreamStartData {
  sessionId: string
  totalFiles: number
  totalTokens: number
  prompt?: string
}

export interface CodeGenFileCreatedData {
  file: string
  language: string
  fileIndex: number
  totalFiles: number
}

export interface CodeGenCodeChunkData {
  file: string
  chunk: string
  tokens: number
}

export interface CodeGenFileUpdatedData {
  file: string
  language: string
  tokenCount: number
  completedFiles: number
  totalFiles: number
}

export interface CodeGenProgressUpdateData {
  streamedTokens: number
  totalTokens: number
  progressPercent: number
  currentFile: string
  completedFiles: number
  totalFiles: number
}

export interface CodeGenBuildProgressData {
  step: string
  status: string
  output: string
}

export interface CodeGenPreviewReadyData {
  previewUrl: string
  sessionId: string
}

export interface CodeGenStreamCompleteData {
  sessionId: string
  totalTokens: number
  totalFiles: number
  durationMs: number
  previewUrl?: string
}

export interface CodeGenStreamEvent {
  type: string
  data: string
}

// === API Functions ===

export async function createCodeGenSession(prompt?: string, devRequestId?: number): Promise<StreamingCodeGenSession> {
  const response = await fetch(`${API_BASE_URL}/api/streaming-codegen/sessions`, {
    method: 'POST',
    headers: { ...authHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, devRequestId }),
  })
  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error || t('api.error.createSessionFailed'))
  }
  return response.json()
}

export async function getCodeGenSession(sessionId: string): Promise<StreamingCodeGenSession | null> {
  const response = await fetch(`${API_BASE_URL}/api/streaming-codegen/sessions/${sessionId}`, {
    headers: authHeaders(),
  })
  if (!response.ok) return null
  return response.json()
}

export async function getUserCodeGenSessions(): Promise<StreamingCodeGenSession[]> {
  const response = await fetch(`${API_BASE_URL}/api/streaming-codegen/sessions`, {
    headers: authHeaders(),
  })
  if (!response.ok) return []
  return response.json()
}

export async function cancelCodeGenSession(sessionId: string): Promise<StreamingCodeGenSession> {
  const response = await fetch(`${API_BASE_URL}/api/streaming-codegen/sessions/${sessionId}/cancel`, {
    method: 'POST',
    headers: authHeaders(),
  })
  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error || t('api.error.cancelSessionFailed'))
  }
  return response.json()
}

export function connectToCodeGenStream(
  sessionId: string,
  onEvent: (event: CodeGenStreamEvent) => void,
  onError?: (error: Event) => void,
): EventSource {
  const token = authHeaders().Authorization?.replace('Bearer ', '') || ''
  const url = `${API_BASE_URL}/api/streaming-codegen/sessions/${sessionId}/stream?access_token=${token}`
  const eventSource = new EventSource(url)

  const eventTypes = [
    'stream_start',
    'file_created',
    'code_chunk',
    'file_updated',
    'progress_update',
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
