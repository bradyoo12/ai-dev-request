import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import type { NlSchema, SchemaTable, SchemaRelationship, ExportFormat, NlSchemaStats } from '../api/nlschema'
import { generateSchema, refineSchema, listSchemas, getExportFormats, getSchemaGallery, getNlSchemaStats } from '../api/nlschema'

type Tab = 'generate' | 'schemas' | 'gallery' | 'stats'

export default function NlSchemaDesignerPage() {
  const { t } = useTranslation()
  const [tab, setTab] = useState<Tab>('generate')
  const [description, setDescription] = useState('')
  const [schemaName, setSchemaName] = useState('')
  const [dbType, setDbType] = useState('postgresql')
  const [schema, setSchema] = useState<NlSchema | null>(null)
  const [schemas, setSchemas] = useState<NlSchema[]>([])
  const [gallery, setGallery] = useState<NlSchema[]>([])
  const [formats, setFormats] = useState<ExportFormat[]>([])
  const [stats, setStats] = useState<NlSchemaStats | null>(null)
  const [generating, setGenerating] = useState(false)
  const [refineMsg, setRefineMsg] = useState('')

  useEffect(() => {
    if (tab === 'schemas') listSchemas().then(setSchemas).catch(() => {})
    if (tab === 'gallery') getSchemaGallery().then(setGallery).catch(() => {})
    if (tab === 'stats') getNlSchemaStats().then(setStats).catch(() => {})
    if (tab === 'generate') getExportFormats().then(setFormats).catch(() => {})
  }, [tab])

  const handleGenerate = async () => {
    if (!description.trim()) return
    setGenerating(true)
    try {
      const result = await generateSchema(description, schemaName || 'Untitled Schema', dbType)
      setSchema(result)
    } catch { /* ignore */ }
    setGenerating(false)
  }

  const handleRefine = async () => {
    if (!schema || !refineMsg.trim()) return
    try {
      const result = await refineSchema(schema.id, refineMsg)
      setSchema(result)
      setRefineMsg('')
    } catch { /* ignore */ }
  }

  const parseTables = (json: string): SchemaTable[] => { try { return JSON.parse(json) } catch { return [] } }
  const parseRelationships = (json: string): SchemaRelationship[] => { try { return JSON.parse(json) } catch { return [] } }

  const dbTypes = [
    { id: 'postgresql', name: 'PostgreSQL' },
    { id: 'mysql', name: 'MySQL' },
    { id: 'supabase', name: 'Supabase' },
    { id: 'sqlite', name: 'SQLite' },
  ]

  return (
    <div>
      <h3 className="text-xl font-bold mb-4">{t('nlSchema.title', 'Schema Designer')}</h3>
      <p className="text-gray-400 text-sm mb-6">{t('nlSchema.subtitle', 'Describe your data model in plain language and get a complete database schema')}</p>

      <div className="flex gap-2 mb-6">
        {(['generate', 'schemas', 'gallery', 'stats'] as Tab[]).map((t2) => (
          <button
            key={t2}
            onClick={() => setTab(t2)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === t2 ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'
            }`}
          >
            {t(`nlSchema.tabs.${t2}`, t2.charAt(0).toUpperCase() + t2.slice(1))}
          </button>
        ))}
      </div>

      {tab === 'generate' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2">
              <label className="block text-sm font-medium mb-2">{t('nlSchema.describeData', 'Describe your data model')}</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t('nlSchema.placeholder', 'Users can create posts with comments. Posts have tags. Users can follow each other...')}
                rows={4}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-sm placeholder-gray-500 focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-2">{t('nlSchema.schemaName', 'Schema Name')}</label>
                <input
                  value={schemaName}
                  onChange={(e) => setSchemaName(e.target.value)}
                  placeholder="My App Schema"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2 text-sm placeholder-gray-500 focus:border-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">{t('nlSchema.database', 'Database')}</label>
                <div className="grid grid-cols-2 gap-2">
                  {dbTypes.map((db) => (
                    <button
                      key={db.id}
                      onClick={() => setDbType(db.id)}
                      className={`px-3 py-2 rounded-lg text-xs font-medium border ${
                        dbType === db.id ? 'border-blue-500 bg-blue-900/20 text-blue-400' : 'border-gray-700 bg-gray-800 text-gray-400'
                      }`}
                    >
                      {db.name}
                    </button>
                  ))}
                </div>
              </div>
              <button
                onClick={handleGenerate}
                disabled={generating || !description.trim()}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {generating ? t('nlSchema.generating', 'Generating...') : t('nlSchema.generate', 'Generate Schema')}
              </button>
            </div>
          </div>

          {schema && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h4 className="font-medium">{t('nlSchema.erdPreview', 'Schema Preview')}</h4>
                <div className="bg-gray-900 border border-gray-700 rounded-lg p-4 space-y-3">
                  {parseTables(schema.tablesJson).map((table) => (
                    <div key={table.name} className="bg-gray-800 border border-gray-700 rounded-lg overflow-hidden">
                      <div className="bg-blue-900/30 px-3 py-2 border-b border-gray-700">
                        <span className="font-medium text-sm text-blue-400">{table.name}</span>
                        <span className="text-xs text-gray-500 ml-2">{table.columns.length} columns</span>
                      </div>
                      <div className="p-2">
                        {table.columns.map((col) => (
                          <div key={col.name} className="flex items-center justify-between text-xs py-1 px-1">
                            <span className={col.primaryKey ? 'text-yellow-400 font-medium' : 'text-gray-300'}>
                              {col.primaryKey ? '🔑 ' : ''}{col.name}
                            </span>
                            <span className="text-gray-500 font-mono">{col.type}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                  {parseRelationships(schema.relationshipsJson).length > 0 && (
                    <div>
                      <div className="text-xs text-gray-500 mb-2">{t('nlSchema.relationships', 'Relationships')}</div>
                      {parseRelationships(schema.relationshipsJson).map((rel, i) => (
                        <div key={i} className="text-xs text-gray-400 flex items-center gap-2 py-1">
                          <span className="text-blue-400">{rel.from}</span>
                          <span>→</span>
                          <span className="text-green-400">{rel.to}</span>
                          <span className="text-gray-600">({rel.type})</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-gray-800 border border-gray-700 rounded-lg p-3 text-center">
                    <div className="text-lg font-bold">{schema.tableCount}</div>
                    <div className="text-xs text-gray-400">{t('nlSchema.tables', 'Tables')}</div>
                  </div>
                  <div className="bg-gray-800 border border-gray-700 rounded-lg p-3 text-center">
                    <div className="text-lg font-bold">{schema.columnCount}</div>
                    <div className="text-xs text-gray-400">{t('nlSchema.columns', 'Columns')}</div>
                  </div>
                  <div className="bg-gray-800 border border-gray-700 rounded-lg p-3 text-center">
                    <div className="text-lg font-bold">{schema.relationshipCount}</div>
                    <div className="text-xs text-gray-400">{t('nlSchema.rels', 'Relations')}</div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium">{t('nlSchema.generatedSql', 'Generated SQL')}</h4>
                <div className="bg-gray-900 border border-gray-700 rounded-lg p-4 max-h-64 overflow-y-auto">
                  <pre className="text-sm text-green-400 font-mono whitespace-pre-wrap">{schema.generatedSql}</pre>
                </div>
                <div>
                  <div className="text-sm font-medium mb-2">{t('nlSchema.exportAs', 'Export As')}</div>
                  <div className="flex gap-2 flex-wrap">
                    {formats.map((f) => (
                      <button key={f.id} className="px-3 py-1 bg-gray-800 border border-gray-700 rounded-lg text-xs text-gray-400 hover:text-white hover:border-gray-500 transition-colors">
                        {f.name} ({f.extension})
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="text-sm font-medium mb-2">{t('nlSchema.refine', 'Refine Schema')}</div>
                  <div className="flex gap-2">
                    <input
                      value={refineMsg}
                      onChange={(e) => setRefineMsg(e.target.value)}
                      placeholder={t('nlSchema.refinePlaceholder', 'Add a role field to users...')}
                      className="flex-1 bg-gray-800 border border-gray-700 rounded-lg p-2 text-sm placeholder-gray-500 focus:border-blue-500 focus:outline-none"
                      onKeyDown={(e) => e.key === 'Enter' && handleRefine()}
                    />
                    <button onClick={handleRefine} className="px-4 py-2 bg-gray-700 text-white rounded-lg text-sm hover:bg-gray-600 transition-colors">
                      {t('nlSchema.send', 'Send')}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {tab === 'schemas' && (
        <div className="space-y-3">
          {schemas.length === 0 && (
            <div className="text-center py-12 text-gray-500 text-sm">{t('nlSchema.noSchemas', 'No schemas yet. Generate your first schema!')}</div>
          )}
          {schemas.map((s) => (
            <div key={s.id} className="bg-gray-800 border border-gray-700 rounded-lg p-4 flex items-center justify-between">
              <div>
                <div className="font-medium text-sm">{s.schemaName}</div>
                <div className="text-xs text-gray-400 mt-1">{s.tableCount} tables, {s.columnCount} columns, {s.relationshipCount} relations</div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs px-2 py-0.5 rounded bg-gray-700 text-gray-400">{s.databaseType}</span>
                <span className="text-xs text-gray-500">{new Date(s.updatedAt).toLocaleDateString()}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'gallery' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {gallery.map((s) => (
            <div key={s.id} className="bg-gray-800 border border-gray-700 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-sm">{s.schemaName}</span>
                <span className="text-xs px-2 py-0.5 rounded bg-gray-700 text-gray-400">{s.databaseType}</span>
              </div>
              <p className="text-xs text-gray-400 mb-3 line-clamp-2">{s.naturalLanguageInput}</p>
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>{s.tableCount} tables</span>
                <div className="flex gap-3">
                  <span>{s.viewCount} views</span>
                  <span>{s.forkCount} forks</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'stats' && stats && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold">{stats.totalSchemas}</div>
              <div className="text-sm text-gray-400">{t('nlSchema.stats.schemas', 'Schemas')}</div>
            </div>
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold">{stats.totalTables}</div>
              <div className="text-sm text-gray-400">{t('nlSchema.stats.tables', 'Total Tables')}</div>
            </div>
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold">{stats.totalRelationships}</div>
              <div className="text-sm text-gray-400">{t('nlSchema.stats.relationships', 'Relationships')}</div>
            </div>
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold">{stats.totalRefinements}</div>
              <div className="text-sm text-gray-400">{t('nlSchema.stats.refinements', 'Refinements')}</div>
            </div>
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold">{stats.totalTokensUsed.toLocaleString()}</div>
              <div className="text-sm text-gray-400">{t('nlSchema.stats.tokens', 'Tokens Used')}</div>
            </div>
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold">{stats.favoriteDatabase}</div>
              <div className="text-sm text-gray-400">{t('nlSchema.stats.favorite', 'Favorite DB')}</div>
            </div>
          </div>
          {stats.recentSchemas.length > 0 && (
            <div>
              <h4 className="font-medium mb-3">{t('nlSchema.stats.recent', 'Recent Schemas')}</h4>
              <div className="space-y-2">
                {stats.recentSchemas.map((s, i) => (
                  <div key={i} className="bg-gray-800 border border-gray-700 rounded-lg p-3 flex items-center justify-between">
                    <div>
                      <span className="font-medium text-sm">{s.schemaName}</span>
                      <span className="text-xs text-gray-400 ml-2">{s.tableCount} tables</span>
                    </div>
                    <span className="text-xs text-gray-500">{new Date(s.createdAt).toLocaleDateString()}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
