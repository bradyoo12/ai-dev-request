import i18n from '../i18n'
import { getAuthHeaders } from './auth'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

const t = (key: string) => i18n.t(key)

function authHeaders(): Record<string, string> {
  return getAuthHeaders()
}

// === Interfaces ===

export interface ContainerConfig {
  id: string
  projectId: number
  detectedStack: string
  dockerfile: string
  composeFile?: string | null
  k8sManifest?: string | null
  registryUrl?: string | null
  imageName: string
  imageTag: string
  buildStatus: string
  buildLogs?: string | null
  errorMessage?: string | null
  buildDurationMs: number
  createdAt: string
  builtAt?: string | null
  deployedAt?: string | null
}

export interface ContainerBuildStatus {
  projectId: number
  status: string
  imageName: string
  imageTag: string
  buildDurationMs: number
  errorMessage?: string | null
  builtAt?: string | null
  deployedAt?: string | null
}

export interface ContainerBuildLogs {
  projectId: number
  status: string
  logs: string
}

// === API Functions ===

export async function generateDockerfile(projectId: number): Promise<ContainerConfig> {
  const response = await fetch(`${API_BASE_URL}/api/projects/${projectId}/containers/generate`, {
    method: 'POST',
    headers: authHeaders(),
  })
  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error || t('api.error.containerGenerateFailed'))
  }
  return response.json()
}

export async function getContainerConfig(projectId: number): Promise<ContainerConfig> {
  const response = await fetch(`${API_BASE_URL}/api/projects/${projectId}/containers/config`, {
    headers: authHeaders(),
  })
  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error || t('api.error.containerConfigFailed'))
  }
  return response.json()
}

export async function triggerBuild(projectId: number): Promise<ContainerConfig> {
  const response = await fetch(`${API_BASE_URL}/api/projects/${projectId}/containers/build`, {
    method: 'POST',
    headers: authHeaders(),
  })
  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error || t('api.error.containerBuildFailed'))
  }
  return response.json()
}

export async function getBuildStatus(projectId: number): Promise<ContainerBuildStatus> {
  const response = await fetch(`${API_BASE_URL}/api/projects/${projectId}/containers/status`, {
    headers: authHeaders(),
  })
  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error || t('api.error.containerStatusFailed'))
  }
  return response.json()
}

export async function getBuildLogs(projectId: number): Promise<ContainerBuildLogs> {
  const response = await fetch(`${API_BASE_URL}/api/projects/${projectId}/containers/logs`, {
    headers: authHeaders(),
  })
  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error || t('api.error.containerLogsFailed'))
  }
  return response.json()
}

export async function deployContainer(projectId: number): Promise<ContainerConfig> {
  const response = await fetch(`${API_BASE_URL}/api/projects/${projectId}/containers/deploy`, {
    method: 'POST',
    headers: authHeaders(),
  })
  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error || t('api.error.containerDeployFailed'))
  }
  return response.json()
}

export async function generateK8sManifest(projectId: number): Promise<ContainerConfig> {
  const response = await fetch(`${API_BASE_URL}/api/projects/${projectId}/containers/k8s`, {
    method: 'POST',
    headers: authHeaders(),
  })
  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error || t('api.error.containerK8sFailed'))
  }
  return response.json()
}
