import i18n from '../i18n'
import { getAuthHeaders } from './auth'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

const t = (key: string) => i18n.t(key)

function authHeaders(): Record<string, string> {
  return getAuthHeaders()
}

export interface BlueprintSummary {
  id: number
  name: string
  serviceCount: number
  createdAt: string
}

export interface ServiceDef {
  Name: string
  Type: string
  Tech: string
  Port: number
  Description: string
  Endpoints: string[]
}

export interface DependencyEdge {
  From: string
  To: string
  Protocol: string
  Description: string
}

export interface BlueprintDetail {
  id: number
  name: string
  servicesJson: string
  dependenciesJson: string
  gatewayConfigJson?: string
  dockerComposeYaml?: string
  k8sManifestYaml?: string
  serviceCount: number
  createdAt: string
}

export async function getBlueprints(): Promise<BlueprintSummary[]> {
  const response = await fetch(`${API_BASE_URL}/api/microservices/blueprints`, {
    headers: authHeaders(),
  })
  if (!response.ok) throw new Error(t('api.error.blueprintsFailed'))
  return response.json()
}

export async function getBlueprint(id: number): Promise<BlueprintDetail> {
  const response = await fetch(`${API_BASE_URL}/api/microservices/blueprints/${id}`, {
    headers: authHeaders(),
  })
  if (!response.ok) throw new Error(t('api.error.blueprintsFailed'))
  return response.json()
}

export async function generateBlueprint(devRequestId: string): Promise<BlueprintDetail> {
  const response = await fetch(`${API_BASE_URL}/api/microservices/blueprints/generate`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ devRequestId }),
  })
  if (!response.ok) throw new Error(t('api.error.blueprintGenerateFailed'))
  return response.json()
}

export async function deleteBlueprint(id: number): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/microservices/blueprints/${id}`, {
    method: 'DELETE',
    headers: authHeaders(),
  })
  if (!response.ok) throw new Error(t('api.error.blueprintDeleteFailed'))
}
