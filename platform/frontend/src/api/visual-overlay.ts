import { authFetch } from './auth'

export interface VisualOverlaySession {
  id: string
  userId: string
  devRequestId: string | null
  projectName: string
  selectedElementPath: string | null
  modificationsJson: string
  componentTreeJson: string
  status: string
  totalEdits: number
  undoCount: number
  redoCount: number
  viewportWidth: number
  viewportHeight: number
  previewUrl: string | null
  createdAt: string
  updatedAt: string
}

export interface ModificationEntry {
  elementPath: string
  property: string
  oldValue: string
  newValue: string
  timestamp: string
}

export interface ComponentTreeNode {
  path: string
  tag: string
  children: ComponentTreeNode[]
}

export interface OverlayProperty {
  name: string
  type: string
  label: string
  description: string
}

export interface OverlayStats {
  totalSessions: number
  totalEdits: number
  avgEditsPerSession: number
  mostEditedProperty: string
  activeSessions: number
  lastSession: string | null
}

export async function listOverlaySessions(): Promise<VisualOverlaySession[]> {
  const res = await authFetch('/api/visual-overlay/sessions')
  if (!res.ok) throw new Error('Failed to list sessions')
  return res.json()
}

export async function getOverlaySession(id: string): Promise<VisualOverlaySession> {
  const res = await authFetch(`/api/visual-overlay/sessions/${id}`)
  if (!res.ok) throw new Error('Failed to get session')
  return res.json()
}

export async function createOverlaySession(data: { projectName: string; previewUrl?: string }): Promise<VisualOverlaySession> {
  const res = await authFetch('/api/visual-overlay/sessions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error('Failed to create session')
  return res.json()
}

export async function selectElement(id: string, data: { elementPath: string }): Promise<VisualOverlaySession> {
  const res = await authFetch(`/api/visual-overlay/sessions/${id}/select`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error('Failed to select element')
  return res.json()
}

export async function applyModification(id: string, data: { elementPath: string; property: string; oldValue: string; newValue: string }): Promise<VisualOverlaySession> {
  const res = await authFetch(`/api/visual-overlay/sessions/${id}/modify`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error('Failed to apply modification')
  return res.json()
}

export async function undoModification(id: string): Promise<VisualOverlaySession> {
  const res = await authFetch(`/api/visual-overlay/sessions/${id}/undo`, {
    method: 'POST',
  })
  if (!res.ok) throw new Error('Failed to undo modification')
  return res.json()
}

export async function getOverlayStats(): Promise<OverlayStats> {
  const res = await authFetch('/api/visual-overlay/stats')
  if (!res.ok) throw new Error('Failed to get stats')
  return res.json()
}

export async function getOverlayProperties(): Promise<OverlayProperty[]> {
  const res = await authFetch('/api/visual-overlay/properties')
  if (!res.ok) throw new Error('Failed to get properties')
  return res.json()
}
