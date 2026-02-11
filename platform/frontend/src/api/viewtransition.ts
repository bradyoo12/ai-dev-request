import { authFetch } from './auth'

const API = import.meta.env.VITE_API_URL || ''

export interface ViewTransitionConfig {
  transitionPreset: string
  transitionDurationMs: number
  easingFunction: string
  enableViewTransitions: boolean
  enableFramerMotion: boolean
  enablePageTransitions: boolean
  enableComponentAnimations: boolean
  enableLoadingAnimations: boolean
}

export interface TransitionPreset {
  id: string
  name: string
  description: string
  duration: number
  css: string
  category: string
}

export interface EasingFunction {
  id: string
  name: string
  description: string
  curve: string
}

export interface GenerateCssResult {
  css: string
  viewTransitionCss: string
  preset: string
  durationMs: number
  easing: string
}

export interface DemoPage {
  id: string
  name: string
  description: string
  color: string
}

export interface ViewTransitionStats {
  currentPreset: string
  durationMs: number
  framerMotionEnabled: boolean
  projectsWithTransitions: number
  viewTransitionsSupported: boolean
  browserSupport: string
}

export async function getViewTransitionConfig(): Promise<ViewTransitionConfig> {
  const res = await authFetch(`${API}/api/view-transitions/config`)
  if (!res.ok) throw new Error('Failed to load config')
  return res.json()
}

export async function updateViewTransitionConfig(data: Partial<ViewTransitionConfig>): Promise<{ success: boolean }> {
  const res = await authFetch(`${API}/api/view-transitions/config`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error('Failed to update config')
  return res.json()
}

export async function getTransitionPresets(): Promise<TransitionPreset[]> {
  const res = await authFetch(`${API}/api/view-transitions/presets`)
  if (!res.ok) throw new Error('Failed to load presets')
  return res.json()
}

export async function getEasingFunctions(): Promise<EasingFunction[]> {
  const res = await authFetch(`${API}/api/view-transitions/easing-functions`)
  if (!res.ok) throw new Error('Failed to load easing functions')
  return res.json()
}

export async function generateCss(preset: string, durationMs: number, easing: string): Promise<GenerateCssResult> {
  const res = await authFetch(`${API}/api/view-transitions/generate-css`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ preset, durationMs, easing }),
  })
  if (!res.ok) throw new Error('Failed to generate CSS')
  return res.json()
}

export async function getDemoPages(): Promise<DemoPage[]> {
  const res = await authFetch(`${API}/api/view-transitions/demo`)
  if (!res.ok) throw new Error('Failed to load demo pages')
  return res.json()
}

export async function getViewTransitionStats(): Promise<ViewTransitionStats> {
  const res = await authFetch(`${API}/api/view-transitions/stats`)
  if (!res.ok) throw new Error('Failed to load stats')
  return res.json()
}
