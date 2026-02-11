import { authFetch } from './auth'

export interface StreamingPreviewSession {
  id: string
  devRequestId: string | null
  sessionName: string
  status: string
  streamType: string
  totalTokens: number
  streamDurationMs: number
  chunksDelivered: number
  createdAt: string
  updatedAt: string
}

export interface StreamingPreviewDetail {
  id: string
  devRequestId: string | null
  sessionName: string
  status: string
  streamType: string
  generatedCode: string | null
  previewHtml: string | null
  reasoningSteps: string[]
  totalTokens: number
  streamDurationMs: number
  chunksDelivered: number
  actions: string[]
  createdAt: string
  updatedAt: string
}

export interface StreamingPreviewStats {
  totalSessions: number
  byType: Record<string, number>
  avgDurationMs: number
  totalTokens: number
  streamsCompleted: number
}

export async function listStreamingPreviewSessions(): Promise<{ sessions: StreamingPreviewSession[] }> {
  const res = await authFetch('/api/streaming-preview/sessions')
  if (!res.ok) throw new Error('Failed to fetch streaming preview sessions')
  return res.json()
}

export async function getStreamingPreviewSession(id: string): Promise<StreamingPreviewDetail> {
  const res = await authFetch(`/api/streaming-preview/sessions/${id}`)
  if (!res.ok) throw new Error('Failed to fetch streaming preview session')
  return res.json()
}

export async function createStreamingPreviewSession(data: {
  name: string
  streamType: string
  devRequestId?: string
}): Promise<StreamingPreviewDetail> {
  const res = await authFetch('/api/streaming-preview/sessions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error('Failed to create streaming preview session')
  return res.json()
}

export async function startStreamingPreview(id: string): Promise<StreamingPreviewDetail> {
  const res = await authFetch(`/api/streaming-preview/sessions/${id}/start`, {
    method: 'POST',
  })
  if (!res.ok) throw new Error('Failed to start streaming preview')
  return res.json()
}

export async function executeStreamingPreviewAction(
  id: string,
  action: string
): Promise<{ success: boolean; message: string }> {
  const res = await authFetch(`/api/streaming-preview/sessions/${id}/action`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action }),
  })
  if (!res.ok) throw new Error('Failed to execute action')
  return res.json()
}

export async function getStreamingPreviewStats(): Promise<StreamingPreviewStats> {
  const res = await authFetch('/api/streaming-preview/stats')
  if (!res.ok) throw new Error('Failed to fetch streaming preview stats')
  return res.json()
}
