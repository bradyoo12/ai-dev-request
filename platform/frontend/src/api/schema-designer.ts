import i18n from '../i18n'
import { getAuthHeaders } from './auth'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'
const t = (key: string) => i18n.t(key)

export interface DataSchema {
  id: string
  devRequestId: string
  prompt: string
  entitiesJson: string
  relationshipsJson: string
  entityCount: number
  relationshipCount: number
  validationJson: string
  generatedSql: string
  generatedEntities: string
  generatedControllers: string
  generatedFrontend: string
  status: string
  createdAt: string
}

export interface SchemaEntity {
  name: string
  columns: SchemaColumn[]
}

export interface SchemaColumn {
  name: string
  type: string
  nullable: boolean
  isPrimaryKey: boolean
}

export interface SchemaRelationship {
  fromEntity: string
  toEntity: string
  type: string
  foreignKey: string
}

export interface SchemaValidation {
  severity: string
  message: string
  entity: string
}

function authHeaders() {
  return getAuthHeaders()
}

export async function designSchema(requestId: string, prompt: string): Promise<DataSchema> {
  const response = await fetch(`${API_BASE_URL}/api/requests/${requestId}/schema/design`, {
    method: 'POST',
    headers: { ...authHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt }),
  })
  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error || t('schemaDesigner.error.designFailed'))
  }
  return response.json()
}

export async function getSchema(requestId: string): Promise<DataSchema> {
  const response = await fetch(`${API_BASE_URL}/api/requests/${requestId}/schema`, {
    headers: authHeaders(),
  })
  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error || t('schemaDesigner.error.loadFailed'))
  }
  return response.json()
}

export async function updateSchema(requestId: string, schemaId: string, entitiesJson: string, relationshipsJson: string): Promise<DataSchema> {
  const response = await fetch(`${API_BASE_URL}/api/requests/${requestId}/schema/${schemaId}`, {
    method: 'PUT',
    headers: { ...authHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ entitiesJson, relationshipsJson }),
  })
  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error || t('schemaDesigner.error.updateFailed'))
  }
  return response.json()
}

export async function validateSchema(requestId: string, schemaId: string): Promise<DataSchema> {
  const response = await fetch(`${API_BASE_URL}/api/requests/${requestId}/schema/${schemaId}/validate`, {
    method: 'POST',
    headers: authHeaders(),
  })
  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error || t('schemaDesigner.error.validateFailed'))
  }
  return response.json()
}

export async function generateCode(requestId: string, schemaId: string): Promise<DataSchema> {
  const response = await fetch(`${API_BASE_URL}/api/requests/${requestId}/schema/${schemaId}/generate`, {
    method: 'POST',
    headers: authHeaders(),
  })
  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error || t('schemaDesigner.error.generateFailed'))
  }
  return response.json()
}
