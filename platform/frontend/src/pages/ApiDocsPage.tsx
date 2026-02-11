import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import {
  listApiDocs,
  createApiDoc,
  updateApiDoc,
  deleteApiDoc,
  generateSpec,
  getSdkLanguages,
  type ApiDocConfig,
  type ApiEndpoint,
  type SdkLanguage,
} from '../api/apidocs'

const HTTP_METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'] as const
const METHOD_COLORS: Record<string, string> = {
  GET: 'bg-green-600',
  POST: 'bg-blue-600',
  PUT: 'bg-yellow-600',
  PATCH: 'bg-orange-600',
  DELETE: 'bg-red-600',
}

export default function ApiDocsPage() {
  const { t } = useTranslation()
  const [docs, setDocs] = useState<ApiDocConfig[]>([])
  const [sdkLanguages, setSdkLanguages] = useState<SdkLanguage[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editingDoc, setEditingDoc] = useState<ApiDocConfig | null>(null)
  const [viewingSpec, setViewingSpec] = useState<ApiDocConfig | null>(null)

  // Editor state
  const [projectName, setProjectName] = useState('')
  const [description, setDescription] = useState('')
  const [endpoints, setEndpoints] = useState<ApiEndpoint[]>([])
  const [selectedSdkLangs, setSelectedSdkLangs] = useState<string[]>([])
  const [saving, setSaving] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      setLoading(true)
      const [docsData, langsData] = await Promise.all([listApiDocs(), getSdkLanguages()])
      setDocs(docsData)
      setSdkLanguages(langsData)
      setError('')
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : t('apiDocs.loadError'))
    } finally {
      setLoading(false)
    }
  }

  function startNew() {
    setProjectName('')
    setDescription('')
    setEndpoints([
      { name: 'listItems', path: '/api/items', method: 'GET', summary: 'List all items', tag: 'Items' },
      { name: 'getItem', path: '/api/items/{id}', method: 'GET', summary: 'Get item by ID', tag: 'Items' },
      { name: 'createItem', path: '/api/items', method: 'POST', summary: 'Create a new item', tag: 'Items', requestBody: 'CreateItemRequest' },
    ])
    setSelectedSdkLangs(['typescript'])
    setEditingDoc({ id: '', projectName: '', endpoints: [], hasOpenApiSpec: false, sdkLanguages: [], status: 'Draft', createdAt: '', updatedAt: '' })
    setViewingSpec(null)
  }

  function startEdit(doc: ApiDocConfig) {
    setProjectName(doc.projectName)
    setDescription(doc.description || '')
    setEndpoints(doc.endpoints)
    setSelectedSdkLangs(doc.sdkLanguages)
    setEditingDoc(doc)
    setViewingSpec(null)
  }

  function addEndpoint() {
    setEndpoints([...endpoints, { name: '', path: '/api/', method: 'GET', summary: '', tag: 'default' }])
  }

  function removeEndpoint(index: number) {
    setEndpoints(endpoints.filter((_, i) => i !== index))
  }

  function updateEndpoint(index: number, field: keyof ApiEndpoint, value: string) {
    const updated = [...endpoints]
    updated[index] = { ...updated[index], [field]: value }
    setEndpoints(updated)
  }

  function toggleSdkLang(langId: string) {
    setSelectedSdkLangs(prev =>
      prev.includes(langId) ? prev.filter(l => l !== langId) : [...prev, langId]
    )
  }

  async function handleSave() {
    if (!projectName.trim() || endpoints.length === 0) return
    try {
      setSaving(true)
      if (editingDoc && editingDoc.id) {
        const updated = await updateApiDoc(editingDoc.id, {
          projectName: projectName.trim(),
          description: description.trim() || undefined,
          endpoints,
          sdkLanguages: selectedSdkLangs,
        })
        setDocs(docs.map(d => d.id === updated.id ? updated : d))
      } else {
        const created = await createApiDoc({
          projectName: projectName.trim(),
          description: description.trim() || undefined,
          endpoints,
          sdkLanguages: selectedSdkLangs,
        })
        setDocs([created, ...docs])
      }
      setEditingDoc(null)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : t('apiDocs.saveError'))
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    try {
      setDeletingId(id)
      await deleteApiDoc(id)
      setDocs(docs.filter(d => d.id !== id))
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : t('apiDocs.deleteError'))
    } finally {
      setDeletingId(null)
    }
  }

  async function handleGenerate(doc: ApiDocConfig) {
    try {
      setGenerating(true)
      const updated = await generateSpec(doc.id)
      setDocs(docs.map(d => d.id === updated.id ? updated : d))
      setViewingSpec(updated)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : t('apiDocs.generateError'))
    } finally {
      setGenerating(false)
    }
  }

  function copySpec(specJson: string) {
    navigator.clipboard.writeText(specJson)
  }

  if (loading) {
    return <div className="text-gray-400 text-center py-12">{t('apiDocs.loading')}</div>
  }

  // Spec viewer
  if (viewingSpec) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <button onClick={() => setViewingSpec(null)} className="text-gray-400 hover:text-white text-sm">
            {t('apiDocs.backToList')}
          </button>
          <h3 className="text-xl font-bold">{viewingSpec.projectName} — OpenAPI Spec</h3>
        </div>

        <div className="flex gap-2 mb-4">
          <span className={`px-2 py-1 rounded text-xs font-medium ${
            viewingSpec.status === 'Generated' ? 'bg-green-600/20 text-green-400' :
            viewingSpec.status === 'Published' ? 'bg-blue-600/20 text-blue-400' :
            'bg-gray-600/20 text-gray-400'
          }`}>
            {viewingSpec.status}
          </span>
          {viewingSpec.sdkLanguages.map(lang => (
            <span key={lang} className="px-2 py-1 rounded text-xs font-medium bg-purple-600/20 text-purple-400">
              {lang}
            </span>
          ))}
        </div>

        {viewingSpec.openApiSpecJson && (
          <div className="bg-gray-800 rounded-lg p-4">
            <div className="flex justify-between items-center mb-3">
              <h4 className="text-sm font-medium text-gray-300">{t('apiDocs.specPreview')}</h4>
              <button
                onClick={() => copySpec(viewingSpec.openApiSpecJson!)}
                className="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded text-xs"
              >
                {t('apiDocs.copySpec')}
              </button>
            </div>
            <pre className="text-xs text-gray-300 overflow-auto max-h-96 bg-gray-900 rounded p-3">
              {JSON.stringify(JSON.parse(viewingSpec.openApiSpecJson), null, 2)}
            </pre>
          </div>
        )}

        <div className="bg-gray-800 rounded-lg p-4">
          <h4 className="text-sm font-medium text-gray-300 mb-3">{t('apiDocs.endpoints')}</h4>
          <div className="space-y-2">
            {viewingSpec.endpoints.map((ep, i) => (
              <div key={i} className="flex items-center gap-3 bg-gray-900 rounded p-3">
                <span className={`px-2 py-1 rounded text-xs font-bold text-white ${METHOD_COLORS[ep.method] || 'bg-gray-600'}`}>
                  {ep.method}
                </span>
                <span className="text-gray-300 font-mono text-sm">{ep.path}</span>
                <span className="text-gray-500 text-sm">{ep.summary}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // Editor
  if (editingDoc) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <button onClick={() => setEditingDoc(null)} className="text-gray-400 hover:text-white text-sm">
            {t('apiDocs.backToList')}
          </button>
          <h3 className="text-xl font-bold">
            {editingDoc.id ? t('apiDocs.editTitle') : t('apiDocs.createTitle')}
          </h3>
        </div>

        {error && <div className="bg-red-900/30 border border-red-700 rounded p-3 text-red-400 text-sm">{error}</div>}

        <div className="space-y-4">
          <input
            value={projectName}
            onChange={e => setProjectName(e.target.value)}
            placeholder={t('apiDocs.namePlaceholder')}
            className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white placeholder-gray-500"
          />
          <input
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder={t('apiDocs.descPlaceholder')}
            className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white placeholder-gray-500"
          />
        </div>

        <div>
          <div className="flex justify-between items-center mb-3">
            <h4 className="text-sm font-medium text-gray-300">{t('apiDocs.endpoints')}</h4>
            <button onClick={addEndpoint} className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs">
              {t('apiDocs.addEndpoint')}
            </button>
          </div>
          <div className="space-y-3">
            {endpoints.map((ep, i) => (
              <div key={i} className="bg-gray-800 rounded-lg p-3 space-y-2">
                <div className="flex gap-2">
                  <select
                    value={ep.method}
                    onChange={e => updateEndpoint(i, 'method', e.target.value)}
                    className="bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white text-sm"
                  >
                    {HTTP_METHODS.map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                  <input
                    value={ep.path}
                    onChange={e => updateEndpoint(i, 'path', e.target.value)}
                    placeholder="/api/endpoint"
                    className="flex-1 bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white text-sm font-mono"
                  />
                  <button onClick={() => removeEndpoint(i)} className="text-red-400 hover:text-red-300 text-sm px-2">
                    &times;
                  </button>
                </div>
                <div className="flex gap-2">
                  <input
                    value={ep.name || ''}
                    onChange={e => updateEndpoint(i, 'name', e.target.value)}
                    placeholder={t('apiDocs.operationName')}
                    className="flex-1 bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white text-sm"
                  />
                  <input
                    value={ep.summary || ''}
                    onChange={e => updateEndpoint(i, 'summary', e.target.value)}
                    placeholder={t('apiDocs.summary')}
                    className="flex-1 bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white text-sm"
                  />
                  <input
                    value={ep.tag || ''}
                    onChange={e => updateEndpoint(i, 'tag', e.target.value)}
                    placeholder={t('apiDocs.tag')}
                    className="w-24 bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white text-sm"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h4 className="text-sm font-medium text-gray-300 mb-3">{t('apiDocs.sdkLanguages')}</h4>
          <div className="flex gap-2 flex-wrap">
            {sdkLanguages.map(lang => (
              <button
                key={lang.id}
                onClick={() => toggleSdkLang(lang.id)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedSdkLangs.includes(lang.id)
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-800 text-gray-400 hover:text-white'
                }`}
              >
                {lang.name}
                <span className="text-xs ml-1 opacity-60">({lang.packageManager})</span>
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-3">
          <button onClick={() => setEditingDoc(null)} className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded">
            {t('apiDocs.cancel')}
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !projectName.trim() || endpoints.length === 0}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded"
          >
            {saving ? t('apiDocs.saving') : t('apiDocs.save')}
          </button>
        </div>
      </div>
    )
  }

  // List view
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xl font-bold">{t('apiDocs.title')}</h3>
          <p className="text-gray-400 text-sm mt-1">{t('apiDocs.subtitle')}</p>
        </div>
        <button onClick={startNew} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium">
          {t('apiDocs.createNew')}
        </button>
      </div>

      {error && <div className="bg-red-900/30 border border-red-700 rounded p-3 text-red-400 text-sm">{error}</div>}

      {docs.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="mx-auto mb-4 opacity-50"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><path d="M12 18v-6"/><path d="m9 15 3-3 3 3"/></svg>
          <p>{t('apiDocs.noDocs')}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {docs.map(doc => (
            <div key={doc.id} className="bg-gray-800 rounded-lg p-4">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h4 className="font-medium text-white">{doc.projectName}</h4>
                  {doc.description && <p className="text-gray-400 text-sm mt-1">{doc.description}</p>}
                  <div className="flex gap-2 mt-2">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                      doc.status === 'Generated' ? 'bg-green-600/20 text-green-400' :
                      doc.status === 'Published' ? 'bg-blue-600/20 text-blue-400' :
                      'bg-gray-600/20 text-gray-400'
                    }`}>
                      {doc.status}
                    </span>
                    <span className="text-gray-500 text-xs">{doc.endpoints.length} {t('apiDocs.endpointCount')}</span>
                    {doc.sdkLanguages.map(lang => (
                      <span key={lang} className="px-1.5 py-0.5 rounded text-xs bg-purple-600/20 text-purple-400">{lang}</span>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2">
                  {doc.hasOpenApiSpec && (
                    <button
                      onClick={() => setViewingSpec(doc)}
                      className="px-3 py-1 bg-green-600/20 hover:bg-green-600/30 text-green-400 rounded text-xs"
                    >
                      {t('apiDocs.viewSpec')}
                    </button>
                  )}
                  <button
                    onClick={() => handleGenerate(doc)}
                    disabled={generating}
                    className="px-3 py-1 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 rounded text-xs disabled:opacity-50"
                  >
                    {generating ? t('apiDocs.generating') : t('apiDocs.generate')}
                  </button>
                  <button onClick={() => startEdit(doc)} className="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded text-xs">
                    {t('apiDocs.edit')}
                  </button>
                  <button
                    onClick={() => handleDelete(doc.id)}
                    disabled={deletingId === doc.id}
                    className="px-3 py-1 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded text-xs disabled:opacity-50"
                  >
                    {deletingId === doc.id ? t('apiDocs.deleting') : t('apiDocs.delete')}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
