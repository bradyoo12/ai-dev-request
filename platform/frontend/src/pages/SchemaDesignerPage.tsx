import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { designSchema, getSchema, validateSchema, generateCode } from '../api/schema-designer'
import type { DataSchema, SchemaEntity, SchemaRelationship, SchemaValidation } from '../api/schema-designer'

export default function SchemaDesignerPage() {
  const { t } = useTranslation()
  const [requestId, setRequestId] = useState('')
  const [prompt, setPrompt] = useState('')
  const [schema, setSchema] = useState<DataSchema | null>(null)
  const [entities, setEntities] = useState<SchemaEntity[]>([])
  const [relationships, setRelationships] = useState<SchemaRelationship[]>([])
  const [validations, setValidations] = useState<SchemaValidation[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [activeCodeTab, setActiveCodeTab] = useState<'sql' | 'entities' | 'controllers' | 'frontend'>('sql')

  function parseSchema(s: DataSchema) {
    setSchema(s)
    try { setEntities(JSON.parse(s.entitiesJson || '[]')) } catch { setEntities([]) }
    try { setRelationships(JSON.parse(s.relationshipsJson || '[]')) } catch { setRelationships([]) }
    try { setValidations(JSON.parse(s.validationJson || '[]')) } catch { setValidations([]) }
  }

  async function handleDesign() {
    if (!requestId.trim() || !prompt.trim()) return
    setLoading(true)
    setError('')
    try {
      const result = await designSchema(requestId, prompt)
      parseSchema(result)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : t('schemaDesigner.error.designFailed'))
    } finally {
      setLoading(false)
    }
  }

  async function handleLoad() {
    if (!requestId.trim()) return
    setLoading(true)
    setError('')
    try {
      const result = await getSchema(requestId)
      parseSchema(result)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : t('schemaDesigner.error.loadFailed'))
    } finally {
      setLoading(false)
    }
  }

  async function handleValidate() {
    if (!schema) return
    setLoading(true)
    setError('')
    try {
      const result = await validateSchema(requestId, schema.id)
      parseSchema(result)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : t('schemaDesigner.error.validateFailed'))
    } finally {
      setLoading(false)
    }
  }

  async function handleGenerate() {
    if (!schema) return
    setLoading(true)
    setError('')
    try {
      const result = await generateCode(requestId, schema.id)
      parseSchema(result)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : t('schemaDesigner.error.generateFailed'))
    } finally {
      setLoading(false)
    }
  }

  const codeContent = schema ? {
    sql: schema.generatedSql,
    entities: schema.generatedEntities,
    controllers: schema.generatedControllers,
    frontend: schema.generatedFrontend,
  } : { sql: '', entities: '', controllers: '', frontend: '' }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-semibold mb-1">{t('schemaDesigner.title')}</h3>
        <p className="text-warm-400 text-sm">{t('schemaDesigner.subtitle')}</p>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-red-400 text-sm">{error}</div>
      )}

      {/* Input Section */}
      <div className="bg-warm-800 rounded-lg p-4 space-y-3">
        <div>
          <label className="block text-sm text-warm-300 mb-1">{t('schemaDesigner.requestIdLabel')}</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={requestId}
              onChange={(e) => setRequestId(e.target.value)}
              placeholder={t('schemaDesigner.requestIdPlaceholder')}
              className="flex-1 bg-warm-900 border border-warm-700 rounded px-3 py-2 text-sm text-white placeholder-warm-500"
            />
            <button
              onClick={handleLoad}
              disabled={loading || !requestId.trim()}
              className="px-4 py-2 bg-warm-700 hover:bg-warm-600 disabled:opacity-50 rounded text-sm"
            >
              {t('schemaDesigner.loadExisting')}
            </button>
          </div>
        </div>
        <div>
          <label className="block text-sm text-warm-300 mb-1">{t('schemaDesigner.promptLabel')}</label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder={t('schemaDesigner.promptPlaceholder')}
            rows={3}
            className="w-full bg-warm-900 border border-warm-700 rounded px-3 py-2 text-sm text-white placeholder-warm-500 resize-none"
          />
        </div>
        <button
          onClick={handleDesign}
          disabled={loading || !requestId.trim() || !prompt.trim()}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 rounded text-sm font-medium"
        >
          {loading ? t('schemaDesigner.designing') : t('schemaDesigner.designSchema')}
        </button>
      </div>

      {/* Schema Overview */}
      {schema && (
        <div className="space-y-4">
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-warm-800 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-blue-400">{schema.entityCount}</div>
              <div className="text-xs text-warm-400">{t('schemaDesigner.entities')}</div>
            </div>
            <div className="bg-warm-800 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-green-400">{schema.relationshipCount}</div>
              <div className="text-xs text-warm-400">{t('schemaDesigner.relationships')}</div>
            </div>
            <div className="bg-warm-800 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-yellow-400">{validations.length}</div>
              <div className="text-xs text-warm-400">{t('schemaDesigner.validationIssues')}</div>
            </div>
            <div className="bg-warm-800 rounded-lg p-3 text-center">
              <div className={`text-sm font-medium px-2 py-1 rounded ${
                schema.status === 'validated' ? 'bg-green-500/20 text-green-400'
                : schema.status === 'generated' ? 'bg-blue-500/20 text-blue-400'
                : 'bg-yellow-500/20 text-yellow-400'
              }`}>
                {schema.status}
              </div>
              <div className="text-xs text-warm-400 mt-1">{t('schemaDesigner.status')}</div>
            </div>
          </div>

          {/* Entity List */}
          {entities.length > 0 && (
            <div className="bg-warm-800 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-warm-300 mb-3">{t('schemaDesigner.entityList')}</h4>
              <div className="space-y-3">
                {entities.map((entity, idx) => (
                  <div key={idx} className="bg-warm-900 rounded p-3">
                    <div className="font-medium text-blue-300 mb-2">{entity.name}</div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-1">
                      {entity.columns.map((col, cidx) => (
                        <div key={cidx} className="text-xs flex items-center gap-2">
                          {col.isPrimaryKey && <span className="text-yellow-400">PK</span>}
                          <span className="text-warm-300">{col.name}</span>
                          <span className="text-warm-500">{col.type}</span>
                          {col.nullable && <span className="text-warm-600">nullable</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Relationships */}
          {relationships.length > 0 && (
            <div className="bg-warm-800 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-warm-300 mb-3">{t('schemaDesigner.relationshipList')}</h4>
              <div className="space-y-2">
                {relationships.map((rel, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-sm">
                    <span className="text-blue-300">{rel.fromEntity}</span>
                    <span className="text-warm-500">{rel.type}</span>
                    <span className="text-green-300">{rel.toEntity}</span>
                    <span className="text-warm-600 text-xs">({rel.foreignKey})</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Validation Issues */}
          {validations.length > 0 && (
            <div className="bg-warm-800 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-warm-300 mb-3">{t('schemaDesigner.validationResults')}</h4>
              <div className="space-y-2">
                {validations.map((v, idx) => (
                  <div key={idx} className={`text-sm p-2 rounded ${
                    v.severity === 'error' ? 'bg-red-500/10 text-red-400'
                    : v.severity === 'warning' ? 'bg-yellow-500/10 text-yellow-400'
                    : 'bg-blue-500/10 text-blue-400'
                  }`}>
                    <span className="font-medium">[{v.entity}]</span> {v.message}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2">
            <button
              onClick={handleValidate}
              disabled={loading}
              className="px-4 py-2 bg-yellow-600 hover:bg-yellow-500 disabled:opacity-50 rounded text-sm font-medium"
            >
              {t('schemaDesigner.validate')}
            </button>
            <button
              onClick={handleGenerate}
              disabled={loading}
              className="px-4 py-2 bg-green-600 hover:bg-green-500 disabled:opacity-50 rounded text-sm font-medium"
            >
              {t('schemaDesigner.generateCode')}
            </button>
          </div>

          {/* Generated Code */}
          {(codeContent.sql || codeContent.entities || codeContent.controllers || codeContent.frontend) && (
            <div className="bg-warm-800 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-warm-300 mb-3">{t('schemaDesigner.generatedCode')}</h4>
              <div className="flex gap-1 mb-3 bg-warm-900 rounded p-1">
                {(['sql', 'entities', 'controllers', 'frontend'] as const).map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveCodeTab(tab)}
                    className={`px-3 py-1 rounded text-xs font-medium ${
                      activeCodeTab === tab ? 'bg-warm-700 text-white' : 'text-warm-400 hover:text-white'
                    }`}
                  >
                    {t(`schemaDesigner.codeTab.${tab}`)}
                  </button>
                ))}
              </div>
              <pre className="bg-warm-900 rounded p-3 text-xs text-warm-300 overflow-x-auto max-h-96">
                {codeContent[activeCodeTab] || t('schemaDesigner.noCodeYet')}
              </pre>
            </div>
          )}
        </div>
      )}

      {/* Empty State */}
      {!schema && !loading && (
        <div className="text-center py-12 text-warm-500">
          <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="mx-auto mb-4 opacity-50"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5V19A9 3 0 0 0 21 19V5"/><path d="M3 12A9 3 0 0 0 21 12"/></svg>
          <p className="text-sm">{t('schemaDesigner.emptyState')}</p>
        </div>
      )}
    </div>
  )
}
